# Frieve EffeTune <img src="../../../images/icon_64x64.png" alt="EffeTune Icon" width="30" height="30" align="bottom">

[Open Web App](https://frieve-a.github.io/effetune/effetune.html)  [Download Desktop App](https://github.com/Frieve-A/effetune/releases/)

음악 애호가들을 위해 설계된 실시간 오디오 이펙트 프로세서입니다.
EffeTune은 다양한 고품질 이펙트를 통해 모든 오디오 소스를 처리할 수 있으며, 이를 통해 실시간으로 자신만의 청취 환경을 맞춤 설정하고 완벽하게 조정할 수 있습니다.

[![Screenshot](../../../images/screenshot.png)](https://frieve-a.github.io/effetune/effetune.html)

## 컨셉

EffeTune은 음악 청취 경험을 향상시키고자 하는 오디오 애호가들을 위해 제작되었습니다.  
스트리밍 서비스로 음악을 감상하든, 물리적 매체로 재생하든, EffeTune을 사용하면 전문적인 수준의 이펙트를 추가하여 자신만의 정확한 선호도에 맞게 사운드를 맞춤 설정할 수 있습니다.  
컴퓨터를 오디오 소스와 스피커 또는 앰프 사이에 위치한 강력한 오디오 이펙트 프로세서로 변환하세요.

아무런 오디오 애호가의 미신은 없고, 오직 순수한 과학만 있습니다.

## Features

- Real-time audio processing
- Drag-and-drop interface for building effect chains
- Expandable effect system with categorized effects
- Live audio visualization
- Audio pipeline that can be modified in real-time
- Offline audio file processing with current effect chain
- Section feature for grouping and controlling multiple effects together

## 기능

- 실시간 오디오 처리
- 드래그 앤 드롭 인터페이스를 사용하여 이펙트 체인 구성
- 범주별 이펙트가 포함된 확장 가능한 이펙트 시스템
- 라이브 오디오 시각화
- 실시간으로 수정 가능한 오디오 파이프라인
- 현재 이펙트 체인을 사용하여 오프라인 오디오 파일 처리

## 설정 가이드

EffeTune을 사용하기 전에 오디오 라우팅을 설정해야 합니다.
다음은 다양한 오디오 소스의 구성 방법입니다:

### 음악 파일 플레이어 설정

- 브라우저에서 EffeTune 웹 앱을 열거나, EffeTune 데스크톱 앱을 실행합니다.
- 음악 파일을 열고 재생하여 올바르게 재생되는지 확인합니다
   - 음악 파일을 열고 EffeTune을 애플리케이션으로 선택합니다 (데스크톱 앱 전용)
   - 또는 파일 메뉴에서 음악 파일 열기...를 선택합니다 (데스크톱 앱 전용)
   - 또는 음악 파일을 창으로 드래그합니다

### 스트리밍 서비스 설정

스트리밍 서비스(Spotify, YouTube Music 등)에서 오디오를 처리하려면:

1. **사전 준비:**
   - VB Cable, Voice Meeter 또는 ASIO Link Tool과 같은 가상 오디오 장치를 설치합니다.
   - 스트리밍 서비스가 오디오를 가상 오디오 장치로 출력하도록 구성합니다.
2. **구성:**
   - 브라우저에서 EffeTune 웹 앱을 열거나, EffeTune 데스크톱 앱을 실행합니다.
   - 입력 소스로 가상 오디오 장치를 선택합니다.
     - Chrome에서는 처음 열 때 오디오 입력을 선택하고 허용하라는 대화 상자가 나타납니다.
     - 데스크톱 앱에서는 화면 오른쪽 상단의 Config Audio 버튼을 클릭하여 설정합니다.
   - 스트리밍 서비스에서 음악 재생을 시작합니다.
   - EffeTune을 통해 오디오가 흐르고 있는지 확인합니다.

### 물리적 오디오 소스 설정

CD 플레이어, 네트워크 플레이어 또는 기타 물리적 소스를 사용하려면:

- 오디오 인터페이스를 컴퓨터에 연결합니다.
- 브라우저에서 EffeTune 웹 앱을 열거나, EffeTune 데스크톱 앱을 실행합니다.
- 입력 및 출력 소스로 오디오 인터페이스를 선택합니다.
   - Chrome에서는 처음 열 때 오디오 입력을 선택하고 허용하라는 대화 상자가 나타납니다.
   - 데스크톱 앱에서는 화면 오른쪽 상단의 Config Audio 버튼을 클릭하여 설정합니다.
- 이제 오디오 인터페이스는 다중 이펙트 프로세서로 작동합니다:
   * **입력:** CD 플레이어, 네트워크 플레이어 또는 기타 오디오 소스
   * **처리:** EffeTune을 통한 실시간 이펙트 처리
   * **출력:** 앰프 또는 스피커로 전달되는 처리된 오디오

## 사용법

### 이펙트 체인 구성하기

1. 왼쪽에 **"Available Effects"** 목록이 표시됩니다.
   - **"Available Effects"** 옆의 검색 버튼을 사용하여 이펙트를 필터링합니다.
   - 이름이나 범주로 이펙트를 찾기 위해 텍스트를 입력합니다.
   - ESC 키를 눌러 검색을 초기화합니다.
2. 목록에서 이펙트를 끌어서 **"Effect Pipeline"** 영역에 추가합니다.
3. 이펙트는 위에서 아래로 순서대로 처리됩니다.
4. 핸들(⋮)을 드래그하거나 ▲▼ 버튼으로 순서 변경.
5. 이펙트 이름을 클릭하여 설정 확장/축소.
   - Shift+클릭으로 Analyzer 카테고리를 제외한 모든 이펙트 일괄 확장/축소.
6. **"ON"** 버튼을 사용하여 개별 이펙트를 바이패스합니다.
7. **"?"** 버튼을 클릭하여 상세 문서를 새 탭에서 엽니다.
8. × 버튼을 사용하여 이펙트를 제거합니다
9. 라우팅 버튼을 클릭하여 입력 및 출력 버스를 설정하세요
   - [버스 기능에 대해 더 알아보기](bus-function.md)

### 프리셋 사용하기

1. **이펙트 체인 저장:**
   - 원하는 이펙트 체인과 파라미터를 설정합니다.
   - 입력 필드에 프리셋 이름을 입력합니다.
   - 저장 버튼을 클릭하여 프리셋을 저장합니다.
2. **프리셋 불러오기:**
   - 드롭다운 목록에서 프리셋 이름을 입력하거나 선택합니다.
   - 프리셋이 자동으로 불러와집니다.
   - 모든 이펙트와 설정이 복원됩니다.
3. **프리셋 삭제:**
   - 삭제할 프리셋을 선택합니다.
   - 삭제 버튼을 클릭합니다.
   - 삭제 확인 창이 표시되면 확인합니다.
4. **프리셋 정보:**
   - 각 프리셋은 전체 이펙트 체인 구성을 저장합니다.
   - 이펙트 순서, 파라미터, 상태 등이 포함됩니다.

### 이펙트 선택 및 키보드 단축키

1. **이펙트 선택 방법:**
   - 이펙트 헤더를 클릭하여 개별 이펙트를 선택합니다.
   - Ctrl 키를 누른 채 클릭하여 여러 이펙트를 선택합니다.
   - 파이프라인 영역의 빈 공간을 클릭하여 모든 이펙트 선택을 해제합니다.
2. **키보드 단축키:**
   - Ctrl + Z: 실행 취소
   - Ctrl + Y: 다시 실행
   - Ctrl + S: 현재 파이프라인 저장
   - Ctrl + Shift + S: 현재 파이프라인 다른 이름으로 저장
   - Ctrl + X: 선택한 효과 잘라내기
   - Ctrl + C: 선택한 효과 복사
   - Ctrl + V: 클립보드에서 효과 붙여넣기
   - Ctrl + F: 효과 검색
   - Ctrl + A: 파이프라인 내 모든 효과 선택
   - Delete: 선택한 효과 삭제
   - ESC: 모든 효과 선택 해제

3. **키보드 단축키 (플레이어 사용 시):**
   - Space: 재생/일시 정지
   - Ctrl + → 또는 N: 다음 트랙
   - Ctrl + ← 또는 P: 이전 트랙
   - Shift + → 또는 F 또는 .: 10초 앞으로 이동
   - Shift + ← 또는 B 또는 ,: 10초 뒤로 이동
   - Ctrl + T: 반복 모드 전환
   - Ctrl + H: 셔플 모드 전환

### 오디오 파일 처리

1. **파일 드롭 또는 지정 영역:**
   - **"Effect Pipeline"** 아래에 항상 보이는 전용 드롭 영역이 있습니다.
   - 단일 또는 다중 오디오 파일을 지원합니다.
   - 파일은 현재 파이프라인 설정을 사용하여 처리됩니다.
   - 모든 처리는 파이프라인의 샘플 레이트로 이루어집니다.
2. **처리 상태:**
   - 진행 바가 현재 처리 상태를 표시합니다.
   - 처리 시간은 파일 크기와 이펙트 체인의 복잡성에 따라 달라집니다.
3. **다운로드 옵션:**
   - 단일 파일은 WAV 형식으로 다운로드됩니다.
   - 여러 파일은 자동으로 ZIP 파일로 압축됩니다.

### 이펙트 체인 공유

다른 사용자와 이펙트 체인 구성을 공유할 수 있습니다:

1. 원하는 이펙트 체인을 설정한 후, **"Effect Pipeline"** 영역 오른쪽 상단에 있는 **"Share"** 버튼을 클릭합니다.
2. URL이 자동으로 클립보드에 복사됩니다.
3. 복사된 URL을 다른 사람과 공유하면, 해당 URL을 열어 동일한 이펙트 체인을 재구성할 수 있습니다.
4. 웹 앱에서는 모든 이펙트 설정이 URL에 저장되어 쉽게 저장하고 공유할 수 있습니다.
5. 데스크톱 앱 버전에서는 파일 메뉴에서 effetune_preset 파일로 설정을 내보낼 수 있습니다.
6. 내보낸 effetune_preset 파일을 공유하세요. effetune_preset 파일은 웹 앱 창으로 드래그하여 불러올 수도 있습니다.

### 오디오 재설정

오디오 문제(드롭아웃, 글리치 등)가 발생할 경우:

1. 웹 앱에서는 왼쪽 상단의 **"Reset Audio"** 버튼을 클릭하거나, 데스크톱 앱에서는 View 메뉴에서 Reload를 선택합니다.
2. 오디오 파이프라인이 자동으로 재구성됩니다.
3. 이펙트 체인 구성은 그대로 유지됩니다.

## 일반적인 이펙트 조합

다음은 청취 경험을 향상시키기 위한 인기 있는 이펙트 조합입니다:

### 헤드폰 향상

1. **Stereo Blend → RS Reverb**
   - **Stereo Blend:** 편안함을 위한 스테레오 폭 조절 (60-100%)
   - **RS Reverb:** 미묘한 룸 앰비언스 추가 (10-20% 믹스)
   - **결과:** 보다 자연스럽고 피로감을 줄여주는 헤드폰 청취

### 바이닐 시뮬레이션

1. **Wow Flutter → Noise Blender → Saturation**
   - **Wow Flutter:** 부드러운 피치 변동 추가
   - **Noise Blender:** 바이닐 느낌의 분위기 생성
   - **Saturation:** 아날로그 온기 추가
   - **결과:** 진정한 바이닐 레코드 경험

### FM 라디오 스타일

1. **Multiband Compressor → Stereo Blend**
   - **Multiband Compressor:** FM 라디오 스타일의 사운드 셰이핑을 위한 다중 밴드 압축
   - **Stereo Blend:** 편안함을 위한 스테레오 폭 조절 (100-150%)
   - **결과:** 전문 방송 같은 사운드

### Lo-Fi 특성

1. **Bit Crusher → Simple Jitter → RS Reverb**
   - **Bit Crusher:** 레트로 느낌을 위한 비트 깊이 감소
   - **Simple Jitter:** 디지털 불완전함 추가
   - **RS Reverb:** 분위기 있는 공간 효과 생성
   - **결과:** 클래식한 Lo-Fi 미학

## 문제 해결

### 오디오 문제

1. **드롭아웃 또는 글리치**
   - 웹 앱에서는 **"Reset Audio"** 버튼을 클릭하거나, 데스크톱 앱에서는 View 메뉴에서 Reload를 선택하여 오디오 파이프라인을 재구성합니다.
   - 활성 이펙트 수를 줄여봅니다.
   - 오디오를 사용하는 다른 브라우저 탭을 닫습니다.
2. **높은 CPU 사용률**
   - 현재 사용하지 않는 이펙트를 비활성화합니다.
   - 체인에 포함된 이펙트 수를 줄이는 것을 고려합니다.
3. **에코 발생**
   - 오디오 입력과 출력이 올바르게 구성되지 않았을 가능성이 높습니다.
   - 브라우저 오디오 출력을 처리하려면 EffeTune 전용 브라우저를 별도로 설치하거나, 웹 앱 대신 데스크톱 앱을 사용하세요.

### 일반적인 설정 문제

1. **오디오 입력 없음**
   - 소스에서 오디오가 재생되고 가상 오디오 장치로 출력되고 있는지 확인합니다.
   - 웹 앱 버전의 경우, 브라우저에서 오디오 입력 권한이 허용되어 있고 가상 오디오 장치가 입력 장치로 선택되어 있는지 확인합니다.
   - 데스크톱 앱 버전의 경우, 화면 오른쪽 상단의 Config Audio로 이동하여 가상 오디오 장치가 입력 장치로 선택되어 있는지 확인합니다.
2. **이펙트 작동 안 함**
   - 이펙트가 활성화되어 있는지 확인합니다 (**ON/OFF** 버튼).
   - 파라미터 설정을 확인합니다.
3. **오디오 출력 없음**
   - 웹 앱 버전의 경우, OS의 오디오 출력이 출력 장치로 설정되어 있는지 확인합니다.
   - 데스크톱 앱 버전의 경우, 화면 오른쪽 상단의 "Config Audio"로 이동하여 올바른 출력 장치가 선택되어 있는지 확인합니다.

## 자주 묻는 질문

**Q. 이 앱은 서라운드 사운드를 지원하나요?**  
A. 현재 브라우저의 제한으로 인해 2채널 이상의 처리가 불가능하며, 서라운드 사운드 작동 경험은 입증되지 않았습니다. 이펙트 자체는 서라운드 사운드를 지원하지만, 향후 브라우저 지원을 기다려야 합니다.

**Q. 권장 이펙트 체인 길이는 얼마인가요?**
A. 엄격한 제한은 없지만, 최적의 성능을 위해 8-10개의 이펙트를 유지하는 것을 권장합니다. 더 복잡한 체인은 시스템 성능에 영향을 줄 수 있습니다.

**Q. 최고의 음질을 얻으려면 어떻게 해야 하나요?**
A. 가능한 경우 96kHz 이상의 샘플 레이트를 사용하고, 미세한 이펙트 설정부터 시작하여 체인을 점진적으로 구성하며, 왜곡을 방지하기 위해 레벨을 모니터링하세요.

**Q. 이 앱은 모든 오디오 소스와 함께 작동하나요?**  
A. 예, EffeTune은 선택한 입력 장치를 통해 재생되는 스트리밍 서비스, 로컬 파일 및 물리적 매체를 포함한 모든 오디오를 처리할 수 있습니다.

## 사용 가능한 이펙트

| 카테고리    | 이펙트               | 설명                                                     | 문서                                                       |
|-------------|----------------------|----------------------------------------------------------|------------------------------------------------------------|
| Analyzer    | Level Meter          | 피크 홀드가 있는 오디오 레벨 표시                        | [상세](plugins/analyzer.md#level-meter)                    |
| Analyzer    | Oscilloscope         | 실시간 파형 시각화                                        | [상세](plugins/analyzer.md#oscilloscope)                   |
| Analyzer    | Spectrogram          | 시간에 따른 주파수 스펙트럼 변화 표시                     | [상세](plugins/analyzer.md#spectrogram)                    |
| Analyzer    | Spectrum Analyzer    | 실시간 스펙트럼 분석                                      | [상세](plugins/analyzer.md#spectrum-analyzer)              |
| Analyzer    | Stereo Meter         | 스테레오 밸런스 및 소리 이동 시각화                      | [상세](plugins/analyzer.md#stereo-meter)                   |
| Basics      | DC Offset            | DC 오프셋 조정                                           | [상세](plugins/basics.md#dc-offset)                        |
| Basics      | Polarity Inversion    | 신호 극성 반전                                           | [상세](plugins/basics.md#polarity-inversion)               |
| Basics      | Stereo Balance        | 스테레오 채널 밸런스 제어                                | [상세](plugins/basics.md#stereo-balance)                   |
| Basics      | Volume               | 기본 볼륨 제어                                           | [상세](plugins/basics.md#volume)                           |
| Delay       | Delay                | 표준 딜레이 효과                                         | [상세](plugins/delay.md#delay)                           |
| Delay       | Modal Resonator       | 최대 5개의 공진기를 가진 주파수 공진 효과                | [상세](plugins/delay.md#modal-resonator)                   |
| Delay       | Time Alignment        | 오디오 채널의 정밀 타이밍 조정                           | [상세](plugins/delay.md#time-alignment)                    |
| Dynamics    | Auto Leveler          | 일관된 청취 경험을 위한 LUFS 측정 기반 자동 볼륨 조정    | [상세](plugins/dynamics.md#auto-leveler)                  |
| Dynamics    | Brickwall Limiter      | 안전하고 편안한 청취를 위한 투명한 피크 제어             | [상세](plugins/dynamics.md#brickwall-limiter)             |
| Dynamics    | Compressor            | 임계값, 비율, 니 제어가 있는 다이나믹 레인지 압축        | [상세](plugins/dynamics.md#compressor)                     |
| Dynamics    | Gate                  | 잡음 감소를 위한 임계값, 비율, 니 제어가 있는 노이즈 게이트 | [상세](plugins/dynamics.md#gate)                           |
| Dynamics    | Multiband Compressor   | FM 라디오 스타일 사운드 쉐이핑을 갖춘 전문적인 5밴드 다이나믹 프로세서 | [상세](plugins/dynamics.md#multiband-compressor)           |
| EQ          | 15Band GEQ             | 15밴드 그래픽 이퀄라이저                                  | [상세](plugins/eq.md#15band-geq)                           |
| EQ          | 5Band PEQ              | 5개의 완전히 구성 가능한 밴드를 갖춘 전문적인 파라메트릭 이퀄라이저 | [상세](plugins/eq.md#5band-peq)                            |
| EQ | Hi Pass Filter | 불필요한 저주파수를 정밀하게 제거합니다 | [상세](plugins/eq.md#hi-pass-filter) |
| EQ | Lo Pass Filter | 불필요한 고주파수를 정밀하게 제거합니다 | [상세](plugins/eq.md#lo-pass-filter) |
| EQ          | Loudness Equalizer      | 낮은 볼륨 청취를 위한 주파수 밸런스 보정                  | [상세](plugins/eq.md#loudness-equalizer)                   |
| EQ          | Narrow Range            | 하이패스 및 로우패스 필터 조합                            | [상세](plugins/eq.md#narrow-range)                         |
| EQ          | Tilt EQ                 | 빠른 톤 쉐이핑을 위한 틸트 이퀄라이저                    | [상세](plugins/eq.md#tilt-eq)                              |
| EQ          | Tone Control            | 3밴드 톤 컨트롤                                          | [상세](plugins/eq.md#tone-control)                         |
| Lo-Fi       | Bit Crusher             | 비트 심도 감소 및 제로 오더 홀드 효과                    | [상세](plugins/lofi.md#bit-crusher)                         |
| Lo-Fi       | Noise Blender           | 노이즈 생성 및 믹싱                                      | [상세](plugins/lofi.md#noise-blender)                       |
| Lo-Fi       | Simple Jitter           | 디지털 지터 시뮬레이션                                    | [상세](plugins/lofi.md#simple-jitter)                       |
| Modulation  | Doppler Distortion       | 미묘한 스피커 콘 움직임으로 인한 자연스럽고 동적인 소리 변화 시뮬레이션 | [상세](plugins/modulation.md#doppler-distortion) |
| Modulation  | Pitch Shifter            | 경량 피치 쉬프팅 효과 | [상세](plugins/modulation.md#pitch-shifter) |
| Modulation  | Tremolo                  | 볼륨 기반 모듈레이션 효과 | [상세](plugins/modulation.md#tremolo) |
| Modulation  | Wow Flutter              | 시간 기반 모듈레이션 효과 | [상세](plugins/modulation.md#wow-flutter) |
| Reverb      | RS Reverb                | 자연스러운 확산을 가진 랜덤 스캐터링 리버브               | [상세](plugins/reverb.md#rs-reverb)                         |
| Saturation  | Hard Clipping            | 디지털 하드 클리핑 효과                                  | [상세](plugins/saturation.md#hard-clipping)                |
| Saturation  | Harmonic Distortion      | 각 하모닉의 독립적인 제어를 통해 고유한 특성을 추가하는 고조파 왜곡 | [상세](plugins/saturation.md#harmonic-distortion)          |
| Saturation  | Multiband Saturation      | 정밀한 주파수 기반 따뜻함을 위한 3밴드 새츄레이션 효과      | [상세](plugins/saturation.md#multiband-saturation)         |
| Saturation  | Saturation               | 새츄레이션 효과                                          | [상세](plugins/saturation.md#saturation)                   |
| Saturation  | Sub Synth                | 베이스 향상을 위한 서브하모닉 신호 믹싱                  | [상세](plugins/saturation.md#sub-synth)                    |
| Spatial     | Multiband Balance         | 5밴드 주파수 의존 스테레오 밸런스 제어                   | [상세](plugins/spatial.md#multiband-balance)               |
| Spatial     | Stereo Blend             | 스테레오 너비 제어 효과                                  | [상세](plugins/spatial.md#stereo-blend)                    |
| Others      | Oscillator               | 다중 파형 오디오 신호 생성기                              | [상세](plugins/others.md#oscillator)                       |
| Control     | Section                  | 통합 제어를 위한 다중 효과 그룹화                     | [상세](plugins/control.md)                         |

## 기술 정보

### 브라우저 호환성

Frieve EffeTune은 Google Chrome에서 테스트 및 검증되었습니다.  
이 애플리케이션은 다음을 지원하는 최신 브라우저가 필요합니다:
- Web Audio API
- Audio Worklet
- getUserMedia API
- Drag and Drop API

### 브라우저 지원 세부 정보

1. **Chrome/Chromium**
   - 완벽하게 지원되며 권장됩니다.
   - 최상의 성능을 위해 최신 버전으로 업데이트하세요.
2. **Firefox/Safari**
   - 제한된 지원
   - 일부 기능이 예상대로 작동하지 않을 수 있습니다.
   - 최상의 경험을 위해 Chrome 사용을 고려하세요.

### 권장 샘플 레이트

비선형 이펙트의 최적 성능을 위해 96kHz 이상의 샘플 레이트로 EffeTune을 사용하는 것이 권장됩니다.  
이 높은 샘플 레이트는 서츄레이션 및 컴프레션과 같은 비선형 이펙트를 통해 오디오를 처리할 때 이상적인 특성을 달성하는 데 도움이 됩니다.

## 개발 가이드

자신만의 오디오 플러그인을 만들고 싶으신가요? [Plugin Development Guide](../../plugin-development.md)를 확인해보세요.
데스크톱 앱을 만들고 싶으신가요? [Build Guide](../../build.md)를 확인해보세요.

## 링크

[Version History](../../version-history.md)

[Source Code](https://github.com/Frieve-A/effetune)

[YouTube](https://www.youtube.com/@frieveamusic)
