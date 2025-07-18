# Lo-Fiオーディオプラグイン

音楽にビンテージな特性と懐かしい質感を加えるプラグインのコレクションです。これらのエフェクトは、現代のデジタル音楽をクラシックな機器で再生しているように聞こえるようにしたり、リラックスできて雰囲気のある人気の「lo-fi」サウンドを作り出したりすることができます。

## プラグイン一覧

- [Bit Crusher](#bit-crusher) - レトロゲームやビンテージデジタルサウンドを作成
- [Digital Error Emulator](#digital-error-emulator) - さまざまなデジタル音声伝送エラーをシミュレート
- [Hum Generator](#hum-generator) - 高精度電源ハムノイズジェネレーター
- [Noise Blender](#noise-blender) - 雰囲気のあるバックグラウンドテクスチャを追加
- [Simple Jitter](#simple-jitter) - 微妙なビンテージデジタルの不完全さを作成
- [Vinyl Artifacts](#vinyl-artifacts) - アナログレコードノイズの物理的シミュレーション

## Bit Crusher

古いゲーム機や初期のサンプラーのようなビンテージデジタル機器のサウンドを再現するエフェクトです。レトロな特性を追加したり、lo-fiな雰囲気を作り出したりするのに最適です。

### サウンドキャラクターガイド
- レトロゲームスタイル:
  - クラシックな8ビットコンソールサウンドを作成
  - ビデオゲーム音楽のノスタルジーに最適
  - サウンドにピクセル的なテクスチャを追加
- Lo-Fi Hip Hopスタイル:
  - リラックスできる、勉強用ビートサウンドを作成
  - 温かみのある、穏やかなデジタル劣化
  - バックグラウンドリスニングに最適
- クリエイティブエフェクト:
  - ユニークなグリッチスタイルサウンドを作成
  - 現代の音楽をレトロバージョンに変換
  - あらゆる音楽にデジタルな特性を追加

### パラメータ
- **Bit Depth** - サウンドの「デジタル感」を制御(4から24ビット)
  - 4-6ビット:極端なレトロゲームサウンド
  - 8ビット:クラシックなビンテージデジタル
  - 12-16ビット:微妙なlo-fi特性
  - より高い値:非常に穏やかなエフェクト
- **TPDF Dither** - エフェクトをよりスムーズにする
  - オン:より穏やかで音楽的なサウンド
  - オフ:生の、よりアグレッシブなエフェクト
- **ZOH Frequency** - 全体的な明瞭さに影響(4000Hzから96000Hz)
  - 低い値:よりレトロで、より不明瞭
  - 高い値:よりクリアで、より微妙なエフェクト
- **Bit Error** - ビンテージハードウェアの特性を追加(0.00%から10.00%)
  - 0-1%:微妙なビンテージの温かみ
  - 1-3%:クラシックなハードウェアの不完全さ
  - 3-10%:クリエイティブなlo-fi特性
- **Random Seed** - 不完全さの個性を制御(0から1000)
  - 異なる値で異なるビンテージな「個性」を作成
  - 同じ値で常に同じ特性を再現
  - お気に入りのビンテージサウンドを見つけて保存するのに最適

## Digital Error Emulator

プロの微妙なインターフェイスグリッチからビンテージCDプレーヤーの不完全さまで、さまざまなデジタル音声伝送エラーの音をシミュレートするエフェクトです。ビンテージデジタル特性を追加したり、クラシックなデジタルオーディオ機器を思い出させるユニークなリスニング体験を作り出すのに最適です。

### サウンドキャラクターガイド
- プロ用デジタルインターフェイスグリッチ:
  - S/PDIF、AES3、MADIの伝送アーティファクトをシミュレート
  - 古くなったプロ機器の特性を追加
  - ビンテージスタジオサウンドに最適
- コンシューマデジタルドロップアウト:
  - クラシックなCDプレーヤーのエラー補正動作を再現
  - USBオーディオインターフェイスのグリッチをシミュレート
  - 90年代/2000年代のデジタル音楽ノスタルジーに最適
- ストリーミング・ワイヤレスオーディオアーティファクト:
  - Bluetooth伝送エラーをシミュレート
  - ネットワークストリーミングのドロップアウトとアーティファクト
  - 現代のデジタル生活の不完全さ
- クリエイティブデジタルテクスチャ:
  - RF干渉とワイヤレス伝送エラー
  - HDMI/DisplayPortオーディオ破損エフェクト
  - ユニークな実験的サウンドの可能性

### パラメータ
- **Bit Error Rate** - エラーの発生頻度を制御(10^-12から10^-2)
  - 非常に稀(10^-10から10^-8):微妙で時折のアーティファクト
  - 時々(10^-8から10^-6):クラシックなコンシューマ機器の動作
  - 頻繁(10^-6から10^-4):目立つビンテージ特性
  - 極端(10^-4から10^-2):クリエイティブな実験的エフェクト
  - デフォルト:10^-6(典型的なコンシューマ機器)
- **Mode** - シミュレートするデジタル伝送のタイプを選択
  - AES3/S-PDIF:サンプルホールド付きプロインターフェイスビットエラー
  - ADAT/TDIF/MADI:マルチチャンネルバーストエラー(ホールドまたはミュート)
  - HDMI/DP:ディスプレイオーディオ行破損またはミュート
  - USB/FireWire/Thunderbolt:補間付きマイクロフレームドロップアウト
  - Dante/AES67/AVB:ネットワークオーディオパケットロス(64/128/256サンプル)
  - Bluetooth A2DP/LE:隠蔽付きワイヤレス伝送エラー
  - WiSA:ワイヤレススピーカーFECブロックエラー
  - RF Systems:無線周波数スケルチと干渉
  - CD Audio:CIRC エラー補正シミュレーション
  - デフォルト:CD Audio(音楽リスナーに最も馴染み深い)
- **Reference Fs (kHz)** - タイミング計算の基準サンプルレートを設定
  - 利用可能なレート:44.1、48、88.2、96、176.4、192 kHz
  - ネットワークオーディオモードのタイミング精度に影響
  - デフォルト:48 kHz
- **Wet Mix** - オリジナルと処理されたオーディオのブレンドを制御(0-100%)
  - 注意:リアルなデジタルエラーシミュレーションでは100%に保つ
  - 低い値は実際のデジタルシステムでは発生しない非現実的な「部分的」エラーを作成
  - デフォルト:100%(本物のデジタルエラー動作)

### モード詳細

**プロ用インターフェイス:**
- AES3/S-PDIF:前サンプルホールド付き単一サンプルエラー
- ADAT/TDIF/MADI:32サンプルバーストエラー - 最後の良好サンプルをホールドまたはミュート
- HDMI/DisplayPort:ビットレベルエラーまたは完全ミュート付き192サンプル行破損

**コンピュータオーディオ:**
- USB/FireWire/Thunderbolt:補間隠蔽付きマイクロフレームドロップアウト
- ネットワークオーディオ(Dante/AES67/AVB):異なるサイズオプションと隠蔽付きパケットロス

**コンシューマワイヤレス:**
- Bluetooth A2DP:ワーブルとディケイアーティファクト付きポストコーデック伝送エラー
- Bluetooth LE:高周波フィルタリングとノイズ付き強化隠蔽
- WiSA:ワイヤレススピーカーFECブロックミュート

**特殊システム:**
- RF Systems:無線干渉をシミュレートする可変長スケルチイベント
- CD Audio:Reed-Solomonスタイル動作のCIRCエラー補正シミュレーション

### 異なるスタイルの推奨設定

1. 微妙なプロ機器キャラクター
   - モード:AES3/S-PDIF、BER:10^-8、Fs:48kHz、Wet:100%
   - 最適な用途:微妙なプロ機器エージング効果の追加

2. クラシックなCDプレーヤー体験
   - モード:CD Audio、BER:10^-7、Fs:44.1kHz、Wet:100%
   - 最適な用途:90年代デジタル音楽ノスタルジー

3. 現代のストリーミンググリッチ
   - モード:Dante/AES67(128 samp)、BER:10^-6、Fs:48kHz、Wet:100%
   - 最適な用途:現代のデジタル生活の不完全さ

4. Bluetoothリスニング体験
   - モード:Bluetooth A2DP、BER:10^-6、Fs:48kHz、Wet:100%
   - 最適な用途:ワイヤレスオーディオの思い出

5. クリエイティブ実験エフェクト
   - モード:RF Systems、BER:10^-5、Fs:48kHz、Wet:100%
   - 最適な用途:ユニークな実験的サウンド

注意:すべての推奨設定は、リアルなデジタルエラー動作のため100%ウェットミックスを使用しています。低いウェットミックス値はクリエイティブエフェクトに使用できますが、実際のデジタルエラーの発生方法を表していません。

## Hum Generator

特徴的な倍音構造と微妙な不安定性を持つ、高精度で本格的な電源ハムノイズを生成するエフェクトです。ビンテージ機器や電源からのリアルなバックグラウンドハムを追加したり、多くのクラシック録音が持つ本格的な「電源接続」感を作り出すのに最適です。

### サウンドキャラクターガイド
- ビンテージ機器の雰囲気:
  - クラシックなアンプや機器の微妙なハムを再現
  - AC電源に「接続」されているキャラクターを追加
  - 本格的なビンテージスタジオの雰囲気を作成
- 電源供給特性:
  - 異なるタイプの電源ノイズをシミュレート
  - 地域の電力網特性を再現(50Hz vs 60Hz)
  - 微妙な電気インフラのキャラクターを追加
- バックグラウンドテクスチャ:
  - 有機的で低レベルなバックグラウンドプレゼンスを作成
  - 無機質なデジタル録音に深みと「生命感」を追加
  - ビンテージインスパイアな制作に最適

### パラメータ
- **Frequency** - 基本ハム周波数を設定(10-120 Hz)
  - 50 Hz: ヨーロッパ/アジアの電力網標準
  - 60 Hz: 北米の電力網標準
  - その他の値: クリエイティブエフェクト用のカスタム周波数
- **Type** - ハムの倍音構造を制御
  - Standard: 奇数次倍音のみ含む(より純粋、トランスフォーマーライク)
  - Rich: すべての倍音を含む(複雑、機器ライク)
  - Dirty: 微妙な歪みを持つリッチ倍音(ビンテージ機器キャラクター)
- **Harmonics** - 明るさと倍音内容を制御(0-100%)
  - 0-30%: 上位倍音が最小限の暖かく柔らかなハム
  - 30-70%: 実際の機器に典型的なバランスの取れた倍音内容
  - 70-100%: 強い上位倍音を持つ明るく複雑なハム
- **Tone** - 最終的なトーンシェイピングフィルターのカットオフ周波数(1.0-20.0 kHz)
  - 1-5 kHz: 暖かくこもったキャラクター
  - 5-10 kHz: 自然な機器ライクなトーン
  - 10-20 kHz: 明るく存在感のあるキャラクター
- **Instability** - 微妙な周波数と振幅変動の量(0-10%)
  - 0%: 完全に安定したハム(デジタル精度)
  - 1-3%: 微妙な現実世界の不安定性
  - 3-7%: 顕著なビンテージ機器キャラクター
  - 7-10%: クリエイティブモジュレーション効果
- **Level** - ハム信号の出力レベル(-80.0 から 0.0 dB)
  - -80 から -60 dB: ほとんど聞こえないバックグラウンドプレゼンス
  - -60 から -40 dB: 微妙だが知覚できるハム
  - -40 から -20 dB: 目立つビンテージキャラクター
  - -20 から 0 dB: クリエイティブまたは特殊効果レベル

### 異なるスタイルの推奨設定

1. 微妙なビンテージアンプ
   - Frequency: 50/60 Hz, Type: Standard, Harmonics: 25%
   - Tone: 8.0 kHz, Instability: 1.5%, Level: -54 dB
   - 最適な用途: 穏やかなビンテージアンプキャラクターの追加

2. クラシック録音スタジオ
   - Frequency: 60 Hz, Type: Rich, Harmonics: 45%
   - Tone: 6.0 kHz, Instability: 2.0%, Level: -48 dB
   - 最適な用途: アナログ時代の本格的なスタジオ雰囲気

3. ビンテージ真空管機器
   - Frequency: 50 Hz, Type: Dirty, Harmonics: 60%
   - Tone: 5.0 kHz, Instability: 3.5%, Level: -42 dB
   - 最適な用途: 暖かい真空管アンプキャラクター

4. 電力網雰囲気
   - Frequency: 50/60 Hz, Type: Standard, Harmonics: 35%
   - Tone: 10.0 kHz, Instability: 1.0%, Level: -60 dB
   - 最適な用途: リアルな電源バックグラウンド

5. クリエイティブハムエフェクト
   - Frequency: 40 Hz, Type: Dirty, Harmonics: 80%
   - Tone: 15.0 kHz, Instability: 6.0%, Level: -36 dB
   - 最適な用途: アーティスティックで実験的なアプリケーション

## Noise Blender

レコードやビンテージ機器のサウンドに似た、雰囲気のあるバックグラウンドテクスチャを音楽に追加するエフェクトです。居心地の良い、懐かしい雰囲気を作り出すのに最適です。

### サウンドキャラクターガイド
- ビンテージ機器サウンド:
  - 古いオーディオ機器の温かみを再現
  - デジタル録音に微妙な「生命感」を追加
  - 本物のビンテージ感を作成
- レコード体験:
  - クラシックなレコードプレーヤーの雰囲気を追加
  - 居心地の良い、親しみやすい感覚を作成
  - 深夜のリスニングに最適
- アンビエントテクスチャ:
  - 雰囲気のあるバックグラウンドを追加
  - 深みと空間を作成
  - デジタル音楽をより有機的に感じさせる

### パラメータ
- **Noise Type** - バックグラウンドテクスチャの特性を選択
  - White:より明るく、存在感のあるテクスチャ
  - Pink:より温かく、より自然なサウンド
- **Level** - エフェクトの目立ち具合を制御(-96dBから0dB)
  - 非常に微妙(-96dBから-72dB):ほんのヒント程度
  - 穏やか(-72dBから-48dB):目立つテクスチャ
  - 強い(-48dBから-24dB):支配的なビンテージキャラクター
- **Per Channel** - よりスペーシャスなエフェクトを作成
  - オン:より広がりのある、没入感のあるサウンド
  - オフ:よりフォーカスされた、中央のテクスチャ

## Simple Jitter

不完全でビンテージなデジタルサウンドを作り出すために、微妙なタイミングの変動を追加するエフェクトです。音楽が古いCDプレーヤーやビンテージデジタル機器で再生されているように聞こえるようにすることができます。

### サウンドキャラクターガイド
- 微妙なビンテージ感:
  - 古い機器のような穏やかな不安定さを追加
  - より有機的で、より不完全なサウンドを作成
  - 微妙に特性を追加するのに最適
- クラシックなCDプレーヤーサウンド:
  - 初期のデジタルプレーヤーのサウンドを再現
  - ノスタルジックなデジタル特性を追加
  - 90年代音楽の鑑賞に最適
- クリエイティブエフェクト:
  - ユニークなウォブル効果を作成
  - 現代のサウンドをビンテージに変換
  - 実験的な特性を追加

### パラメータ
- **RMS Jitter** - タイミング変動の量を制御(1psから10ms)
  - 微妙(1-10ps):穏やかなビンテージキャラクター
  - 中程度(10-100ps):クラシックなCDプレーヤーの感覚
  - 強い(100ps-1ms):クリエイティブなウォブル効果

### 異なるスタイルでの推奨設定

1. ほとんど知覚できない
   - RMS Jitter: 1-5ps
   - 最適な用途: デジタル録音に最も微妙なアナログの温かみを追加

2. クラシックCDプレーヤーキャラクター
   - RMS Jitter: 50-100ps
   - 最適な用途: 初期のデジタル再生機器のサウンドを再現

3. ビンテージDATマシン
   - RMS Jitter: 200-500ps
   - 最適な用途: 90年代のデジタル録音機器キャラクター

4. 劣化したデジタル機器
   - RMS Jitter: 1-2ns (1000-2000ps)
   - 最適な用途: 老朽化またはメンテナンス不良のデジタル機器のサウンドを作成

5. クリエイティブなウォブル効果
   - RMS Jitter: 10-100µs (10000-100000ps)
   - 最適な用途: 実験的エフェクトと顕著なピッチモジュレーション

## Vinyl Artifacts

アナログビニールレコードの物理的なノイズ特性を再現するエフェクトです。このプラグインは、ビニールレコードを再生する際に発生するさまざまなアーティファクトを、表面ノイズから再生チェーンの電気的特性まで、シミュレートします。

### サウンドキャラクターガイド
- ビニールレコード体験:
  - ビニールレコード再生のリアルなサウンドを再現
  - 特徴的な表面ノイズとアーティファクトを追加
  - 温かく懐かしいアナログ感覚を作り出す
- ビンテージ再生システム:
  - 完全なアナログ再生チェーンをシミュレート
  - RIAA イコライゼーション特性を含む
  - 音楽に反応するリアクティブノイズを追加
- アンビエントテクスチャ:
  - 豊かで有機的なバックグラウンドテクスチャを作成
  - デジタル録音に深みと個性を追加
  - 居心地良い親密なリスニング体験を作るのに最適

### パラメータ
- **Pops/min** - 1分あたりの大きなクリックノイズの頻度を制御 (0 から 120)
  - 0-20: 時折の穏やかなポップス
  - 20-60: 適度なビンテージキャラクター
  - 60-120: 重い摩耗と損傷のサウンド
- **Pop Level** - ポップノイズの音量を制御 (-80.0 から 0.0 dB)
  - -80 から -48 dB: 微妙なクリック
  - -48 から -24 dB: 適度なポップス
  - -24 から 0 dB: 大きなポップス（極端な設定）
- **Crackles/min** - 1分あたりのクラックリングノイズの密度を制御 (0 から 2000)
  - 0-200: 微妙な表面テクスチャ
  - 200-1000: クラシックなビニールキャラクター
  - 1000-2000: 重い表面ノイズ
- **Crackle Level** - クラックリングノイズの音量を制御 (-80.0 から 0.0 dB)
  - -80 から -48 dB: 微妙なクラックリング
  - -48 から -24 dB: 適度なクラックリング
  - -24 から 0 dB: 大きなクラックリング（極端な設定）
- **Hiss** - 一定の表面ノイズレベルを制御 (-80.0 から 0.0 dB)
  - -80 から -48 dB: 微妙なバックグラウンドテクスチャ
  - -48 から -30 dB: 目立つ表面ノイズ
  - -30 から 0 dB: 顕著なヒス（極端な設定）
- **Rumble** - 低周波ターンテーブルランブルを制御 (-80.0 から 0.0 dB)
  - -80 から -60 dB: 微妙な低域ウォームス
  - -60 から -40 dB: 目立つランブル
  - -40 から 0 dB: 重いランブル（極端な設定）
- **Crosstalk** - 左右チャンネル間のクロストーク量を制御 (0 から 100%)
  - 0%: 完璧なステレオ分離
  - 30-60%: リアルなビニールクロストーク
  - 100%: 最大チャンネルブリード
- **Noise Profile** - ノイズの周波数特性を調整 (0.0 から 10.0)
  - 0: RIAAカーブの再現（本物のビニール周波数特性）
  - 5: 部分的に補正された特性
  - 10: フラットな特性（バイパス）
- **Wear** - レコードの全体的な状態のマスター乗数 (0 から 200%)
  - 0-50%: よく保管されたレコード
  - 50-100%: 通常の摩耗と経年
  - 100-200%: 重度に摩耗したレコード
- **React** - ノイズが入力信号にどの程度反応するか (0 から 100%)
  - 0%: 静的なノイズレベル
  - 25-50%: 音楽への適度な反応
  - 75-100%: 入力に対して高い反応性
- **React Mode** - 信号のどの側面が反応を制御するかを選択
  - Velocity: 高周波コンテンツ（針の速度）に反応
  - Amplitude: 全体的な信号レベルに反応
- **Mix** - ドライ信号に加えるノイズの量を制御 (0 から 100%)
  - 0%: ノイズなし（ドライ信号のみ）
  - 50%: 適度なノイズ追加
  - 100%: 最大ノイズ追加
  - 注意: ドライ信号レベルは変化しません。このパラメータはノイズ量のみを制御します

### 異なるスタイルの推奨設定

1. 微妙なビニールキャラクター
   - Pops/min: 20, Pop Level: -48dB, Crackles/min: 200, Crackle Level: -48dB
   - Hiss: -48dB, Rumble: -60dB, Crosstalk: 30%, Noise Profile: 5.0
   - Wear: 25%, React: 20%, React Mode: Velocity, Mix: 100%
   - 最適な用途: 穏やかなアナログウォームスの追加

2. クラシックビニール体験
   - Pops/min: 40, Pop Level: -36dB, Crackles/min: 400, Crackle Level: -36dB
   - Hiss: -36dB, Rumble: -50dB, Crosstalk: 50%, Noise Profile: 4.0
   - Wear: 60%, React: 30%, React Mode: Velocity, Mix: 100%
   - 最適な用途: 本格的なビニールリスニング体験

3. 重度に摩耗したレコード
   - Pops/min: 80, Pop Level: -24dB, Crackles/min: 800, Crackle Level: -24dB
   - Hiss: -30dB, Rumble: -40dB, Crosstalk: 70%, Noise Profile: 3.0
   - Wear: 120%, React: 50%, React Mode: Velocity, Mix: 100%
   - 最適な用途: 重度に経年したレコードキャラクター

4. Lo-Fiアンビエント
   - Pops/min: 15, Pop Level: -54dB, Crackles/min: 150, Crackle Level: -54dB
   - Hiss: -42dB, Rumble: -66dB, Crosstalk: 25%, Noise Profile: 6.0
   - Wear: 40%, React: 15%, React Mode: Amplitude, Mix: 100%
   - 最適な用途: バックグラウンドアンビエントテクスチャ

5. ダイナミックビニール
   - Pops/min: 60, Pop Level: -30dB, Crackles/min: 600, Crackle Level: -30dB
   - Hiss: -39dB, Rumble: -45dB, Crosstalk: 60%, Noise Profile: 5.0
   - Wear: 80%, React: 75%, React Mode: Velocity, Mix: 100%
   - 最適な用途: 音楽に劇的に反応するノイズ

注意:これらのエフェクトは、音楽に特性とノスタルジーを加えることを目的としています。控えめな設定から始めて、好みに応じて調整してください!
