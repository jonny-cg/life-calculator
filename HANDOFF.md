# 생활 계산기 — 작업 인수인계 (다른 대화에서 이어서 작업할 때)

새 Claude 대화를 시작할 때 이 압축 파일(소스)을 첨부하고 "HANDOFF.md 를 읽고 이어서 작업해줘"라고 요청하세요.

## 개요
- 서버 없는 생활 계산기 앱. 데이터는 기기 내부 저장소(localStorage)에만 저장.
- 디자인: Apple(iOS) 스타일, 라이트/다크 테마, Pretendard 폰트 내장.
- 메뉴(홈) · 계산기 · 설정 3개 탭. 앱을 열면 메뉴 화면부터 표시.

## 사용 언어 · 기술
| 구분 | 언어/기술 |
|---|---|
| 앱 화면·기능 (`www/`) | HTML, CSS, JavaScript (프레임워크 없이 순수 JS) |
| 안드로이드 APK | Capacitor 8 (웹 앱을 안드로이드 앱으로 감쌈), 빌드는 GitHub Actions |
| 윈도우 실행 파일 (`desktop/`) | Go (내장 웹서버 + Edge 앱 모드 창 + 시세 API 중계) |
| 빌드 보조 스크립트 | Node.js (`scripts/setup-android.js`), GitHub Actions YAML |
| 테스트 | Node.js (`tests/formulas.test.js`, 계산 공식 76개) |

## 구조
- `www/js/formulas.js` 계산 공식 (화면과 분리, Node 테스트 가능)
- `www/js/tools/*.js` 메뉴 1개 = 파일 1개. `LC.registerTool({ id, title, short, ... render(page) })`
- `www/icons/menu/<id>.png` 메뉴 아이콘 이미지 (id 와 파일명이 같아야 함), `today.png` 상단 날짜 아이콘
- `www/js/menu.js` 메뉴 화면 · 기본 순서(`DEFAULT_ORDER`) · 길게 눌러 순서 변경 · 최근 사용(최대 5개)
- `www/js/net.js` 시세 API (환율·금: fawazahmed0 exchange-api → pages.dev 미러 → Frankfurter / 지수: 네이버 증권) · 날씨 API (Open-Meteo 예보 + ERA5 과거 자료, 기기당 하루 10,000회·비상업적 무료)
- `www/js/tools/pastweather.js` 이전 날씨, `www/js/data/kr-cities.js` 한국 시 단위 좌표
- `scripts/make-icons.py` 앱 아이콘 생성 (resources/app-icon-source.png → 웹·안드로이드 아이콘)
- `www/js/ads.js` 광고 모듈 (현재 꺼짐 — ADS.md)
- `resources/` 앱 아이콘 원본 및 안드로이드 아이콘(적응형 포함)

## 메뉴 (기본 순서)
면적, 길이, 속도, D-Day / 할인, 환율, 나이, 음력 / 예적금, 대출, 체지방, BMI / 칼로리, 이전 날씨, 금값, 코스피·코스닥

## 빌드
- 윈도우: `desktop/build.bat` (Go 필요) → `dist/LifeCalculator.exe`
- APK: GitHub 저장소에 push → Actions "Build Android APK" → Releases `test-apk` 에 `LifeCalculator-test.apk`
- 로컬 APK: `npm install` → `npm run android:init` → `npm run android:open` (Android Studio)
- 테스트: `node tests/formulas.test.js`

## 결정 사항 · 주의
- 메뉴 추가 시: tools 파일 + index.html `<script>` + `icons/menu/<id>.png` + `DEFAULT_ORDER`
- 사용자 저장값 키를 바꾸면(`ui.toolState('이름')`) 기본값이 새로 적용됨 (예: exchange2, gold2, speed3)
- 네이버 지수 API는 비공식 → 상용 출시 전 공식 데이터 검토 필요
- 계산 결과가 평균/추정치인 화면에는 `est-note` 안내 문구를 둔다

- Open-Meteo 무료 API는 비상업적 이용 조건 → 광고 넣어 출시하면 유료 구독(상업 라이선스) 또는 기상청 API 검토
- 메뉴 아이콘은 원본 해상도(270px) 그대로 사용, CSS 필터 금지(흐려짐)
