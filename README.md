# 생활 계산기

기본 계산기에 생활 속에서 자주 쓰는 계산 도구 10가지를 더한 앱입니다.
서버 없이 동작하며, 모든 데이터(계산 기록, D-Day 목록, 입력값, 설정)는 **기기 안(로컬 저장소)** 에만 저장됩니다.

- **윈도우 미리보기**: 설치 없이 바로 실행 (Microsoft Edge 앱 창)
- **안드로이드 APK**: 같은 코드를 Capacitor로 감싸 빌드 (AdMob 광고 연동 준비 완료)

---

## 1. 윈도우에서 실행하기

**권장: `LifeCalculator.exe` (설치 필요 없음, 파일 1개)**
- 더블클릭하면 휴대폰 크기(430×900)의 앱 창이 열립니다. 창을 닫으면 프로그램도 종료됩니다.
- 처음 실행 시 "Windows의 PC 보호" 창이 뜨면 **추가 정보 → 실행** 을 누르세요. (코드 서명이 없는 개인 제작 프로그램이라 표시됩니다)
- 화면은 윈도우에 기본 설치된 Microsoft Edge 엔진으로 그려지며, 데이터는 `%LOCALAPPDATA%\LifeCalculator` 에 저장됩니다.
- 환율·코스피/코스닥·금값 시세는 exe 내장 중계 기능으로 정상 조회됩니다.
- `www` 를 수정한 뒤 exe 를 다시 만들려면: Go 설치(https://go.dev/dl) 후 `desktop\build.bat` 실행 → `dist\LifeCalculator.exe`

**개발용 미리보기: `run-windows.bat`**
- `www` 폴더를 직접 열기 때문에 코드를 고친 뒤 F5 만 누르면 바로 반영됩니다.
- 단, 이 방식은 브라우저 보안정책 때문에 **코스피/코스닥 시세가 표시되지 않을 수 있습니다** (환율·금값은 정상).

키보드로도 계산할 수 있습니다: 숫자, `+ - * /`, `%`, `Enter`(=), `Backspace`(지우기), `Esc`(AC), `Ctrl+C`(결과 복사)

> 코드를 고친 뒤에는 열린 창에서 `F5` 로 새로고침하면 바로 반영됩니다.

---

## 2. 기능

| 메뉴 | 내용 |
|---|---|
| 메뉴(홈) | 앱을 열면 처음 보이는 화면. 아이콘을 **길게 누르면 편집 모드** → 끌어서 순서 변경, "기본 순서로" 초기화. 최근 사용 목록(최대 5개, 개별 ×, 전체 삭제) |
| 계산기 | 사칙연산, ±, %, 지우기, 수식·결과 미리보기, 계산 기록(최대 100개, 눌러서 재사용), 결과 복사 |
| 면적 | ㎡ · 평 · 헥타르 · 에이커 (+ ㎢, ft²) / **주택 평수 안내 팝업** (전용 39~135㎡별 공급면적·평형, 면적 용어) |
| 길이 | m · km · cm · 인치 · 피트 · 마일 · 해리 / **인치 크기 안내 팝업** (인치→대각선 cm, 화면 비율별 가로·세로, TV·모니터·노트북·스마트폰·폴더블·태블릿·선풍기 표) |
| 할인 | 정가+할인율(+중복 할인) → 최종가·할인액·총 할인율 / 정가+판매가 → 할인율 |
| 나이 | 생년월일(월·일 생략 가능) → 만 나이·세는 나이·연 나이, 띠, 다음 생일 / 나이 → 출생연도 (만·세는·연 나이 기준) |
| 칼로리 | 칼로리 입력 또는 음식 최대 3개 합산(＋로 직접 입력) → 걷기·달리기·근력운동 등 18가지 운동별 필요 시간·걸음 수 / 운동·시간 → 소모 칼로리. 기초대사량 반영(성별·나이·키·체중) 체크 시 개인 기초대사량 기준, 해제 시 체중만 반영한 일반 공식 |
| 날짜·D-Day | D-Day 목록 **추가·편집·삭제**, "며칠째"·"D-며칠"·매년 반복, 100일·1주년 등 기념일 표 / N일째·N일 후·N일 전, 두 날짜 사이 기간 |
| 음력 | 오늘의 음력·간지·띠 / 음력→양력(윤달, 향후 10년 양력 날짜) / 양력→음력 (1000~2050년, 한국천문연구원 기준) |
| 대출 | 원리금균등·원금균등·만기일시, 금액·금리·기간·거치기간 → 월 상환금, 총 이자, 총 상환액, 월별 상환 스케줄 |
| 예적금 | 적금/예금, 단리/월복리, 이자 소득세(15.4% 기본·9.5%·비과세·직접 입력) → 세후 이자, 만기 수령액 |
| 속도 | km/h · mph · 노트 · 마하 · m/s / 거리·시간·속도 중 2개를 입력하면 나머지 1개 자동 계산 + 페이스·예상 기록, 속도 참고표 |
| BMI | 대한비만학회 2022 기준 6단계 판정, 정상 체중 범위, 표준 체중 |
| 체지방 | 간편 추정(BMI·나이·성별) / 둘레 측정(미 해군 방식), ACE 기준 판정, 체지방량·제지방량 |
| 환율 | 60여 개 통화 상호 변환(한글 통화명 표시), 국가·통화 검색, 주요 통화 원화 환율 + 전일 대비 등락 (하루 1회 갱신) |
| 코스피/코스닥 | 현재 지수, 전일 대비, 1개월·3개월·1년 차트, 기간 최고·최저·수익률 (장중 1분 자동 갱신) |
| 금값 | 순금 1g·1돈·1냥·1온스·1kg 원화 시세, 전일 대비, 1개월 추이, 부가세 포함 보기, 중량·순도(24K/18K/14K) 가격 계산, 은 시세 |
| 설정 | 테마(자동/라이트/다크), 데이터 삭제·초기화, 버전, 오픈소스 라이선스 |

각 도구는 마지막 입력값을 기억해, 다시 열면 그대로 이어서 쓸 수 있습니다.

---

## 3. 폴더 구조

```
life-calculator/
├─ dist/LifeCalculator.exe  윈도우 실행 파일
├─ desktop/                 윈도우 실행 파일 소스(Go) · build.bat
├─ run-windows.bat          개발용 미리보기 실행
├─ www/                     앱 본체 (이 폴더가 그대로 APK에 들어갑니다)
│  ├─ index.html
│  ├─ css/app.css           디자인 (애플 스타일, 라이트/다크)
│  ├─ fonts/                Pretendard 폰트 (오프라인 포함)
│  └─ js/
│     ├─ config.js          ★ 앱 이름·버전·광고 ID 등 설정
│     ├─ store.js           로컬 저장소 (localStorage)
│     ├─ formulas.js        모든 계산 공식 (화면과 분리)
│     ├─ ads.js             광고 모듈 (웹: 자리표시자 / 앱: AdMob)
│     ├─ net.js             시세 API 연결 (환율·금·지수, 캐시·예비 API)
│     ├─ menu.js            메뉴(홈) · 순서 변경 · 최근 사용
│     ├─ ui.js, icons.js    공통 UI 컴포넌트, 아이콘
│     ├─ calculator.js      기본 계산기
│     ├─ settings.js, app.js
│     ├─ tools/*.js         도구 10종 (도구 1개 = 파일 1개)
│     └─ lib/               음력 변환 라이브러리
├─ tests/formulas.test.js   계산 공식 검증 (node tests/formulas.test.js)
├─ scripts/setup-android.js AdMob 앱 ID 등록 스크립트
├─ resources/android/      앱 아이콘
├─ .github/workflows/      GitHub 자동 APK 빌드
├─ capacitor.config.json    APK 빌드 설정 (앱 ID: com.lifecalc.app)
└─ package.json
```

**도구 추가 방법**: `www/js/tools/` 에 파일을 하나 만들고 `LC.registerTool({ id, title, short, icon, color, render(page) {...} })` 를 호출한 뒤 `index.html` 에 `<script>` 한 줄을 추가하면 도구 메뉴에 자동으로 나타납니다.

---

## 4. 시세 데이터 (무료 · 인증키 불필요 · 호출 제한 확인)

| 데이터 | 사용 API | 호출 제한 |
|---|---|---|
| 환율, 금·은 (1순위) | [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) — jsDelivr CDN | 제한 없음 (공식 문서에 "No Rate limits") · 하루 1회 갱신 |
| 환율, 금·은 (2순위) | 같은 데이터의 Cloudflare 미러 `currency-api.pages.dev` | 위와 동일 |
| 환율 (3순위) | [Frankfurter](https://frankfurter.dev) | 일·월 쿼터 없음 (남용 방지용 속도 제한만 있음) |
| 코스피·코스닥 | 네이버 증권 모바일 API (비공식) | 공개된 호출 제한 없음 |

- 이전 버전에서 쓰던 **open.er-api.com**(초과 시 20분 차단)과 **Yahoo Finance**(429 차단)는 호출 제한이 있어 제거했습니다.
- 서버 없이 각 기기가 직접 조회하므로, 호출량은 사용자 수만큼 나뉘어 발생합니다. 또한 시세를 기기에 저장해(환율 1시간, 지수 장중 1분·장 마감 후 15분) 불필요한 호출을 줄입니다.
- **주의:** 코스피·코스닥을 "공식적으로 무제한" 제공하는 무료 API는 없습니다. 공공데이터포털 「금융위원회_지수시세정보」는 공식 API지만 인증키가 필요하고 일일 호출 한도(개발 10,000건 / 운영 100,000건)가 있으며 하루 1회(전일 종가) 갱신입니다. 네이버 API는 비공식이라 예고 없이 바뀌거나 막힐 수 있으며, 광고 수익이 있는 앱으로 출시할 때는 이용약관상 문제가 될 수 있으니 출시 전 공식 데이터(한국거래소·증권사 API 등) 사용을 검토하세요. 바뀌면 `www/js/net.js` 만 고치면 됩니다.
- 앱(APK)에서는 `CapacitorHttp` 가, 윈도우 exe 에서는 내장 중계 서버가 브라우저 보안정책(CORS)을 해결합니다.

## 5. 광고

- 화면 하단(탭바 바로 위)에 **배너 광고 영역**이 잡혀 있습니다. 윈도우 미리보기에서는 빗금 친 자리표시자로 보입니다.
- 도구 화면을 **6번 열 때마다 전면 광고 1회** (앱에서만 실제 표시, `config.js` 의 `interstitialEvery` 로 조절, 0이면 끔).
- 광고를 잠시 끄려면 `config.js` 에서 `ads.enabled: false`.
- 지금 들어 있는 광고 ID는 모두 **Google 공식 테스트 ID** 입니다. 출시 전 반드시 교체하세요:
  1. AdMob 콘솔에서 앱 등록 → 앱 ID(`ca-app-pub-…~…`)와 배너·전면 광고 단위 ID(`ca-app-pub-…/…`) 발급
  2. `www/js/config.js` → `androidBannerId`, `androidInterstitialId` 교체, `isTesting: false`
  3. `node scripts/setup-android.js ca-app-pub-앱ID` 실행 (AndroidManifest 에 앱 ID 등록)
- 향후 "광고 제거" 인앱 결제를 붙일 때는 결제 성공 시 `LC.ads.removeAds()` 를 호출하면 됩니다.

---

## 6. APK 만들기 (안드로이드)

### 방법 A — GitHub 에서 자동 빌드 (PC에 아무것도 설치하지 않아도 됨)
1. 이 폴더를 GitHub 저장소(비공개 가능)에 올립니다.
2. 저장소의 **Actions** 탭에서 "Build Android APK" 가 자동 실행됩니다 (약 5~8분).
3. 완료된 실행 기록 → **Artifacts → life-calculator-apk** 를 내려받아 압축을 풀면 `app-debug.apk` 가 있습니다.
4. 휴대폰으로 옮겨 설치합니다. ("출처를 알 수 없는 앱 설치" 허용 필요)

### 방법 B — 내 PC에서 빌드

### 준비물 (한 번만)
- [Node.js](https://nodejs.org) 22 이상
- [Android Studio](https://developer.android.com/studio) (설치 시 Android SDK 포함)

### 빌드
명령 프롬프트(cmd)에서 이 폴더로 이동한 뒤:

```bat
npm install
npm run android:init      :: android 프로젝트 생성 + AdMob 앱 ID 등록 (처음 한 번)
npm run android:open      :: Android Studio 열기
```

Android Studio에서 **Build → Build App Bundle(s) / APK(s) → Build APK(s)** 를 누르면
`android/app/build/outputs/apk/debug/app-debug.apk` 가 만들어집니다. 휴대폰에 복사해 설치하면 됩니다.

### 코드를 고친 뒤
`www` 안의 파일을 수정했다면 아래 명령으로 APK 프로젝트에 반영하고 다시 빌드합니다.

```bat
npm run android:sync
```

### 플레이 스토어 출시 시
- Android Studio의 **Build → Generate Signed App Bundle** 로 `.aab` 파일을 만들어 업로드합니다.
- 앱 아이콘은 Android Studio에서 `app/res` 우클릭 → **New → Image Asset** 으로 `www/icons/icon.svg` 를 지정해 만들 수 있습니다.
- 광고를 넣었다면 Play Console의 "광고 포함" 항목과 개인정보처리방침 URL을 등록해야 합니다.

---

## 7. 참고 사항

- 계산 결과는 참고용입니다. 은행별 이자 계산 방식(일할 계산, 원 단위 절사 등), 단지별 공급면적은 실제와 조금 다를 수 있습니다.
- 음력 데이터는 1000년 ~ 2050년까지 지원합니다.
- 데이터는 앱(또는 브라우저)의 로컬 저장소에 저장되므로, 앱을 삭제하거나 브라우저 데이터를 지우면 함께 삭제됩니다. 윈도우 미리보기(`run-windows.bat`)는 `%LOCALAPPDATA%\LifeCalculatorPreview` 에 별도 저장됩니다.
- 사용한 오픈소스: Pretendard (SIL OFL 1.1), korean-lunar-calendar (MIT)
