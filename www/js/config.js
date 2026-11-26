/* 생활 계산기 — 앱 설정
 * 광고, 버전 등 배포 시 바꿔야 하는 값은 모두 이 파일에 모았습니다.
 */
window.LC = window.LC || {};

LC.config = {
  appName: '생활 계산기',
  version: '1.2.0',

  ads: {
    // 광고 전체 사용 여부 (false 로 바꾸면 광고 영역이 완전히 사라집니다)
    // ※ 현재는 '광고 없는 버전'입니다. 광고를 다시 넣는 방법은 ADS.md 참고
    enabled: false,

    // 웹(윈도우 미리보기)에서 광고 자리표시자를 보여줄지 여부
    showPlaceholderOnWeb: true,

    // 배너 높이(px). 실제 AdMob 적응형 배너는 로드 후 높이가 자동 반영됩니다.
    bannerHeight: 50,

    // 도구 화면을 N번 열 때마다 전면 광고 1회 (0 이면 사용 안 함)
    interstitialEvery: 6,

    // Google AdMob 설정 — 아래는 Google 공식 "테스트" ID 입니다.
    // 출시 전 AdMob 콘솔에서 발급받은 실제 ID로 교체하고 isTesting 을 false 로 바꾸세요.
    admob: {
      isTesting: true,
      androidBannerId: 'ca-app-pub-3940256099942544/6300978111',
      androidInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
      iosBannerId: 'ca-app-pub-3940256099942544/2934735716',
      iosInterstitialId: 'ca-app-pub-3940256099942544/4411468910'
    }
  },

  // 계산 기록 최대 보관 개수
  historyLimit: 100
};

// Capacitor 네이티브 플러그인 가져오기 (웹 미리보기에서는 null)
LC.nativePlugin = function (name) {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
  if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
  try { return C.registerPlugin ? C.registerPlugin(name) : null; } catch (e) { return null; }
};
