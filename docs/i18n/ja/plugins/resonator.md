# Resonator Plugins

共鳴特性を強調して音楽にユニークな質感と色彩を加えるプラグインのコレクション。
これらのエフェクトは物理的なオブジェクトやスピーカーシステムで見られる共鳴をシミュレートし、暖かみ、きらめき、またはヴィンテージ感をもたらして再生体験を向上させます。

## プラグイン一覧

- [Horn Resonator](#horn-resonator) - ホーンスピーカーシステムの共鳴をシミュレートします
- [Horn Resonator Plus](#horn-resonator-plus) - 高度な反射機能を備えた強化されたホーンモデル
- [Modal Resonator](#modal-resonator) - 最大5つのレゾネーターを備えた周波数共鳴エフェクト

## Horn Resonator

デジタルウェーブガイドモデルを用いてホーン型スピーカーの共鳴をシミュレートするプラグインです。喉部や口部での波の反射をモデル化することで、シンプルなコントロールで暖かく自然なホーンスピーカーの特性を再現し、サウンドを形作ることができます。

### リスニングガイド

- ウォームな中域のブースト：刺激感なくボーカルやアコースティック楽器を際立たせます。
- 自然なホーンアンビエンス：ヴィンテージスピーカーの色づけを加え、豊かなリスニング体験を提供します。
- 滑らかな高域ダンピング：鋭いピークを抑え、リラックスしたトーンを実現します。

### パラメータ

- **Crossover (Hz)** - 低域経路（ディレイ処理）とホーンモデルが処理する高域経路の分割周波数を設定します。（20–5000 Hz）
- **Horn Length (cm)** - シミュレートされるホーンの長さを調整します。長いホーンは低域を強調し、共鳴間隔を広げ、短いホーンは高域を強調してサウンドを引き締めます。（20–120 cm）
- **Throat Diameter (cm)** - ホーンの喉部（入力）の開口サイズを制御します。小さい値は明るさと上部中域の強調を増し、大きい値は暖かさを加えます。（0.5–50 cm）
- **Mouth Diameter (cm)** - ホーンの口部（出力）の開口サイズを制御します。これは周囲の空気とのインピーダンスマッチングに影響し、口部での周波数依存反射に影響を与えます。大きい値は音の広がりを増し、低域の反射を減らし、小さい値はフォーカスを強め、低域の反射を増やします。（5–200 cm）
- **Curve (%)** - ホーンのフレア形状（喉部から口部への半径の増加方法）を調整します。
    - `0 %`：円錐形ホーンを作成します（距離に応じて半径が線形に増加）。
    - 正の値（`> 0 %`）：口部に向けてより急速に拡大するフレアを作成します（例：指数関数的）。値が大きいほど喉部付近での拡大が緩やかになり、口部付近で急激に拡大します。
    - 負の値（`< 0 %`）：喉部付近で急速に拡大し、その後口部に向けてゆっくりと拡大するフレアを作成します（例：放物線状やトラクトリックス様）。値がより負であるほど初期の拡大がより急速になります。
    （-100–100 %）
- **Damping (dB/m)** - ホーン波動ガイド内の1mあたりの内部減衰（音吸収）を設定します。値が大きいほど共鳴ピークが抑えられ、より滑らかでダンピングされたサウンドになります。（0–10 dB/m）
- **Throat Reflection** - ホーンの喉部（入力）における反射係数を調整します。値が大きいほど喉部境界からホーン内に反射される音が増え、応答が明るくなり特定の共鳴が強調されます。（0–0.99）
- **Output Gain (dB)** - 遅延された低域経路とミックスする前の、処理済み（高域）信号パスの全体的な出力レベルを制御します。エフェクトレベルの調整やブーストに使用します。（-36–36 dB）

### クイックスタート

1. **Crossover** を設定してホーンモデルに送る周波数範囲を定義します（例：800–2000 Hz）。この範囲より低い周波数はディレイされてミックスされます。
2. 一般的な中域キャラクターには **Horn Length** を約60～70 cmに設定して開始します。
3. **Throat Diameter** と **Mouth Diameter** を調整してコアトーン（明るさと暖かさ、フォーカスと広がり）を形成します。
4. **Curve** を使って共鳴特性を微調整します（円錐形には0%、指数的には正、トラクトリックス様のフレアには負を試してください）。
5. **Damping** と **Throat Reflection** を調整してホーンの共鳴を滑らかにしたり強調したりします。
6. **Output Gain** を使用してホーンサウンドとバイパスされた低域のレベルをバランスさせます。

## Horn Resonator Plus

2次口部反射フィルターと周波数依存の喉部反射を用いた、より滑らかな共鳴を実現する強化されたホーンモデルです。

Horn Resonator Plusは[Horn Resonator](#horn-resonator)をベースとした高度な実装で、以下の技術的改良を特徴とするより厳密なホーン伝送線モデルです：

### 技術的強化

- **2次口部反射フィルター**：より滑らかな共鳴特性を実現するため、口部開口での周波数依存反射をより正確にモデル化
- **周波数依存喉部反射**：より自然な音響挙動を実現するため、周波数に適応する喉部反射特性

### 音響特性

Horn Resonator Plusは、標準のHorn Resonatorと比較して以下の側面で優れた音質を提供します：

- **より滑らかな周波数レスポンス**：2次口部反射フィルターがより自然な共鳴ピーク減衰を生成
- **より現実的な高域挙動**：高域でのグループ遅延特性が実際の音響楽器により近い特性を示す

### パラメータと使用方法

Horn Resonator Plusは[Horn Resonator](#horn-resonator)と同じパラメータを使用します。パラメータの説明、設定、推奨値については、Horn Resonatorセクションを参照してください。

### 使用ガイドライン

- **Horn Resonator**：基本的なホーン特性を持つ軽量な処理が必要な場合に選択
- **Horn Resonator Plus**：より高品質で自然なホーン音響特性が必要な場合に選択（約+10%のCPUコスト）

### クイックスタートガイド

[Horn Resonator](#horn-resonator)と同じコントロールを使用します。より高品質な結果が必要な場合はHorn Resonator Plusを選択してください。

## Modal Resonator

オーディオに共鳴周波数を追加するクリエイティブなエフェクトです。このプラグインは、物理的オブジェクトがその固有共振周波数で振動するのに似た、特定の周波数で調整された共鳴を生成します。ユニークな音色特性の追加、異なる素材の共鳴特性のシミュレート、または特殊効果の作成に最適です。

### リスニング体験ガイド

- **金属的な共鳴：**
  - ソース素材のダイナミクスに合わせてベルのような、または金属的なトーンを生成します。
  - 打楽器、シンセ、ミックス全体にシマーや金属的なキャラクターを追加する際に有用です。
  - 適度なディケイ時間で複数のレゾネーターを注意深くチューニングした周波数で使用します。
- **トーナル強調：**
  - 音楽内の特定周波数をさりげなく強化します。
  - ハーモニクスを強調したり、特定周波数帯の充実感を追加したりできます。
  - 微妙な強調には低いMix値（10-20%）で使用します。
- **フルレンジスピーカーシミュレーション：**
  - 物理的スピーカーのモーダル挙動をシミュレートします。
  - ドライバーが異なる周波数で振動を分割する際に発生する特有の共鳴を再現します。
  - 特定のスピーカータイプの特徴的なサウンドをシミュレートするのに役立ちます。
- **特殊効果：**
  - 独特な音色特性や異世界的なテクスチャを生成します。
  - サウンドデザインや実験的な処理に最適です。
  - 創造的な音変形のために極端な設定を試してください。

### パラメータ

- **Resonator Selection (1-5)** - 独立した5つのレゾネーターを個別に有効/無効化および設定できます。
  - 複雑で多層的な共鳴効果には複数のレゾネーターを使用します。
  - 各レゾネーターは異なる周波数領域をターゲットにできます。
  - より音楽的な結果を得るためにレゾネーター間でハーモニック関係を試してください。

各レゾネーターについて：

- **Enable** - 個々のレゾネーターをオン/オフ切り替えます。
- **Freq (Hz)** - 主共振周波数を設定します（20 ～ 20,000 Hz）。
- **Decay (ms)** - 入力音後に共鳴が持続する時間を制御します（1 ～ 500 ms）。
- **LPF Freq (Hz)** - レゾナンスのトーンを形作るローパスフィルター（20 ～ 20,000 Hz）。
- **HPF Freq (Hz)** - レゾナンスから不要な低域を除去するハイパスフィルター（20 ～ 20,000 Hz）。
- **Gain (dB)** - 各レゾネーターの個別出力レベルを制御します（-18 ～ +18 dB）。
- **Mix (%)** - レゾナンスの音量と原音のバランスを調整します（0 ～ 100%）。

### リスニング強化の推奨設定

1. **繊細なスピーカー強化：**
   - 2～3つのレゾネーターを有効にします
   - Freq 設定：400 Hz、900 Hz、1600 Hz
   - Decay：60～100 ms
   - LPF Freq：2000～4000 Hz
   - Mix：10～20%

2. **金属的キャラクター：**
   - 3～5つのレゾネーターを有効にします
   - Freq 設定：1000～6500 Hzの範囲に分散
   - Decay：100～200 ms
   - LPF Freq：4000～8000 Hz
   - Mix：15～30%

3. **低域強化：**
   - 1～2つのレゾネーターを有効にします
   - Freq 設定：50～150 Hz
   - Decay：50～100 ms
   - LPF Freq：1000～2000 Hz
   - Mix：10～25%

4. **フルレンジスピーカーシミュレーション：**
   - 全5つのレゾネーターを有効にします
   - Freq 設定：100 Hz、400 Hz、800 Hz、1600 Hz、3000 Hz
   - Decay：低域から高域に向けて徐々に短く（100 ms～30 ms）
   - LPF Freq：低域から高域に向けて徐々に高く（2000 Hz～4000 Hz）
   - Mix：20～40%

### クイックスタートガイド

1. **共鳴ポイントの選択：**
   - まず1つまたは2つのレゾネーターを有効にします。
   - 強調したい領域の周波数を設定します。
   - より複雑な効果には、補完的な周波数を持つレゾネーターを追加します。

2. **キャラクターの調整：**
   - `Decay` パラメータで共鳴の持続時間を制御します。
   - `LPF Freq` コントロールでトーンを形成します。
   - より長いDecay時間は、より明瞭でベルのようなトーンを生み出します。

3. **原音とのブレンド：**
   - `Mix` でエフェクトと原音のバランスを取ります。
   - 微妙な強調には低いMix値（10-20%）から始めます。
   - より劇的な効果には値を上げます。

4. **微調整：**
   - 周波数とDecay時間を少しずつ調整します。
   - 個々のレゾネーターを有効/無効化して最適な組み合わせを見つけます。
   - 微細な変更でも全体のサウンドに大きな影響を与えることを忘れないでください。

補足：目標はクラシックなホーンスピーカーバイブでリスニング体験を向上させることです。 