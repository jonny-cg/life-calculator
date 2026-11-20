/* 광고 모듈
 * - 웹(윈도우 미리보기): 화면 하단(탭바 위)에 배너 자리표시자를 표시
 * - 앱(Capacitor APK): @capacitor-community/admob 플러그인으로 실제 AdMob 배너/전면 광고 표시
 * 화면 코드는 LC.ads.onToolOpen() 만 호출하면 되고, 광고 공급사가 바뀌어도 이 파일만 수정하면 됩니다.
 */
(function () {
  const cfg = LC.config.ads;
  let toolOpenCount = LC.store.get('ads.toolOpenCount', 0);
  let interstitialReady = false;

  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  function plugin() { return LC.nativePlugin('AdMob'); }
  function platform() {
    return window.Capacitor && window.Capacitor.getPlatform ? window.Capacitor.getPlatform() : 'web';
  }
  function setHeight(px) {
    document.documentElement.style.setProperty('--ad-h', px + 'px');
  }
  function tabbarHeight() {
    const t = document.getElementById('tabbar');
    return t ? Math.round(t.getBoundingClientRect().height) : 56;
  }

  async function init() {
    const slot = document.getElementById('ad-slot');
    if (!cfg.enabled || LC.store.get('ads.removed', false)) { setHeight(0); slot.innerHTML = ''; return; }

    const AdMob = plugin();
    if (isNative() && AdMob) {
      try {
        await AdMob.initialize({ initializeForTesting: cfg.admob.isTesting });
        // 실제 배너 높이가 정해지면 웹뷰 레이아웃의 광고 공간도 같이 맞춤
        AdMob.addListener('bannerAdSizeChanged', info => { if (info && info.height) setHeight(info.height); });
        setHeight(cfg.bannerHeight);
        await AdMob.showBanner({
          adId: platform() === 'ios' ? cfg.admob.iosBannerId : cfg.admob.androidBannerId,
          adSize: 'ADAPTIVE_BANNER',
          position: 'BOTTOM_CENTER',
          margin: tabbarHeight(),   // 탭바 바로 위에 배치
          isTesting: cfg.admob.isTesting
        });
        prepareInterstitial();
      } catch (e) {
        console.warn('[ads] AdMob 초기화 실패', e);
        setHeight(0);
      }
      return;
    }

    // 웹 미리보기
    if (cfg.showPlaceholderOnWeb) {
      setHeight(cfg.bannerHeight);
      slot.innerHTML = '<div class="ad-placeholder"><b>AD</b> 광고 배너 영역 (320×50)</div>';
    } else setHeight(0);
  }

  async function prepareInterstitial() {
    const AdMob = plugin();
    if (!AdMob || !cfg.interstitialEvery) return;
    try {
      await AdMob.prepareInterstitial({
        adId: platform() === 'ios' ? cfg.admob.iosInterstitialId : cfg.admob.androidInterstitialId,
        isTesting: cfg.admob.isTesting
      });
      interstitialReady = true;
    } catch (e) { interstitialReady = false; }
  }

  // 도구 화면을 열 때마다 호출 → N회마다 전면 광고
  async function onToolOpen() {
    if (!cfg.enabled || !cfg.interstitialEvery || LC.store.get('ads.removed', false)) return;
    toolOpenCount++;
    LC.store.set('ads.toolOpenCount', toolOpenCount);
    if (toolOpenCount % cfg.interstitialEvery !== 0) return;
    const AdMob = plugin();
    if (isNative() && AdMob && interstitialReady) {
      try { await AdMob.showInterstitial(); } catch (e) {}
      interstitialReady = false;
      prepareInterstitial();
    } else if (!isNative()) {
      console.info('[ads] (미리보기) 이 시점에 전면 광고가 표시됩니다. 누적 도구 실행:', toolOpenCount);
    }
  }

  // 향후 '광고 제거' 인앱 결제 연동 시 사용
  async function removeAds() {
    LC.store.set('ads.removed', true);
    const AdMob = plugin();
    if (isNative() && AdMob) { try { await AdMob.removeBanner(); } catch (e) {} }
    setHeight(0);
    document.getElementById('ad-slot').innerHTML = '';
  }

  LC.ads = { init, onToolOpen, removeAds, isNative };
})();
