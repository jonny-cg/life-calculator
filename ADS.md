# 광고(AdMob) 다시 적용하는 방법

현재 버전은 **광고 없는 버전**입니다. 광고 코드는 지우지 않고 꺼 둔 상태라, 아래 3단계로 다시 켤 수 있습니다.
광고가 적용돼 있던 마지막 버전은 Git 태그 **`v1.0-ads`** 로 보관되어 있습니다.

## 1. 광고 켜기
`www/js/config.js`
```js
ads: {
  enabled: true,          // false → true
  ...
  admob: {
    isTesting: true,      // 출시할 때 false
    androidBannerId: '실제 배너 광고 단위 ID',
    androidInterstitialId: '실제 전면 광고 단위 ID',
```

## 2. 광고 플러그인 설치 + AdMob 앱 ID 등록
```bat
npm run ads:enable
```
- `@capacitor-community/admob` 설치 후 `scripts/setup-android.js` 가 AndroidManifest 에 AdMob 앱 ID를 등록합니다.
- 실제 앱 ID 사용: `node scripts/setup-android.js ca-app-pub-XXXXXXXX~YYYYYYYY`
- GitHub 자동 빌드에서도 광고를 넣으려면 `package.json` 의 dependencies 에
  `"@capacitor-community/admob": "^8.4.2"` 가 들어 있어야 합니다 (`npm run ads:enable` 이 자동으로 추가).

## 3. 동작 방식 (이미 구현되어 있음 — `www/js/ads.js`)
- 하단 배너: 탭바 바로 위 (플러그인이 시스템 내비게이션 영역 높이를 스스로 더하므로 margin 은 탭바 높이 56만 전달)
- 배너가 실제로 보일 때만 광고 공간 확보 → 로드 전·실패·숨김 시 빈 공간 없음
- 팝업(시트)이 열리거나 키보드가 올라오면 배너 숨김, 닫히면 다시 표시
- 도구 화면 6번 열 때마다 전면 광고 1회 (`interstitialEvery`)
- 광고 제거 인앱결제 연동 시 `LC.ads.removeAds()` 호출
