# Dynamicsプラグイン

音楽の大きな部分と静かな部分のバランスを取り、より快適で楽しいリスニング体験を実現するプラグインのコレクションです。

## プラグイン一覧

- [Auto Leveler](#auto-leveler) - 一定のリスニング体験を実現するための自動ボリューム調整
- [Brickwall Limiter](#brickwall-limiter) - 自然なサウンドを維持しながら安全で快適なリスニングを実現する透明なピーク制御
- [Compressor](#compressor) - より快適なリスニングのために音量レベルを自動的にバランス調整
- [Gate](#gate) - 閾値以下の信号を減衰させることで不要なバックグラウンドノイズを低減
- [Multiband Compressor](#multiband-compressor) - FMラジオ風のサウンドシェイピングが可能なプロフェッショナルな5バンドダイナミクスプロセッサー
- [Multiband Transient](#multiband-transient) - 周波数帯域別のアタックとサステインを精密制御する高度な3バンドトランジェントシェイパー
- [Power Amp Sag](#power-amp-sag) - 高負荷状態でのパワーアンプの電圧サグ特性をシミュレート
- [Transient Shaper](#transient-shaper) - 信号のトランジェントとサステイン部分をコントロール

## Auto Leveler

音楽再生中に一定のリスニングレベルを維持するため、ボリュームを自動で調整するスマートなボリュームコントロールです。業界標準のLUFS測定を利用して、クラシックの静かな楽曲からダイナミックなポップスまで、常に快適な音量を提供します。

### リスニング向上ガイド

- **クラシック音楽:**
  - ボリュームを触らずに、静かな部分と大きなクレッシェンドの両方を堪能
  - ピアノ曲の細かなニュアンスもしっかりと再現
  - 録音レベルが変動するアルバムにも最適

- **Pop/Rock:**
  - 曲間で一定の音量を維持
  - 突然の大音量や低音量による驚きが解消
  - 長時間のリスニングでも快適

- **バックグラウンドミュージック:**
  - 作業や勉強中でも一定の音量をキープ
  - 大きすぎず、小さすぎない理想的なバランス
  - 多様なコンテンツを含むプレイリストに最適

### パラメーター

- **Target** (-36.0dB to 0.0dB LUFS)  
  - 希望するリスニングレベルを設定  
  - デフォルトは -18.0dB LUFS（ほとんどの音楽に快適）  
  - 低い値：静かなバックグラウンドリスニング向け  
  - 高い値：より迫力のあるサウンドに

- **Time Window** (1000ms to 10000ms)  
  - レベル測定の時間幅を設定  
  - 短い設定：変化に迅速に反応  
  - 長い設定：より安定した自然なサウンドに  
  - デフォルトは3000ms（多くの音楽に適用）

- **Max Gain** (0.0dB to 12.0dB)  
  - 静かな音をどれだけブーストするかの上限を設定  
  - 高い値：音量の一貫性が向上  
  - 低い値：自然なダイナミクスを維持  
  - 穏やかな調整には6.0dBから開始

- **Min Gain** (-36.0dB to 0.0dB)  
  - 大きな音がどれだけ抑制されるかの下限を設定  
  - 高い値：より自然なサウンドに  
  - 低い値：一貫した音量に  
  - 初期値として-12.0dBを推奨

- **Attack Time** (1ms to 1000ms)  
  - 音量が減衰する速さを設定  
  - 短い設定：急な大音量を効果的に制御  
  - 長い設定：より自然な音の移行に  
  - デフォルトは50ms（制御と自然さのバランス良好）

- **Release Time** (10ms to 10000ms)  
  - 音量が元に戻る速さを設定  
  - 短い設定：迅速な反応  
  - 長い設定：スムーズな移行に  
  - デフォルトは1000ms（自然なサウンドに最適）

- **Noise Gate** (-96dB to -24dB)  
  - 非常に小さな音の処理を抑制  
  - 高い値：背景ノイズが少なくなる  
  - 低い値：より多くの静かな音を処理  
  - -60dBから開始し、必要に応じて調整

### ビジュアルフィードバック

- リアルタイムLUFSレベル表示
- Input level (green line)
- Output level (white line)
- ボリューム調整が一目で分かる視覚的フィードバック
- 見やすい時間軸グラフ

### 推奨設定

#### General Listening
- Target: -18.0dB LUFS
- Time Window: 3000ms
- Max Gain: 6.0dB
- Min Gain: -12.0dB
- Attack Time: 50ms
- Release Time: 1000ms
- Noise Gate: -60dB

#### Background Music
- Target: -23.0dB LUFS
- Time Window: 5000ms
- Max Gain: 9.0dB
- Min Gain: -18.0dB
- Attack Time: 100ms
- Release Time: 2000ms
- Noise Gate: -54dB

#### Dynamic Music
- Target: -16.0dB LUFS
- Time Window: 2000ms
- Max Gain: 3.0dB
- Min Gain: -6.0dB
- Attack Time: 30ms
- Release Time: 500ms
- Noise Gate: -72dB

## Brickwall Limiter

音楽のピークレベルを指定したレベル以下に確実に抑えながら、自然なサウンドクオリティを維持する高品質なピークリミッターです。オーディオシステムを保護し、音楽のダイナミクスを損なうことなく快適なリスニングレベルを確保するのに最適です。

### リスニング向上ガイド
- クラシック音楽:
  - オーケストラのクレッシェンドを安全に楽しむ
  - ピアノ作品の自然なダイナミクスを維持
  - ライブ録音での予期せぬピークから保護
- ポップス/ロック音楽:
  - インテンシブなパッセージでも一貫した音量を維持
  - どのリスニングレベルでもダイナミックな音楽を楽しめる
  - 低音が強調された部分でも歪みを防止
- 電子音楽:
  - シンセサイザーのピークを透明に制御
  - オーバーロードを防ぎながらインパクトを維持
  - ベースドロップを力強く、かつ制御された状態に保つ

### パラメータ
- **Input Gain** (-18dBから+18dB)
  - リミッターへの入力レベルを調整
  - 増加でリミッターをより強く駆動
  - 減少でリミッティングが強すぎる場合に調整
  - デフォルトは0dB

- **Threshold** (-24dBから0dB)
  - 最大ピークレベルを設定
  - 低い値でより大きな安全マージン
  - 高い値でよりダイナミクスを保持
  - 穏やかな保護には-3dBから開始

- **Release Time** (10msから500ms)
  - リミッティングが解除される速さ
  - 速い時間でよりダイナミクスを維持
  - 遅い時間でよりスムーズなサウンド
  - 開始点として100msを試してください

- **Lookahead** (0msから10ms)
  - リミッターがピークを予測可能に
  - 高い値でより透明なリミッティング
  - 低い値で遅延が少ない
  - 3msが良いバランス

- **Margin** (-1.000dBから0.000dB)
  - 実効的な閾値を微調整
  - 追加の安全マージンを提供
  - デフォルトの-1.000dBが多くの素材に適している
  - 正確なピーク制御のために調整

- **Oversampling** (1x, 2x, 4x, 8x)
  - 高い値でよりクリーンなリミッティング
  - 低い値でCPU使用率が低下
  - 4xが品質とパフォーマンスの良いバランス

### 視覚的表示
- リアルタイムのゲイン低減メーター
- 明確な閾値レベルの表示
- インタラクティブなパラメータ調整
- ピークレベルのモニタリング

### 推奨設定

#### 透明な保護
- Input Gain: 0dB
- Threshold: -3dB
- Release: 100ms
- Lookahead: 3ms
- Margin: -1.000dB
- Oversampling: 4x

#### 最大限の安全性
- Input Gain: -6dB
- Threshold: -6dB
- Release: 50ms
- Lookahead: 5ms
- Margin: -1.000dB
- Oversampling: 8x

#### 自然なダイナミクス
- Input Gain: 0dB
- Threshold: -1.5dB
- Release: 200ms
- Lookahead: 2ms
- Margin: -0.500dB
- Oversampling: 4x

## Compressor

大きな音を穏やかに抑え、静かな音を強調することで、音楽の音量差を自動的に管理するエフェクトです。急激な音量変化による違和感や不快感を軽減し、よりバランスの取れた快適なリスニング体験を実現します。

### リスニング向上ガイド
- クラシック音楽:
  - 劇的なオーケストラのクレッシェンドをより快適に視聴可能
  - ピアノの弱音と強音の差をバランス調整
  - 力強いセクションでも繊細な部分が聴き取りやすい
- ポップス/ロック音楽:
  - インテンシブなセクションでもより快適な視聴体験
  - ボーカルがより明確で聞き取りやすい
  - 長時間のリスニングでも疲労が少ない
- ジャズ音楽:
  - 異なる楽器間の音量バランスを調整
  - ソロセクションがアンサンブルとより自然に調和
  - 静かなパッセージと大きなパッセージの両方で明瞭さを維持

### パラメータ

- **Threshold** - エフェクトが作用を開始する音量レベルを設定(-60dBから0dB)
  - 高い設定:音楽の最も大きな部分のみに影響
  - 低い設定:より全体的なバランスを実現
  - 穏やかなバランス調整には-24dBから開始
- **Ratio** - 音量のバランス調整の強さを制御(1:1から20:1)
  - 1:1:エフェクトなし(オリジナルサウンド)
  - 2:1:穏やかなバランス調整
  - 4:1:適度なバランス調整
  - 8:1以上:強い音量制御
- **Attack Time** - 大きな音に対する反応の速さ(0.1msから100ms)
  - 速い時間:より即座の音量制御
  - 遅い時間:より自然なサウンド
  - 20msを開始点として試してみてください
- **Release Time** - 音量が通常に戻る速さ(10msから1000ms)
  - 速い時間:よりダイナミックなサウンド
  - 遅い時間:よりスムーズで自然な遷移
  - 一般的なリスニングには200msから開始
- **Knee** - エフェクトの遷移の滑らかさ(0dBから12dB)
  - 低い値:より正確な制御
  - 高い値:よりやさしく自然なサウンド
  - 6dBが良い開始点です
- **Gain** - 処理後の全体的な音量を調整(-12dBから+12dB)
  - オリジナルサウンドと音量を合わせるために使用
  - 音楽が静かすぎる場合は増加
  - 大きすぎる場合は減少

### 視覚的表示

- エフェクトの動作を示すインタラクティブなグラフ
- 見やすい音量レベルインジケーター
- すべてのパラメータ調整の視覚的フィードバック
- 設定の目安となる参照ライン

### 異なるリスニングシーンでの推奨設定
- カジュアルなバックグラウンドリスニング:
  - Threshold: -24dB
  - Ratio: 2:1
  - Attack: 20ms
  - Release: 200ms
  - Knee: 6dB
- クリティカルリスニングセッション:
  - Threshold: -18dB
  - Ratio: 1.5:1
  - Attack: 30ms
  - Release: 300ms
  - Knee: 3dB
- 夜間のリスニング:
  - Threshold: -30dB
  - Ratio: 4:1
  - Attack: 10ms
  - Release: 150ms
  - Knee: 9dB

## Gate

指定した閾値以下の信号を自動的に減衰させることで、不要なバックグラウンドノイズを低減するノイズゲートです。このプラグインは、ファンノイズ、ハム音、環境ノイズなど、常に存在するバックグラウンドノイズのクリーンアップに特に有効です。

### 主な特徴
- 正確なノイズ検出のための精密な閾値制御
- 自然または積極的なノイズ低減のための調整可能なレシオ
- 最適なタイミング制御のための可変アタックとリリース時間
- スムーズな遷移のためのソフトニーオプション
- リアルタイムのゲイン低減メーター
- インタラクティブな伝達関数表示

### パラメータ

- **Threshold** (-96dBから0dB)
  - ノイズ低減が開始されるレベルを設定
  - このレベル以下の信号が減衰される
  - 高い値:より積極的なノイズ低減
  - 低い値:より微妙なエフェクト
  - ノイズフロアに基づいて-40dBから開始し調整

- **Ratio** (1:1から100:1)
  - 閾値以下の信号の減衰強度を制御
  - 1:1:エフェクトなし
  - 10:1:強いノイズ低減
  - 100:1:閾値以下でほぼ完全な無音
  - 一般的なノイズ低減には10:1から開始

- **Attack Time** (0.01msから50ms)
  - 信号が閾値を超えた時のゲートの反応速度
  - 速い時間:より正確だが急激に聞こえる可能性
  - 遅い時間:より自然な遷移
  - 開始点として1msを試してみてください

- **Release Time** (10msから2000ms)
  - 信号が閾値以下になった時のゲートが閉じる速度
  - 速い時間:よりタイトなノイズ制御
  - 遅い時間:より自然な減衰
  - 自然なサウンドには200msから開始

- **Knee** (0dBから6dB)
  - 閾値付近でのゲートの遷移の緩やかさを制御
  - 0dB:正確なゲーティングのためのハードニー
  - 6dB:よりスムーズな遷移のためのソフトニー
  - 一般的なノイズ低減には1dBを使用

- **Gain** (-12dBから+12dB)
  - ゲーティング後の出力レベルを調整
  - 知覚される音量の損失を補正するために使用
  - 必要でない限り0dBのままにしておく

### 視覚的フィードバック
- 以下を表示するインタラクティブな伝達関数グラフ:
  - 入力/出力の関係
  - 閾値ポイント
  - ニーカーブ
  - レシオスロープ
- 以下を表示するリアルタイムゲイン低減メーター:
  - 現在のノイズ低減量
  - ゲート動作の視覚的フィードバック

### 推奨設定

#### 軽度のノイズ低減
- Threshold: -50dB
- Ratio: 2:1
- Attack: 5ms
- Release: 300ms
- Knee: 3dB
- Gain: 0dB

#### 中程度のバックグラウンドノイズ
- Threshold: -40dB
- Ratio: 10:1
- Attack: 1ms
- Release: 200ms
- Knee: 1dB
- Gain: 0dB

#### 強力なノイズ除去
- Threshold: -30dB
- Ratio: 50:1
- Attack: 0.1ms
- Release: 100ms
- Knee: 0dB
- Gain: 0dB

### 使用上のヒント
- 最適な結果を得るためにノイズフロアのすぐ上に閾値を設定
- より自然なサウンドには長めのリリース時間を使用
- 複雑な素材を処理する際にはニーを追加
- 適切なゲーティングを確保するためにゲイン低減メーターを監視
- 包括的な制御のために他のダイナミクスプロセッサーと組み合わせる

## Multiband Compressor

オーディオを5つの周波数帯域に分割し、それぞれを独立して処理するプロフェッショナルグレードのダイナミクスプロセッサーです。周波数スペクトルの各部分が完璧に制御されバランスの取れた、FMラジオのようなサウンドの作成に特に効果的です。

### 主な特徴
- 調整可能なクロスオーバー周波数を持つ5バンド処理
- 各バンドの独立したコンプレッション制御
- FMラジオ風サウンドに最適化されたデフォルト設定
- バンドごとのゲイン低減のリアルタイム可視化
- 高品質なLinkwitz-Rileyクロスオーバーフィルター

### 周波数バンド
- バンド1(低域): 100 Hz以下
  - 深い低音とサブ周波数を制御
  - タイトで制御された低音のために高いレシオと長めのリリース
- バンド2(低中域): 100-500 Hz
  - 上部の低音と下部の中域を処理
  - 温かみを維持するための適度な圧縮
- バンド3(中域): 500-2000 Hz
  - 重要なボーカルと楽器のプレゼンス帯域
  - 自然さを保つための穏やかな圧縮
- バンド4(高中域): 2000-8000 Hz
  - プレゼンスと空気感を制御
  - より速いレスポンスでの軽い圧縮
- バンド5(高域): 8000 Hz以上
  - 明るさとスパークルを管理
  - 高いレシオでの素早いレスポンスタイム

### パラメータ(バンドごと)
- **Threshold** (-60dBから0dB)
  - 圧縮が開始されるレベルを設定
  - 低い設定でより一貫したレベルを実現
- **Ratio** (1:1から20:1)
  - ゲイン低減量を制御
  - より積極的な制御には高いレシオ
- **Attack** (0.1msから100ms)
  - 圧縮の反応速度
  - トランジェント制御には速い時間
- **Release** (10msから1000ms)
  - ゲインが通常に戻る速度
  - よりスムーズなサウンドには長い時間
- **Knee** (0dBから12dB)
  - 圧縮開始の滑らかさ
  - より自然な遷移には高い値
- **Gain** (-12dBから+12dB)
  - バンドごとの出力レベル調整
  - 周波数バランスの微調整

### FMラジオ風の処理
Multiband Compressorには、FMラジオ放送のような洗練されたプロフェッショナルなサウンドを再現する最適化されたデフォルト設定が用意されています:

- 低域バンド(< 100 Hz)
  - タイトな低音制御のための高いレシオ(4:1)
  - パンチを維持するための遅めのアタック/リリース
  - 濁りを防ぐための軽い低減

- 低中域バンド(100-500 Hz)
  - 適度な圧縮(3:1)
  - 自然なレスポンスのためのバランスの取れたタイミング
  - 温かみを維持するためのニュートラルなゲイン

- 中域バンド(500-2000 Hz)
  - 穏やかな圧縮(2.5:1)
  - 素早いレスポンスタイム
  - ボーカルのプレゼンスのための軽いブースト

- 高中域バンド(2000-8000 Hz)
  - 軽い圧縮(2:1)
  - 速いアタック/リリース
  - プレゼンスの強調

- 高域バンド(> 8000 Hz)
  - 一貫した輝きのための高いレシオ(5:1)
  - 非常に速いレスポンスタイム
  - 洗練された仕上がりのための制御された低減

この設定は以下のような特徴的な「ラジオ向け」サウンドを作り出します:
- 一貫性のある、インパクトのある低音
- クリアで前方に出たボーカル
- すべての周波数で制御されたダイナミクス
- プロフェッショナルな洗練さと輝き
- 強調されたプレゼンスと明瞭さ
- リスニング疲労の軽減

### 視覚的フィードバック
- 各バンドのインタラクティブな伝達関数グラフ
- リアルタイムのゲイン低減メーター
- 周波数バンドのアクティビティ可視化
- 明確なクロスオーバーポイントインジケーター

### 使用上のヒント
- デフォルトのFMラジオプリセットから開始
- 素材に合わせてクロスオーバー周波数を調整
- 望ましい制御量のために各バンドの閾値を微調整
- 最終的な周波数バランスを整えるためにゲインコントロールを使用
- 適切な処理を確保するためにゲイン低減メーターを監視

## Multiband Transient

オーディオを3つの周波数帯域（Low、Mid、High）に分割し、各帯域に独立したトランジェントシェイピングを適用する高度なトランジェント処理プロセッサーです。この洗練されたツールにより、異なる周波数帯域のアタックとサステイン特性を同時に強化または抑制でき、音楽のパンチ、クリアリティ、ボディの精密な制御が可能になります。

### リスニング向上ガイド
- **クラシック音楽:**
  - ストリングセクションのアタックを強化して明瞭度を向上させながら、低域のホール残響を制御
  - ピアノのトランジェントを周波数スペクトラム全体で異なるようにシェイプし、よりバランスの取れたサウンドに
  - ティンパニ（低域）とシンバル（高域）のパンチを独立して制御し、最適なオーケストラバランスを実現

- **Rock/Pop音楽:**
  - キックドラム（低域バンド）にパンチを加えながら、スネアプレゼンス（中域バンド）を強化
  - ベースギターのアタックをボーカルのクリアリティとは別々に制御
  - 高域のギターピックアタックをベースレスポンスに影響を与えずにシェイプ

- **電子音楽:**
  - ベースドロップとリードシンセサイザーを独立してシェイプ
  - サブベースのパンチを制御しながら高域のクリアリティを維持
  - 周波数スペクトラム全体で個別の要素に定義を追加

### 周波数帯域

Multiband Transientプロセッサーは、オーディオを3つの綿密に設計された周波数帯域に分割します：

- **Low Band**（Freq 1以下）
  - ベースとサブベース周波数を制御
  - キックドラム、ベース楽器、低域要素のシェイピングに最適
  - デフォルトクロスオーバー：200 Hz

- **Mid Band**（Freq 1とFreq 2の間）
  - 重要な中域周波数を処理
  - ボーカルと楽器のプレゼンスの大部分を含む
  - デフォルトクロスオーバー：200 Hz～4000 Hz

- **High Band**（Freq 2以上）
  - 高音とエアー周波数を管理
  - シンバル、ギターピック、明るさを制御
  - デフォルトクロスオーバー：4000 Hz以上

### パラメータ

#### クロスオーバー周波数
- **Freq 1** (20Hz～2000Hz)
  - Low/Midクロスオーバーポイントを設定
  - 低い値：中高域により多くのコンテンツ
  - 高い値：低域により多くのコンテンツ
  - デフォルト：200Hz

- **Freq 2** (200Hz～20000Hz)
  - Mid/Highクロスオーバーポイントを設定
  - 低い値：高域により多くのコンテンツ
  - 高い値：中域により多くのコンテンツ
  - デフォルト：4000Hz

#### バンド別コントロール（Low、Mid、High）
各周波数帯域は独立したトランジェントシェイピングコントロールを持ちます：

- **Fast Attack** (0.1ms～10.0ms)
  - ファストエンベロープがトランジェントに応答する速さ
  - 低い値：より精密なトランジェント検出
  - 高い値：よりスムーズなトランジェント応答
  - 一般的範囲：0.5ms～5.0ms

- **Fast Release** (1ms～200ms)
  - ファストエンベロープがリセットされる速さ
  - 低い値：より厳密なトランジェント制御
  - 高い値：より自然なトランジェント減衰
  - 一般的範囲：20ms～50ms

- **Slow Attack** (1ms～100ms)
  - スローエンベロープの応答時間を制御
  - 低い値：トランジェントとサステインのより良い分離
  - 高い値：より段階的なサステイン検出
  - 一般的範囲：10ms～50ms

- **Slow Release** (50ms～1000ms)
  - サステイン部分が追跡される時間の長さ
  - 低い値：より短いサステイン検出
  - 高い値：より長いサステインテール追跡
  - 一般的範囲：150ms～500ms

- **Transient Gain** (-24dB～+24dB)
  - アタック部分を強化または抑制
  - 正の値：より多くのパンチと定義
  - 負の値：よりソフトで攻撃的でないアタック
  - 一般的範囲：0dB～+12dB

- **Sustain Gain** (-24dB～+24dB)
  - サステイン部分を強化または抑制
  - 正の値：より多くのボディと響き
  - 負の値：より厳密で制御されたサウンド
  - 一般的範囲：-6dB～+6dB

- **Smoothing** (0.1ms～20.0ms)
  - ゲイン変化の適用のスムーズさを制御
  - 低い値：より精密なシェイピング
  - 高い値：より自然で透明な処理
  - 一般的範囲：3ms～8ms

### ビジュアルフィードバック
- 3つの独立したゲイン可視化グラフ（帯域ごとに1つ）
- 各周波数帯域のリアルタイムゲイン履歴表示
- 参照用のタイムマーカー
- インタラクティブな帯域選択
- トランジェントシェイピング活動の明確な視覚的フィードバック

### 推奨設定

#### ドラムキット強化
- **Low Band（キックドラム）:**
  - Fast Attack: 2.0ms, Fast Release: 50ms
  - Slow Attack: 25ms, Slow Release: 250ms
  - Transient Gain: +6dB, Sustain Gain: -3dB
  - Smoothing: 5.0ms

- **Mid Band（スネア/ボーカル）:**
  - Fast Attack: 1.0ms, Fast Release: 30ms
  - Slow Attack: 15ms, Slow Release: 150ms
  - Transient Gain: +9dB, Sustain Gain: 0dB
  - Smoothing: 3.0ms

- **High Band（シンバル/ハイハット）:**
  - Fast Attack: 0.5ms, Fast Release: 20ms
  - Slow Attack: 10ms, Slow Release: 100ms
  - Transient Gain: +3dB, Sustain Gain: -6dB
  - Smoothing: 2.0ms

#### バランスの取れたフルミックス
- **全帯域:**
  - Fast Attack: 2.0ms, Fast Release: 30ms
  - Slow Attack: 20ms, Slow Release: 200ms
  - Transient Gain: +3dB, Sustain Gain: 0dB
  - Smoothing: 5.0ms

#### 自然なアコースティック強化
- **Low Band:**
  - Fast Attack: 5.0ms, Fast Release: 50ms
  - Slow Attack: 30ms, Slow Release: 400ms
  - Transient Gain: +2dB, Sustain Gain: +1dB
  - Smoothing: 8.0ms

- **Mid Band:**
  - Fast Attack: 3.0ms, Fast Release: 35ms
  - Slow Attack: 25ms, Slow Release: 300ms
  - Transient Gain: +4dB, Sustain Gain: +1dB
  - Smoothing: 6.0ms

- **High Band:**
  - Fast Attack: 1.5ms, Fast Release: 25ms
  - Slow Attack: 15ms, Slow Release: 200ms
  - Transient Gain: +3dB, Sustain Gain: -2dB
  - Smoothing: 4.0ms

### 使用のコツ
- 穏やかな設定から始めて、各帯域を独立して調整
- ビジュアルフィードバックを使用して適用されるトランジェントシェイピングの量を監視
- クロスオーバー周波数を設定する際は音楽コンテンツを考慮
- 高周波数帯域は通常、より速いアタック時間から恩恵を受ける
- 低周波数帯域は自然なサウンドのためより長いリリース時間が必要なことが多い
- 包括的な制御のため他のダイナミクスプロセッサーと組み合わせて使用

## Power Amp Sag

高負荷状態でのパワーアンプの電圧サグ特性をシミュレートするエフェクトです。音楽的なパッセージでアンプの電源が負荷をかけられた際に発生する自然な圧縮と温かみを再現し、オーディオにパンチと音楽的なキャラクターを追加します。

### リスニング向上ガイド
- **ヴィンテージオーディオシステム:**
  - 自然な圧縮でクラシックなアンプキャラクターを再現
  - ヴィンテージハイファイ機器の温かみと豊かさを追加
  - 本格的なアナログサウンドの実現に最適
- **Rock/Pop音楽:**
  - パワフルなパッセージでパンチとプレゼンスを強化
  - 刺激的でない自然な圧縮を追加
  - 満足感のあるアンプ「ドライブ」感を演出
- **クラシック音楽:**
  - オーケストラのクレッシェンドに自然なダイナミクスを提供
  - ストリングとブラスセクションにアンプの温かみを追加
  - アンプ再生での現実感を強化
- **ジャズ音楽:**
  - クラシックなアンプ圧縮動作を再現
  - ソロ楽器に温かみとキャラクターを追加
  - 自然なダイナミックフローを維持

### パラメータ

- **Sensitivity** (-18.0dB～+18.0dB)
  - サグエフェクトの入力レベルに対する感度を制御
  - 高い値：より低い音量でもサグが発生
  - 低い値：大きな信号にのみ作用
  - 自然な反応には0dBから開始

- **Stability** (0%～100%)
  - 電源のキャパシタンス容量をシミュレート
  - 低い値：小さなキャパシタ（より劇的なサグ）
  - 高い値：大きなキャパシタ（より安定した電圧）
  - 物理的に電源のエネルギー貯蔵容量を表現
  - 50%でバランスの取れたキャラクター

- **Recovery Speed** (0%～100%)
  - 電源の再充電能力を制御
  - 低い値：遅い再充電速度（持続的な圧縮）
  - 高い値：速い再充電速度（迅速な復帰）
  - 物理的に充電回路の電流供給能力を表現
  - 40%で自然な動作

- **Monoblock** (チェックボックス)
  - チャンネル毎の独立処理を有効化
  - 未チェック：共有電源（ステレオアンプ）
  - チェック：独立電源（モノブロック構成）
  - より良いチャンネル分離とイメージングに使用

### ビジュアル表示

- 入力エンベロープとゲイン低減を示すデュアルリアルタイムグラフ
- 入力エンベロープ（緑）：エフェクトを駆動する信号エネルギー
- ゲイン低減（白）：適用される電圧サグの量
- 1秒間隔の参照マーカー付き時間ベース表示
- リアルタイムで表示される現在の値

### 推奨設定

#### ヴィンテージキャラクター
- Sensitivity: +3.0dB
- Stability: 30%（小さなキャパシタ）
- Recovery Speed: 25%（遅い再充電）
- Monoblock: 未チェック

#### モダンハイファイ強化
- Sensitivity: 0.0dB
- Stability: 70%（大きなキャパシタ）
- Recovery Speed: 60%（速い再充電）
- Monoblock: チェック

#### ダイナミックRock/Pop
- Sensitivity: +6.0dB
- Stability: 40%（中程度のキャパシタ）
- Recovery Speed: 50%（中程度の再充電）
- Monoblock: 未チェック

## Transient Shaper

音のアタック（立ち上がり）部分とサステイン（持続）部分を独立して強調したり抑えたりできる特殊なダイナミクスプロセッサーです。このパワフルなツールにより、音楽のパンチ感と厚みを精密にコントロールでき、全体的な音量レベルを変えることなく音のキャラクターを再形成することができます。

### リスニング向上ガイド
- パーカッション:
  - トランジェントを強調してドラムにパンチと明瞭さを追加
  - サステイン部分を抑えて部屋の反響を低減
  - 音量を上げることなくドラムサウンドにインパクトを与える
- アコースティックギター:
  - ピッキングのアタックを強調してより明瞭で存在感のあるサウンドに
  - サステインをコントロールして他の楽器とのバランスを最適化
  - ストラミングパターンを整えてミックス内での位置づけを改善
- 電子音楽:
  - シンセのアタックを強調してよりパーカッシブな印象を与える
  - ベースサウンドのサステインをコントロールしてタイトなミックスを実現
  - 音色を変えることなく電子ドラムにパンチを追加

### パラメータ

- **Fast Attack** (0.1ms to 10.0ms)
  - 高速エンベロープフォロワーの反応速度をコントロール
  - 低い値：鋭いトランジェントにより敏感に反応
  - 高い値：よりスムーズなトランジェント検出
  - ほとんどの素材では1.0msから始めるとよい

- **Fast Release** (1ms to 200ms)
  - 高速エンベロープフォロワーのリセット速度
  - 低い値：より正確なトランジェントのトラッキング
  - 高い値：より自然なトランジェントシェイピング
  - 20msが適切な開始点

- **Slow Attack** (1ms to 100ms)
  - 低速エンベロープフォロワーの反応速度をコントロール
  - 低い値：トランジェントとサステインの分離がより明確に
  - 高い値：サステイン部分のより自然な検出
  - 20msが良いデフォルト設定

- **Slow Release** (50ms to 1000ms)
  - 低速エンベロープが休止状態に戻る速度
  - 低い値：より短いサステイン部分
  - 高い値：より長いサステインテールの検出
  - 開始点として300msを試してみてください

- **Transient Gain** (-24dB to +24dB)
  - サウンドのアタック部分を増強または抑制
  - 正の値：よりパンチ感と明瞭さを強調
  - 負の値：よりソフトで攻撃的でないサウンドに
  - トランジェントを強調するには+6dBから開始

- **Sustain Gain** (-24dB to +24dB)
  - サウンドのサステイン部分を増強または抑制
  - 正の値：より豊かな響きと厚みを追加
  - 負の値：よりタイトで制御されたサウンドに
  - 0dBから始めて好みに合わせて調整

- **Smoothing** (0.1ms to 20.0ms)
  - ゲイン変化の滑らかさをコントロール
  - 低い値：より精密だが、やや攻撃的なシェイピング
  - 高い値：より自然で透明な処理
  - 5.0msがほとんどの素材に適したバランス

### 視覚的表示
- リアルタイムのゲイン可視化
- 明確なゲイン履歴表示
- 参照用の時間マーカー
- 全パラメータの直感的なインターフェース

### 推奨設定

#### 強調されたパーカッション
- Fast Attack: 0.5ms
- Fast Release: 10ms
- Slow Attack: 15ms
- Slow Release: 200ms
- Transient Gain: +9dB
- Sustain Gain: -3dB
- Smoothing: 3.0ms

#### 自然なアコースティック楽器
- Fast Attack: 2.0ms
- Fast Release: 30ms
- Slow Attack: 25ms
- Slow Release: 400ms
- Transient Gain: +3dB
- Sustain Gain: 0dB
- Smoothing: 8.0ms

#### タイトな電子音楽サウンド
- Fast Attack: 1.0ms
- Fast Release: 15ms
- Slow Attack: 10ms
- Slow Release: 250ms
- Transient Gain: +6dB
- Sustain Gain: -6dB
- Smoothing: 4.0ms
