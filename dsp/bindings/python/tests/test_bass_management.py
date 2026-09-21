from __future__ import annotations

import unittest
import tempfile
from pathlib import Path

import numpy as np

from effetune import AssetData, BassManagement, Bundle, Chain
from effetune.errors import AssetError, ValidationError


def routing():
    return dict(roles=[2, 0, 3, 3] + [0] * 12,
                routes=[12] + [0] * 15, subs=12)


class BassManagementTests(unittest.TestCase):
    def test_iir_and_delay_only_linear_do_not_need_assets(self):
        source = np.zeros((4, 256), dtype=np.float32)
        source[0, 0] = 2
        output = Chain([BassManagement(**routing())]).process(source, sample_rate=48000)
        np.testing.assert_allclose(output[2:4, 0], [1, 1], atol=1e-6)
        with Chain([BassManagement(phase="Linear", taps="8192")]).stream(
                sample_rate=48000, channels=4) as stream:
            self.assertEqual(stream.latency_samples, 4224)

    def test_unconfigured_managed_lfe_roles_do_not_need_assets(self):
        roles = [1, 2] + [0] * 14
        frequencies = [81] * 16
        slopes = [48] * 16
        routes = [0] * 16
        route_inversions = [0] * 16
        for phase in ("IIR", "Linear"):
            with self.subTest(phase=phase):
                effect = BassManagement(phase=phase, taps="8192", roles=roles)
                self.assertEqual(effect.parameters["roles"], tuple(roles))
                with Chain([effect]).stream(sample_rate=48000, channels=2) as stream:
                    self.assertEqual(stream.latency_samples, 4224 if phase == "Linear" else 0)

                chain, _ = Chain.from_legacy_preset({
                    "pipeline": [{
                        "name": "Bass Management",
                        "enabled": True,
                        "channel": "A",
                        "parameters": {
                            "ph": phase,
                            "tp": "8192",
                            "ro": roles,
                            "fc": frequencies,
                            "sl": slopes,
                            "rt": routes,
                            "ri": route_inversions,
                            "su": 0,
                            "lf": 121,
                            "ls": 96,
                            "lo": True,
                            "bg": -1,
                            "lg": 2,
                            "hg": -3,
                        },
                    }]
                })
                imported = chain.effects[0]
                self.assertEqual(imported.parameters, {
                    "phase": phase,
                    "taps": "8192",
                    "roles": tuple(roles),
                    "frequencies": tuple(frequencies),
                    "slopes": tuple(slopes),
                    "routes": tuple(routes),
                    "subs": 0,
                    "lfeFrequency": 121,
                    "lfeSlope": 96,
                    "lfeLowpass": True,
                    "bassGain": -1,
                    "lfeGain": 2,
                    "headroom": -3,
                    "routeInversions": tuple(route_inversions),
                })
                self.assertEqual(imported.assets, {})

        configured_routes = [12, 12, 4] + [0] * 13
        configured_inversions = [8, 4, 4] + [0] * 13
        configured, _ = Chain.from_legacy_preset({
            "pipeline": [{
                "name": "Bass Management",
                "enabled": True,
                "channel": "A",
                "parameters": {
                    "ph": "IIR",
                    "tp": "16384",
                    "ro": routing()["roles"],
                    "fc": frequencies,
                    "sl": slopes,
                    "rt": configured_routes,
                    "ri": configured_inversions,
                    "su": 12,
                    "lf": 120,
                    "ls": 24,
                    "lo": False,
                    "bg": 0,
                    "lg": 0,
                    "hg": 0,
                },
            }]
        })
        self.assertEqual(
            configured.effects[0].parameters["routes"], tuple(configured_routes)
        )
        self.assertEqual(
            configured.effects[0].parameters["routeInversions"],
            tuple(configured_inversions),
        )
        with self.assertRaises(ValidationError):
            Chain.from_legacy_preset({
                "pipeline": [{
                    "name": "Bass Management",
                    "enabled": True,
                    "channel": "A",
                    "parameters": {"ro": [1] * 8},
                }]
            })

    def test_layout_and_required_asset_are_validated(self):
        with self.assertRaises(ValidationError):
            BassManagement(channel="left")
        with self.assertRaises(ValidationError):
            BassManagement(subs=4)
        with self.assertRaises(ValidationError):
            BassManagement(route_inversions=[1] + [0] * 15, **routing())
        managed = routing()
        managed["roles"][0] = 1
        with self.assertRaises(AssetError):
            BassManagement(phase="Linear", **managed)
        with self.assertRaises(ValidationError):
            Chain([BassManagement(**routing())]).stream(sample_rate=48000, channels=2)

    def test_route_inversion_preserves_equal_distribution(self):
        effect = BassManagement(route_inversions=[8] + [0] * 15, **routing())
        self.assertEqual(effect.to_dict()["parameters"]["routeInversions"][0], 8)
        source = np.zeros((4, 128), dtype=np.float32)
        source[0, 0] = 2
        output = Chain([effect]).process(source, sample_rate=48000)
        np.testing.assert_allclose(output[2:4, 0], [1, -1], atol=1e-6)

    def test_linear_asset_and_stream_reconfiguration(self):
        parameters = routing()
        parameters["roles"][0] = 1
        effect = BassManagement(id="bass", phase="Linear", taps="8192",
                                assets={"impulseResponse": "lp"}, **parameters)
        ir = np.zeros((1, 8192), dtype=np.float32)
        ir[0, 4096] = 0.5
        asset = AssetData(ir, 48000)
        chain = Chain([effect])
        with chain.stream(sample_rate=48000, channels=4, asset_resolver=lambda _: asset) as stream:
            self.assertEqual(stream.latency_samples, 4224)
            source = np.zeros((4, 4608), dtype=np.float32)
            source[0, 0] = 1
            output = stream.process(source)
            np.testing.assert_allclose(output[[0, 2, 3], 4224], [0.5, 0.25, 0.25], atol=2e-4)
            with self.assertRaises(ValidationError):
                stream.process(np.zeros((4, 1), dtype=np.float32),
                               events=[{"frame": 0, "effectId": "bass", "parameters": {"phase": "IIR"}}])
        bad = AssetData(np.ones((1, 256), dtype=np.float32), 48000)
        with self.assertRaises(AssetError):
            chain.stream(sample_rate=48000, channels=4, asset_resolver=lambda _: bad)

    def test_sparse_filter_bundle_roundtrip(self):
        effect = BassManagement(phase="Linear", taps="8192",
                                roles=[0, 1, 3, 3] + [0] * 12,
                                routes=[0, 12] + [0] * 14, subs=12,
                                assets={"impulseResponse": "lp"})
        samples = np.zeros((1, 8192), dtype=np.float32)
        samples[0, 4096] = 0.5
        asset = AssetData(samples, 48000, topology="matrix", paths=((1, 1, 0),), input_count=4)
        with tempfile.TemporaryDirectory() as temporary:
            bundle_path = Path(temporary).resolve() / "bass"
            Bundle.pack(bundle_path, {
                "version": 1, "chain": [effect.to_dict()]
            }, {"lp": asset})
            restored = Chain.from_bundle(bundle_path)
            with restored.stream(sample_rate=48000, channels=4) as stream:
                self.assertEqual(stream.latency_samples, 4224)


if __name__ == "__main__":
    unittest.main()
