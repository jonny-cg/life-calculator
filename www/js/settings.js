/* 설정 화면 + 테마 */
(function () {
  const ui = LC.ui;

  const theme = {
    get() { return LC.store.get('theme', 'system'); },
    set(v) { LC.store.set('theme', v); theme.apply(); },
    apply() {
      const v = theme.get();
      const dark = v === 'dark' || (v === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#000000' : '#F2F2F7'));
      // 네이티브 앱 상태바 색 (Capacitor StatusBar 플러그인이 있을 때만)
      const SB = LC.nativePlugin('StatusBar');
      if (SB) { try { SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' }); SB.setBackgroundColor({ color: dark ? '#000000' : '#F2F2F7' }); } catch (e) {} }
    }
  };
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => theme.apply());
  theme.apply();
  LC.theme = theme;

  function iconRow(icon, color, label, right, onClick, danger) {
    const r = ui.el('<div class="row ' + (onClick ? 'tappable' : '') + '"><span class="settings-icon" style="background:' + color + '">' + LC.icon(icon, { sw: 2.2 }) + '</span>' +
      '<span class="row-label" style="flex:1' + (danger ? ';color:var(--red)' : '') + '">' + label + '</span>' + (right || '') + '</div>');
    if (onClick) r.onclick = onClick;
    return r;
  }
  const chev = '<span class="chev">' + LC.icon('chevron', { sw: 2.6 }) + '</span>';

  function licenses() {
    ui.sheet({
      title: '오픈소스 라이선스', content:
        '<div class="group">' +
        '<div class="row" style="display:block;padding:14px 16px"><b>Pretendard</b><div class="li-sub">SIL Open Font License 1.1 · © Kil Hyung-jin</div></div>' +
        '<div class="row" style="display:block;padding:14px 16px"><b>시세 데이터</b><div class="li-sub">환율·금 시세: fawazahmed0/exchange-api (CC0, 호출 제한 없음, 일 1회 갱신), Frankfurter · 지수: 네이버 증권 (비공식, 지연 시세)</div></div>' +
        '<div class="row" style="display:block;padding:14px 16px"><b>korean-lunar-calendar</b><div class="li-sub">MIT License · © usingsky — 한국천문연구원(KASI) 기준 음양력 데이터</div></div>' +
        '</div>'
    });
  }

  function mount(view) {
    const page = ui.el('<div class="page"><h1 class="large-title">설정</h1></div>');

    page.appendChild(ui.el('<div class="section-title" style="margin-top:4px">화면</div>'));
    const themeRow = ui.el('<div class="row"><span class="settings-icon" style="background:#5856D6">' + LC.icon('sun', { sw: 2.2 }) + '</span><span class="row-label">테마</span></div>');
    const seg = ui.segmented([{ value: 'system', label: '자동' }, { value: 'light', label: '라이트' }, { value: 'dark', label: '다크' }], theme.get(), v => theme.set(v));
    seg.style.maxWidth = '210px';
    themeRow.appendChild(seg);
    page.appendChild(ui.group([themeRow]));

    page.appendChild(ui.el('<div class="section-title">데이터 (이 기기에만 저장됩니다)</div>'));
    page.appendChild(ui.group([
      iconRow('tabTools', '#007AFF', '메뉴 순서 초기화', chev, async () => {
        if (await ui.confirm('메뉴 순서를 처음 상태로 되돌릴까요?', '초기화')) { LC.store.remove('toolOrder'); ui.toast('메뉴 순서를 초기화했어요'); }
      }),
      iconRow('history', '#8E8E93', '계산 기록 삭제', chev, async () => {
        if (await ui.confirm('계산기 기록을 모두 삭제할까요?', '삭제', true)) { LC.store.collection('history').clear(); ui.toast('삭제했어요'); }
      }),
      iconRow('dday', '#FF3B30', 'D-Day 목록 삭제', chev, async () => {
        if (await ui.confirm('등록한 D-Day를 모두 삭제할까요?', '삭제', true)) { LC.store.collection('dday').clear(); ui.toast('삭제했어요'); }
      }),
      iconRow('trash', '#FF3B30', '모든 데이터 초기화', '', async () => {
        if (await ui.confirm('기록, D-Day, 입력값, 설정이 모두 지워집니다. 계속할까요?', '초기화', true)) { LC.store.clearAll(); theme.apply(); ui.toast('초기화했어요'); setTimeout(() => location.reload(), 600); }
      }, true)
    ]));

    page.appendChild(ui.el('<div class="section-title">정보</div>'));
    page.appendChild(ui.group([
      iconRow('info', '#007AFF', '버전', '<span class="row-value">' + LC.config.version + '</span>'),
      iconRow('doc', '#34C759', '오픈소스 라이선스', chev, licenses)
    ]));

    page.appendChild(ui.el(
      '<div class="app-hero"><img class="app-hero-icon" src="icons/icon-192.png" alt=""/>' +
      '<div style="font-weight:600">' + LC.config.appName + '</div><div class="footnote" style="margin-top:4px">계산 결과는 참고용이며, 금융·건강 관련 결정은 전문가와 상의하세요.</div></div>'));
    view.appendChild(page);
  }

  LC.settings = { mount };
})();
