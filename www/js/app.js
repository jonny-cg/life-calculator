/* 앱 진입점 · 화면 전환(라우터) */
(function () {
  const ui = LC.ui;
  const view = document.getElementById('view');
  const HOME = 'menu';            // 앱을 열면 처음 보이는 화면
  let navigatedInApp = false;

  // 탭 아이콘
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = LC.icon(e.dataset.icon, { sw: 1.9 }); });

  /* ---------- 도구 화면 ---------- */
  function mountTool(id) {
    const def = LC.tools.find(x => x.id === id);
    if (!def) { location.replace('#' + HOME); return; }
    const page = ui.toolPage(def, { back });
    def.render(page);
    view.appendChild(page);
    view.onscroll = () => page.nav.classList.toggle('scrolled', view.scrollTop > 4);
    LC.menu.pushRecent(id);
    LC.ads.onToolOpen();
  }

  /* ---------- 라우팅 ---------- */
  function go(route) { navigatedInApp = true; location.hash = '#' + route; }
  function back() {
    if (navigatedInApp && history.length > 1) history.back();
    else location.hash = '#' + HOME;
  }

  function render() {
    let hash = (location.hash || '#' + HOME).slice(1);
    if (hash === 'tools') hash = HOME; // 이전 버전 주소 호환
    const [name, arg] = hash.split('/');
    ui.closeTopSheet();
    if (LC.currentCleanup) { try { LC.currentCleanup(); } catch (e) {} LC.currentCleanup = null; }
    view.innerHTML = '';
    view.onscroll = null;
    view.scrollTop = 0;
    const tab = name === 'tool' ? HOME : name;
    // 상단 상태표시줄 영역 색을 화면에 맞춤 (도구 화면은 상단바 색)
    document.documentElement.setAttribute('data-page', name === 'tool' ? 'tool' : 'main');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (name === 'tool') mountTool(arg);
    else if (name === 'calc') LC.calculator.mount(view);
    else if (name === 'settings') LC.settings.mount(view);
    else LC.menu.mount(view, go);
  }
  window.addEventListener('hashchange', render);
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { navigatedInApp = false; }));

  /* ---------- 뒤로가기 (안드로이드 하드웨어 버튼) ----------
   * true 를 반환하면 앱 안에서 처리, false 면 앱 종료 */
  LC.handleBack = function () {
    if (ui.closeTopSheet()) return true;
    if (LC.menu.handleBack()) return true;
    const h = (location.hash || '#' + HOME).slice(1);
    if (h.startsWith('tool/')) { back(); return true; }
    if (h !== HOME && h !== 'tools') { location.hash = '#' + HOME; return true; }
    return false;
  };
  const AppPlugin = LC.nativePlugin('App');
  if (AppPlugin) {
    AppPlugin.addListener('backButton', () => { if (!LC.handleBack()) AppPlugin.exitApp(); });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !location.hash.startsWith('#calc') && !document.querySelector('.sheet-backdrop')) LC.handleBack();
  });

  render();
  LC.ads.init();
})();
