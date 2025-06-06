# Analyzerプラグイン

音楽を魅力的な方法で可視化できるプラグインのコレクションです。これらの視覚化ツールは、音の異なる側面を表示することで、聴いている内容の理解を助け、リスニング体験をより魅力的でインタラクティブなものにします。

## プラグイン一覧

- [Level Meter](#level-meter) - 音楽の再生音量を表示
- [Oscilloscope](#oscilloscope) - 波形をリアルタイムで可視化
- [Spectrogram](#spectrogram) - 音楽から美しい視覚的パターンを生成
- [Spectrum Analyzer](#spectrum-analyzer) - 音楽に含まれる周波数を表示
- [Stereo Meter](#stereo-meter) - ステレオバランスと音の動きを可視化

## Level Meter

音楽の再生音量をリアルタイムで表示する視覚的なディスプレイです。快適な音量レベルを維持し、音量が大きすぎることによる歪みを防ぐのに役立ちます。

### 表示ガイド
- メーターは音楽の音量に合わせて上下に動きます
- メーターが高いほど音が大きいことを示します
- 赤いマーカーは最近の最大レベルを表示
- 上部の赤い警告は音量が大きすぎる可能性を示します
- 快適なリスニングのために、レベルを中間範囲に保つようにしましょう

## Oscilloscope

リアルタイムのオーディオ波形を表示するプロフェッショナルグレードのオシロスコープです。トリガー機能を備えており、波形を安定して表示できるため、周期的な信号やトランジェントの分析が容易になります。

### 表示ガイド
- 横軸は時間を表示(ミリ秒)
- 縦軸は振幅を表示(-1から1)
- 緑の線が実際の波形をトレース
- グリッド線で時間と振幅の値を測定
- トリガーポイントは波形のキャプチャが開始される位置を示します

### パラメータ
- **Display Time** - 表示する時間の長さ(1から100 ms)
  - 低い値:短いイベントをより詳細に表示
  - 高い値:より長いパターンを表示
- **Trigger Mode**
  - Auto:トリガーがなくても継続的に更新
  - Normal:次のトリガーまで表示を固定
- **Trigger Source** - トリガーの対象チャンネル
  - 左/右チャンネルの選択
- **Trigger Level** - キャプチャを開始する振幅レベル
  - 範囲:-1から1(正規化された振幅)
- **Trigger Edge**
  - Rising:信号が上昇する時にトリガー
  - Falling:信号が下降する時にトリガー
- **Holdoff** - トリガー間の最小時間(0.1から10 ms)
- **Display Level** - 垂直スケール(dB)(-96から0 dB)
- **Vertical Offset** - 波形を上下にシフト(-1から1)

### 波形表示に関する注意
表示される波形は、滑らかな可視化のためにサンプルポイント間を線形補間しています。これは、サンプル間の実際のオーディオ信号が表示されているものと異なる可能性があることを意味します。高周波数成分を分析する場合など、より正確な表示が必要な場合は、より高いサンプルレート(96kHz以上)の使用を検討してください。

## Spectrogram

音楽の時間的な変化を美しいカラフルなパターンで表示します。異なる音や周波数を異なる色で表現する、音楽の絵画のようなものです。

### 表示ガイド
- 色は異なる周波数の強さを表示:
  - 暗い色:静かな音
  - 明るい色:大きな音
  - 音楽に合わせてパターンが変化します
- 垂直位置は周波数を表示:
  - 下部:低音
  - 中央:主要な楽器
  - 上部:高周波

### 見えるもの
- メロディ:色の流れるライン
- ビート:垂直のストライプ
- ベース:下部の明るい色
- ハーモニー:複数の平行なライン
- 異なる楽器が独自のパターンを作成

### パラメータ
- **DB Range** - 色の鮮やかさ(-144dBから-48dB)
  - 低い数値:より繊細な詳細を表示
  - 高い数値:主要な音に焦点を当てる
- **Points** - パターンの詳細度(256から16384)
  - 高い数値:より正確なパターン
  - 低い数値:よりスムーズな表示
- **Channel** - ステレオフィールドのどの部分を表示するか
  - All:すべてを結合
  - Left/Right:個別の側

## Spectrum Analyzer

深い低音から高い高音まで、音楽の周波数をリアルタイムで視覚的に表示します。音楽の完全なサウンドを構成する個々の要素を見るようなものです。

### 表示ガイド
- 左側は低周波数を表示(ドラム、ベースギター)
- 中央は主要な周波数を表示(ボーカル、ギター、ピアノ)
- 右側は高周波数を表示(シンバル、輝き、空気感)
- ピークが高いほど、その周波数の存在感が強いことを示します
- 異なる楽器が異なるパターンを作り出す様子を観察できます

### 見えるもの
- ベースドロップ:左側の大きな動き
- ボーカルメロディ:中央部分の活動
- クリアな高音:右側のきらめき
- フルミックス:すべての周波数がどのように協調しているか

### パラメータ
- **DB Range** - 表示の感度(-144dBから-48dB)
  - 低い数値:より繊細な詳細を表示
  - 高い数値:主要な音に焦点を当てる
- **Points** - 表示の詳細度(256から16384)
  - 高い数値:より正確な詳細
  - 低い数値:よりスムーズな動き
- **Channel** - ステレオフィールドのどの部分を表示するか
  - All:すべてを結合
  - Left/Right:個別の側

### これらのツールの楽しい使い方

1. 音楽の探索
   - 異なるジャンルが作り出す異なるパターンを観察
   - アコースティックと電子音楽の違いを確認
   - 楽器が異なる周波数帯域を占める様子を観察

2. サウンドについての学習
   - 電子音楽のベースを視覚的に確認
   - ボーカルメロディが表示を横切る様子を観察
   - ドラムが鋭いパターンを作り出す様子を観察

3. 体験の向上
   - Level Meterを使用して快適な視聴音量を見つける
   - Spectrum Analyzerが音楽と共に踊る様子を観察
   - Spectrogramで視覚的な光のショーを作成

## Stereo Meter

ステレオサウンドによって生み出される音の空間的な広がりを視覚化する魅力的なツールです。スピーカーやヘッドホン間での音の動きを観察でき、リスニング体験に新たな視覚的な次元を加えます。

### 表示ガイド
- **ダイヤモンド表示** - 音楽が生き生きと表現されるメインウィンドウ:
  - 中央: 音のバランスが均等な状態
  - 上下: 両方のスピーカーが均等に音を出している状態
  - 左右: 片方のスピーカーからより多くの音が出ている状態
  - 緑の点が現在の音楽に合わせて踊るように動く
  - 白い線が音楽のピークをトレース
- **動きバー** (左側)
  - スピーカー同士の協調の様子を表示
  - 上部(+1.0): 両方のスピーカーが同じ音を再生
  - 中央(0.0): スピーカーが良好なステレオ効果を生成
  - 下部(-1.0): スピーカーが特殊効果を生成
- **バランスバー** (下部)
  - 片方のスピーカーがもう片方より大きな音を出しているかを表示
  - 中央: 両方のスピーカーで同じ音量
  - 左右: 片方のスピーカーの音が強い
  - 数値はデシベル(dB)単位での音量差を表示

### 見えるもの
- **センターの音**: 中央での強い垂直方向の動き
- **空間的な音**: 表示全体に広がる活動
- **特殊効果**: 角の部分での興味深いパターン
- **スピーカーバランス**: 下部バーの指す方向
- **音の動き**: 左バーの上下する高さ

### パラメータ
- **Window Time** (10-1000 ms)
  - 低い値: 素早い音楽の変化を確認
  - 高い値: 全体的な音のパターンを確認
  - デフォルト: 100 msが多くの音楽に適している

### 音楽を楽しむために
1. **異なるスタイルを観察**
   - クラシック音楽は穏やかでバランスの取れたパターンを示す
   - 電子音楽は大胆に広がるデザインを生み出す
   - ライブ録音は自然な空間の動きを見せる

2. **音の特質を発見**
   - アルバムごとのステレオ効果の使い方の違いを確認
   - 曲によって異なる音の広がり方を観察
   - 楽器がスピーカー間を移動する様子を確認

3. **体験を深める**
   - 異なるヘッドホンでステレオの表現の違いを比較
   - お気に入りの曲の新旧録音を比較
   - 異なるリスニングポジションでの表示の変化を観察

注意:これらのツールは、リスニング体験に視覚的な次元を追加することで、音楽の楽しみを向上させることを目的としています。お気に入りの音楽を新しい方法で見る楽しみを探索してください!
