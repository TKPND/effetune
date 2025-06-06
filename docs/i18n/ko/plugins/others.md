# Other Audio Tools

주요 이펙트 카테고리를 보완하는 특수 오디오 도구와 제너레이터 모음입니다. 이러한 플러그인들은 사운드 생성과 오디오 실험을 위한 독특한 기능을 제공합니다.

## Plugin List

- [Oscillator](#oscillator) - 정밀한 주파수 제어가 가능한 다중 파형 오디오 신호 제너레이터

## Oscillator

정밀한 주파수 제어로 다양한 파형을 생성하는 다재다능한 오디오 신호 제너레이터입니다. 오디오 시스템 테스트, 레퍼런스 톤 생성 또는 사운드 합성 실험에 완벽합니다.

### Features
- 다양한 파형 타입:
  - 레퍼런스 톤을 위한 순수 사인파
  - 풍부한 하모닉 콘텐츠를 위한 사각파
  - 더 부드러운 하모닉을 위한 삼각파
  - 밝은 음색을 위한 톱니파
  - 시스템 테스트를 위한 화이트 노이즈
  - 음향 측정을 위한 핑크 노이즈
- 버스트 테스트와 간헐적 신호를 위한 펄스 동작 모드

### Parameters
- **Frequency (Hz)** - 생성된 톤의 피치 제어(20 Hz에서 96 kHz)
  - 저주파수: 깊은 베이스 톤
  - 중간 주파수: 음악적 범위
  - 고주파수: 시스템 테스트
- **Volume (dB)** - 출력 레벨 조정(-96 dB에서 0 dB)
  - 레퍼런스 톤에는 낮은 값 사용
  - 시스템 테스트에는 높은 값
- **Panning (L/R)** - 스테레오 배치 제어
  - 중앙: 양쪽 채널에서 동일
  - 좌/우: 채널 밸런스 테스트
- **Waveform Type** - 신호 타입 선택
  - Sine: 깨끗한 레퍼런스 톤
  - Square: 홀수 하모닉이 풍부
  - Triangle: 더 부드러운 하모닉 콘텐츠
  - Sawtooth: 완전한 하모닉 시리즈
  - White Noise: Hz당 동일한 에너지
  - Pink Noise: 옥타브당 동일한 에너지
- **Mode** - 신호 생성 패턴 제어
  - Continuous: 표준 연속 신호 생성
  - Pulsed: 제어 가능한 타이밍의 간헐적 신호
- **Interval (ms)** - 펄스 모드에서 펄스 간 시간 간격(100-2000 ms, 단계 10 ms)
  - 짧은 간격: 빠른 펄스 시퀀스
  - 긴 간격: 넓은 간격의 펄스
  - 모드가 Pulsed로 설정된 경우에만 활성
- **Width (ms)** - 펄스 모드에서 펄스 램프 시간 지속시간(2-100 ms, 단계 1 ms)
  - 각 펄스의 페이드 인/페이드 아웃 시간 제어
  - 짧은 폭: 날카로운 펄스 에지
  - 긴 폭: 더 부드러운 펄스 전환
  - 모드가 Pulsed로 설정된 경우에만 활성

### Example Uses

1. 스피커 테스트
   - 주파수 재생 범위 확인
     * 저주파에서 고주파까지 사인파 스윕 사용
     * 소리가 들리지 않거나 왜곡되는 지점 확인
   - 왜곡 특성 테스트
     * 다양한 주파수에서 순수 사인파 사용
     * 원치 않는 하모닉이나 왜곡 청취
     * 다양한 볼륨 레벨에서의 동작 비교
   - 버스트 신호 테스트
     * 짧은 간격과 폭으로 펄스 모드 사용
     * 간헐적 신호에 대한 시스템 응답 분석

2. 공간 음향 분석
   - 정재파 식별
     * 의심되는 룸 모드 주파수에서 사인파 사용
     * 노드와 안티노드를 찾기 위해 공간 이동
   - 공진과 잔향 확인
     * 문제가 되는 공진을 찾기 위해 다양한 주파수 테스트
     * 전체적인 공간 응답을 평가하기 위해 핑크 노이즈 사용
   - 다양한 위치에서 주파수 응답 매핑
     * 청취 영역 전체의 일관성을 확인하기 위해 사인 스윕 사용
   - 에코와 반사 분석
     * 펄스 모드를 사용하여 직접음과 반사음을 명확히 분리

3. 헤드폰/이어폰 테스트
   - 채널 간 크로스토크 평가
     * 한 채널에만 신호 전송
     * 다른 채널로의 원치 않는 누출 확인
   - 주파수 응답 테스트
     * 주파수 밸런스를 확인하기 위해 사인 스윕 사용
     * 좌우 채널 응답 비교
   - 과도 응답 테스트
     * 펄스 모드를 사용하여 버스트 신호에서의 시스템 동작 평가

4. 청력 테스트
   - 개인 청취 범위 확인
     * 상한과 하한을 찾기 위해 주파수 스윕
     * 주파수 간격이나 약점 확인
   - 최소 가청 볼륨 결정
     * 다양한 볼륨에서 여러 주파수 테스트
     * 개인 등청감 곡선 매핑
   - 시간 처리 평가
     * 다양한 간격의 펄스 모드를 사용하여 시간 분해능 테스트

5. 시스템 캘리브레이션
   - 컴포넌트 간 레벨 매칭
     * 레퍼런스 주파수에서 사인파 사용
     * 신호 체인 전체에서 일관된 레벨 확보
   - 채널 밸런스 검증
     * 다양한 주파수에서 좌/우 밸런스 테스트
     * 적절한 스테레오 이미징 확보
   - 버스트 신호 응답 테스트
     * 펄스 모드를 사용하여 간헐적 신호에 대한 시스템 응답 테스트
     * 버스트 신호로 게이트/컴프레서 동작 평가

Oscillator는 정밀 도구임을 기억하세요 - 장비 손상이나 청취 피로를 방지하기 위해 낮은 볼륨에서 시작하여 점진적으로 증가하세요.