# Delay 插件

一系列用于调整音频信号时序或添加清晰重复效果的工具。这些插件可帮助您微调音频的时间对齐、创建富有节奏的回声，或为您的听觉体验增添空间感和深度。

## 插件列表

- [Delay](#delay) - 创建具有时序、音调和立体声扩展控制的回声。
- [Modal Resonator](#modal-resonator) - 具有多达 5 个共鸣器的频率共鸣效果
- [Time Alignment](#time-alignment) - 对音频通道进行精确的时序调整。

## Delay

此效果为您的音频添加清晰的回声。您可以控制回声重复的速度、它们如何衰减以及如何在扬声器之间扩散，从而为您的音乐播放添加微妙的深度、节奏趣味或创造性的空间效果。

### 听觉体验指南

- **微妙的深度和空间感：**
  - 在不冲淡声音的情况下增添柔和的空间感。
  - 可以使人声或主奏乐器感觉稍微更宏大或更具临场感。
  - 使用短的延迟时间和低的反馈/混合比例。
- **节奏增强：**
  - 创建与音乐节拍同步的回声（手动调整）。
  - 为电子音乐、鼓或吉他增添律动感和活力。
  - 尝试不同的延迟时间（例如，通过耳朵匹配八分音符或四分音符）。
- **拍击回声 (Slapback Echo)：**
  - 一种非常短的单次回声，常用于摇滚和乡村音乐的人声或吉他。
  - 增添打击乐般的加倍效果。
  - 使用非常短的延迟时间（30-120ms）、零反馈和适度的混合比例。
- **创造性的立体声扩展：**
  - 使用 Ping-Pong 控制，回声可以在左右扬声器之间反弹。
  - 创建更宽广、更引人入胜的立体声像。
  - 可以使声音感觉更具动感和趣味性。

### 参数

- **Pre-Delay (ms)** - 听到*第一个*回声之前的时长（0 到 100 毫秒）。
  - 较低的值（0-20ms）：回声几乎立即开始。
  - 较高的值（20-100ms）：在回声之前创建明显的间隙，将其与原始声音分开。
- **Delay Size (ms)** - 每个回声之间的时间（1 到 5000 毫秒）。
  - 短（1-100ms）：产生增厚或"拍击回声"效果。
  - 中（100-600ms）：标准回声效果，适合节奏增强。
  - 长（600ms+）：间隔宽、清晰的回声。
  - *提示：* 尝试跟着音乐打拍子，找到感觉有节奏感的延迟时间。
- **Damping (%)** - 控制每次回声中高频和低频衰减的程度（0 到 100%）。
  - 0%：回声保持原始音色（更明亮）。
  - 50%：平衡、自然的衰减。
  - 100%：回声迅速变得明显更暗、更薄（更沉闷）。
  - 与 High/Low Damp 结合使用。
- **High Damp (Hz)** - 设置回声开始失去亮度的频率（1000 到 20000 Hz）。
  - 较低的值（例如 2000Hz）：回声迅速变暗。
  - 较高的值（例如 10000Hz）：回声保持明亮的时间更长。
  - 与 Damping 一起调整以控制回声的音调。
- **Low Damp (Hz)** - 设置回声开始失去丰满度的频率（20 到 1000 Hz）。
  - 较低的值（例如 50Hz）：回声保留更多低音。
  - 较高的值（例如 500Hz）：回声更快变薄。
  - 与 Damping 一起调整以控制回声的音调。
- **Feedback (%)** - 您听到多少次回声，或它们持续多长时间（0 到 99%）。
  - 0%：只听到一次回声。
  - 10-40%：几次明显的重复。
  - 40-70%：更长、逐渐消失的回声轨迹。
  - 70-99%：非常长的轨迹，接近自激振荡（请谨慎使用！）。
- **Ping-Pong (%)** - 控制回声如何在立体声通道之间反弹（0 到 100%）。（仅影响立体声播放）。
  - 0%：标准延迟 - 左输入回声在左侧，右输入在右侧。
  - 50%：单声道反馈 - 回声集中在扬声器之间。
  - 100%：完全乒乓 - 回声在左右扬声器之间交替。
  - 中间值产生不同程度的立体声扩展。
- **Mix (%)** - 平衡回声音量与原始声音的比例（0 到 100%）。
  - 0%：无效果。
  - 5-15%：微妙的深度或节奏感。
  - 15-30%：清晰可闻的回声（良好的起点）。
  - 30%+：更强、更明显的效果。默认值为 16%。

### 推荐的听觉增强设置

1.  **微妙的人声/乐器深度：**
    - Delay Size: 80-150ms
    - Feedback: 0-15%
    - Mix: 8-16%
    - Ping-Pong: 0%（或尝试 20-40% 以获得轻微宽度）
    - Damping: 40-60%
2.  **节奏增强（电子/流行）：**
    - Delay Size: 尝试通过耳朵匹配节奏（例如 120-500ms）
    - Feedback: 20-40%
    - Mix: 15-25%
    - Ping-Pong: 0% 或 100%
    - Damping: 根据口味调整（较低以获得更明亮的重复）
3.  **经典摇滚拍击回声（吉他/人声）：**
    - Delay Size: 50-120ms
    - Feedback: 0%
    - Mix: 15-30%
    - Ping-Pong: 0%
    - Damping: 20-40%
4.  **宽广的立体声回声（氛围/铺底音色）：**
    - Delay Size: 300-800ms
    - Feedback: 40-60%
    - Mix: 20-35%
    - Ping-Pong: 70-100%
    - Damping: 50-70%（用于更平滑的尾音）

### 快速入门指南

1.  **设置时序：**
    - 从 `Delay Size` 开始设置主要的回声节奏。
    - 调整 `Feedback` 来控制您听到的回声次数。
    - 如果您希望在第一个回声之前有间隙，请使用 `Pre-Delay`。
2.  **调整音调：**
    - 同时使用 `Damping`、`High Damp` 和 `Low Damp` 来塑造回声衰减时的声音。从 Damping 约 50% 开始，并调整 Damp 频率。
3.  **立体声定位（可选）：**
    - 如果您正在进行立体声聆听，请尝试使用 `Ping-Pong` 来控制回声的宽度。
4.  **混合：**
    - 使用 `Mix` 来平衡回声音量与原始音乐。从低比例（约 16%）开始，然后增加直到效果感觉合适。

---

## Modal Resonator

一种创造性的效果，可为您的音频添加共鸣频率。此插件在特定频率创建调谐的共鸣，类似于物理对象在其自然共鸣频率下振动的方式。它非常适合添加独特的音调特性、模拟不同材料的共鸣属性或创建特殊效果。

### 听觉体验指南

- **金属共鸣：**
  - 创建跟随源材料动态的钟声或金属音调。
  - 可用于为打击乐、合成器或完整混音添加闪光或金属特性。
  - 在仔细调谐的频率上使用多个共鸣器，并设置适中的衰减时间。
- **音调增强：**
  - 微妙地增强音乐中的特定频率。
  - 可以突出谐波或为特定频率范围增加丰满度。
  - 使用较低的混合值（10-20%）以获得微妙的增强效果。
- **全频扬声器模拟：**
  - 模拟物理扬声器的模态行为。
  - 重现当驱动单元在不同频率上分割其振动时发生的独特共鸣。
  - 有助于模拟特定扬声器类型的特征声音。
- **特殊效果：**
  - 创建不寻常的音色品质和超凡脱俗的纹理。
  - 非常适合声音设计和实验性处理。
  - 尝试极端设置以进行创造性的声音转换。

### 参数

- **Resonator Selection (1-5)** - 五个独立的共鸣器，可以单独启用/禁用和配置。
  - 使用多个共鸣器可获得复杂、分层的共鸣效果。
  - 每个共鸣器可以针对不同的频率区域。
  - 尝试共鸣器之间的谐波关系以获得更具音乐性的结果。

对于每个共鸣器：

- **Enable** - 切换单个共鸣器的开/关状态。
  - 允许选择性地启用特定频率的共鸣。
  - 可用于对不同共鸣器组合进行 A/B 测试。

- **Freq (Hz)** - 设置主共鸣频率（20 至 20,000 Hz）。
  - 低频（20-200 Hz）：增加主体感和基频共鸣。
  - 中频（200-2000 Hz）：增加临场感和音调特性。
  - 高频（2000+ Hz）：创建钟声般的金属质感。
  - *提示：* 对于音乐应用，尝试将共鸣器调谐到音阶中的音符或基频的谐波。

- **Decay (ms)** - 控制输入声音后共鸣持续的时间（1 至 500 毫秒）。
  - 短（1-50ms）：快速、打击乐般的共鸣。
  - 中（50-200ms）：听起来自然的共鸣，类似于小型金属或木制物体。
  - 长（200-500ms）：钟声般、持续的共鸣。
  - *注意：* 为了获得自然的声音，高频会自动比低频衰减得更快。

- **LPF Freq (Hz)** - 塑造共振音色的低通滤波器（20至20,000 Hz）。
  - 较低值：更暗淡、更柔和的共振音色。
  - 较高值：更明亮、更突出的共振音色。
  - 调整以控制共振的谐波内容。

- **HPF Freq (Hz)** - 从共振中去除不需要的低频的高通滤波器（20至20,000 Hz）。
  - 较低值：允许更多的低频内容通过。
  - 较高值：通过去除低频使共振音色变薄。
  - 与LPF一起使用可以精确控制频段。
  - 默认值设置为每个谐振器频率的一半。

- **Gain (dB)** - 控制每个谐振器的单独输出电平（-18至+18 dB）。
  - 负值：降低共鸣器的输出电平。
  - -12 dB：默认增益设置。
  - 正值：提高共鸣器的输出电平。
  - 有助于微调不同共鸣器之间的平衡。

- **Mix (%)** - 平衡共鸣音量与原始声音的比例（0 至 100%）。
  - 0%：无效果。
  - 5-25%：微妙的增强。
  - 25-50%：原始声音和共鸣声音的均衡混合。
  - 50-100%：共鸣比原始声音更占主导地位。

### 推荐的听觉增强设置

1. **微妙的扬声器增强：**
   - 启用 2-3 个共鸣器
   - Freq 设置：400 Hz、900 Hz、1600 Hz
   - Decay：60-100ms
   - LPF Freq：2000-4000 Hz
   - Mix：10-20%

2. **金属特性：**
   - 启用 3-5 个共鸣器
   - Freq 设置：分布在 1000-6500 Hz 之间
   - Decay：100-200ms
   - LPF Freq：4000-8000 Hz
   - Mix：15-30%

3. **低音增强：**
   - 启用 1-2 个共鸣器
   - Freq 设置：50-150 Hz
   - Decay：50-100ms
   - LPF Freq：1000-2000 Hz
   - Mix：10-25%

4. **全频扬声器模拟：**
   - 启用所有 5 个共鸣器
   - Freq 设置：100 Hz、400 Hz、800 Hz、1600 Hz、3000 Hz
   - Decay：从低到高逐渐变短（100ms 到 30ms）
   - LPF Freq：从低到高逐渐变高（2000Hz 到 4000Hz）
   - Mix：20-40%

### 快速入门指南

1. **选择共鸣点：**
   - 从启用一个或两个共鸣器开始。
   - 设置它们的频率以针对您想要增强的区域。
   - 对于更复杂的效果，添加更多具有互补频率的共鸣器。

2. **调整特性：**
   - 使用 `Decay` 参数控制共鸣持续的时间。
   - 使用 `LPF Freq` 控件塑造音调。
   - 较长的衰减时间会产生更明显、钟声般的音调。

3. **与原始声音混合：**
   - 使用 `Mix` 来平衡效果与您的源材料。
   - 从较低的混合值（10-20%）开始以获得微妙的增强效果。
   - 增加以获得更戏剧性的效果。

4. **微调：**
   - 对频率和衰减时间进行细微调整。
   - 启用/禁用单个共鸣器以找到完美的组合。
   - 请记住，细微的变化会对整体声音产生重大影响。

---

## Time Alignment

一种精密工具，可让您以毫秒级的精度调整音频通道的时序。非常适合校正相位问题或创建特定的立体声效果。

### 何时使用
- 校正立体声通道之间的相位对齐
- 补偿扬声器距离差异
- 微调立体声成像
- 校正录音中的时序不匹配

### 参数
- **Delay** - 控制延迟时间（0 到 100ms）
  - 0ms：无延迟（原始时序）
  - 较高的值：增加延迟
  - 精细调整以实现精确控制
- **Channel** - 选择要延迟的通道
  - All：影响两个通道
  - Left：仅延迟左通道
  - Right：仅延迟右通道

### 推荐用途

1. 扬声器对齐
   - 补偿不同的扬声器距离
   - 匹配监听器之间的时序
   - 根据房间声学进行调整

2. 录音校正
   - 修复麦克风之间的相位问题
   - 对齐多个音频源
   - 校正时序差异

3. 创意效果
   - 创建微妙的立体声扩展
   - 设计空间效果
   - 试验通道时序

请记住：目标是增强您的听觉享受。尝试使用控件，找到能够为您喜爱的音乐增添趣味和深度而又不会压倒它的声音。