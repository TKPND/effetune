# Analyzer Plugins

음악을 흥미로운 방식으로 시각화할 수 있는 플러그인 모음입니다. 이러한 시각적 도구들은 소리의 다양한 측면을 보여줌으로써 청취 경험을 더욱 몰입감 있고 상호작용적으로 만들어줍니다.

## Plugin List

- [Level Meter](#level-meter) - 음악의 재생 볼륨을 표시
- [Oscilloscope](#oscilloscope) - 실시간 파형 시각화
- [Spectrogram](#spectrogram) - 음악에서 아름다운 시각적 패턴 생성
- [Spectrum Analyzer](#spectrum-analyzer) - 음악의 주파수 분포를 표시
- [Stereo Meter](#stereo-meter) - 스테레오 밸런스와 사운드 움직임을 시각화

## Level Meter

음악이 실시간으로 얼마나 크게 재생되고 있는지 시각적으로 보여주는 디스플레이입니다. 편안한 청취 레벨을 유지하고 과도한 볼륨으로 인한 왜곡을 방지하는 데 도움이 됩니다.

### Visualization Guide
- 미터가 음악의 볼륨에 따라 상하로 움직임
- 미터가 높을수록 더 큰 소리를 의미
- 빨간색 마커는 최근 최고 레벨을 표시
- 상단의 빨간색 경고는 볼륨이 너무 클 수 있음을 의미
- 편안한 청취를 위해 중간 범위에서 레벨을 유지하도록 노력

## Oscilloscope

실시간 오디오 파형을 표시하는 전문가급 오실로스코프로, 실제 음파의 모양을 시각화하는 데 도움을 줍니다. 안정적인 파형 표시를 위한 트리거 기능을 갖추고 있어 주기적 신호와 과도 신호를 분석하기가 더 쉽습니다.

### Visualization Guide
- 가로축은 시간 표시(밀리초)
- 세로축은 진폭 표시(-1에서 1)
- 녹색 선이 실제 파형을 추적
- 그리드 선은 시간과 진폭 값 측정에 도움
- 트리거 포인트는 파형 캡처가 시작되는 지점을 표시

### Parameters
- **Display Time** - 표시할 시간 범위(1에서 100ms)
  - 낮은 값: 짧은 이벤트의 더 자세한 관찰
  - 높은 값: 더 긴 패턴 관찰
- **Trigger Mode**
  - Auto: 트리거 없이도 지속적 업데이트
  - Normal: 다음 트리거까지 디스플레이 고정
- **Trigger Source** - 트리거할 채널 선택
  - 좌/우 채널 선택
- **Trigger Level** - 캡처를 시작하는 진폭 레벨
  - 범위: -1에서 1(정규화된 진폭)
- **Trigger Edge**
  - Rising: 신호가 상승할 때 트리거
  - Falling: 신호가 하강할 때 트리거
- **Holdoff** - 트리거 간 최소 시간(0.1에서 10ms)
- **Display Level** - 수직 스케일(dB 단위)(-96에서 0dB)
- **Vertical Offset** - 파형을 위/아래로 이동(-1에서 1)

### Note on Waveform Display
표시되는 파형은 샘플 포인트 간 선형 보간을 사용하여 부드러운 시각화를 제공합니다. 이는 실제 오디오 신호가 샘플 간에 표시된 것과 다를 수 있음을 의미합니다. 고주파 콘텐츠를 분석할 때 특히 정확한 표현을 위해서는 더 높은 샘플레이트(96kHz 이상)를 고려하세요.

## Spectrogram

시간에 따른 음악의 변화를 보여주는 아름답고 다채로운 패턴을 만듭니다. 다양한 소리와 주파수를 서로 다른 색상으로 표현하는 음악의 그림과 같습니다.

### Visualization Guide
- 색상은 다양한 주파수의 강도를 보여줌:
  - 어두운 색상: 조용한 소리
  - 밝은 색상: 큰 소리
  - 음악에 따라 변화하는 패턴 관찰
- 세로 위치는 주파수를 나타냄:
  - 하단: 베이스 사운드
  - 중간: 주요 악기
  - 상단: 고주파

### What You Can See
- 멜로디: 흐르는 색상 선
- 비트: 수직 줄무늬
- 베이스: 하단의 밝은 색상
- 하모니: 여러 개의 평행선
- 각기 다른 악기가 만드는 고유한 패턴

### Parameters
- **DB Range** - 색상의 선명도(-144dB에서 -48dB)
  - 낮은 숫자: 더 미묘한 디테일 관찰
  - 높은 숫자: 주요 소리에 집중
- **Points** - 패턴의 상세도(256에서 16384)
  - 높은 숫자: 더 정밀한 패턴
  - 낮은 숫자: 더 부드러운 시각화
- **Channel** - 스테레오 필드의 어느 부분을 표시할지 선택
  - All: 모든 것을 결합
  - Left/Right: 개별 측면

## Spectrum Analyzer

깊은 베이스부터 높은 트레블까지 음악의 주파수를 실시간으로 시각화합니다. 음악의 완전한 사운드를 구성하는 개별 요소들을 보는 것과 같습니다.

### Visualization Guide
- 왼쪽은 저주파수 표시(드럼, 베이스 기타)
- 중간은 주요 주파수 표시(보컬, 기타, 피아노)
- 오른쪽은 고주파수 표시(심벌즈, 반짝임, 공기감)
- 높은 피크는 해당 주파수의 강한 존재감을 의미
- 다양한 악기가 만드는 서로 다른 패턴 관찰

### What You Can See
- 베이스 드롭: 왼쪽의 큰 움직임
- 보컬 멜로디: 중간 영역의 활동
- 선명한 고음: 오른쪽의 반짝임
- 전체 믹스: 모든 주파수가 함께 작동하는 방식

### Parameters
- **DB Range** - 디스플레이의 감도(-144dB에서 -48dB)
  - 낮은 숫자: 더 미묘한 디테일 관찰
  - 높은 숫자: 주요 소리에 집중
- **Points** - 디스플레이의 상세도(256에서 16384)
  - 높은 숫자: 더 정밀한 디테일
  - 낮은 숫자: 더 부드러운 움직임
- **Channel** - 스테레오 필드의 어느 부분을 표시할지 선택
  - All: 모든 것을 결합
  - Left/Right: 개별 측면

### Fun Ways to Use These Tools

1. 음악 탐험하기
   - 다양한 장르가 만드는 서로 다른 패턴 관찰
   - 어쿠스틱과 일렉트로닉 음악의 차이점 확인
   - 악기들이 서로 다른 주파수 범위를 차지하는 방식 관찰

2. 사운드에 대해 배우기
   - 일렉트로닉 음악의 베이스 관찰
   - 보컬 멜로디가 디스플레이를 가로지르는 모습 관찰
   - 드럼이 만드는 날카로운 패턴 관찰

3. 경험 향상시키기
   - Level Meter를 사용하여 편안한 청취 볼륨 찾기
   - Spectrum Analyzer가 음악과 함께 춤추는 모습 감상
   - Spectrogram으로 시각적 라이트쇼 만들기

이러한 도구들은 청취 경험에 시각적 차원을 더함으로써 음악을 더욱 즐겁게 만들어주기 위한 것입니다. 좋아하는 음악을 새로운 방식으로 탐험하고 발견하는 즐거움을 누려보세요!

## Stereo Meter

스테레오 사운드가 만들어내는 공간감을 시각화하는 매력적인 도구입니다. 스피커나 헤드폰 사이에서 움직이는 소리를 관찰할 수 있어, 청취 경험에 흥미로운 시각적 차원을 더해줍니다.

### Visualization Guide
- **다이아몬드 디스플레이** - 음악이 생생하게 표현되는 메인 창:
  - 중앙: 소리가 완벽하게 균형잡힌 상태
  - 상하: 양쪽 스피커가 고르게 소리를 내는 상태
  - 좌우: 한쪽 스피커에서 더 많은 소리가 나는 상태
  - 녹색 점이 현재 음악에 맞춰 춤추듯 움직임
  - 흰색 선이 음악의 피크를 추적
- **움직임 바** (왼쪽)
  - 스피커들이 어떻게 협력하는지 표시
  - 상단(+1.0): 양쪽 스피커가 동일한 소리 재생
  - 중앙(0.0): 스피커가 좋은 스테레오 효과 생성
  - 하단(-1.0): 스피커가 특수 효과 생성
- **밸런스 바** (하단)
  - 한쪽 스피커가 다른 쪽보다 더 큰 소리를 내는지 표시
  - 중앙: 양쪽 스피커가 동일한 볼륨
  - 좌/우: 한쪽 스피커의 소리가 더 강함
  - 숫자는 데시벨(dB) 단위로 차이를 표시

### What You Can See
- **중앙 사운드**: 중앙에서의 강한 수직 움직임
- **공간감 있는 사운드**: 디스플레이 전체에 퍼진 활동
- **특수 효과**: 모서리 부분의 흥미로운 패턴
- **스피커 밸런스**: 하단 바가 가리키는 방향
- **사운드 움직임**: 왼쪽 바의 높이 변화

### Parameters
- **Window Time** (10-1000 ms)
  - 낮은 값: 빠른 음악 변화 확인
  - 높은 값: 전체적인 사운드 패턴 확인
  - 기본값: 100 ms가 대부분의 음악에 적합

### 음악 즐기기
1. **다양한 스타일 관찰**
   - 클래식 음악은 부드럽고 균형 잡힌 패턴을 보여줌
   - 일렉트로닉 음악은 대담하게 퍼지는 디자인을 만듦
   - 라이브 녹음은 자연스러운 공간 움직임을 보여줌

2. **사운드 특성 발견**
   - 앨범마다 다른 스테레오 효과 사용법 확인
   - 곡마다 다른 소리의 넓이감 관찰
   - 악기가 스피커 사이를 이동하는 모습 관찰

3. **경험 향상**
   - 다른 헤드폰으로 스테레오 표현의 차이 비교
   - 좋아하는 곡의 새로운 버전과 옛 버전 비교
   - 다른 청취 위치에서의 디스플레이 변화 관찰