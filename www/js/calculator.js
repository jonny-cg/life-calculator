/* 기본 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  const history = LC.store.collection('history');
  const MAX_DIGITS = 15;

  let tokens = [];          // [{t:'n', s:'12', p:false}, {t:'o', v:'+'}]
  let evaluated = false;    // '=' 직후 상태
  let lastExpr = '';        // '=' 직후 위쪽에 보여줄 수식
  let root = null;

  (function load() {
    const s = LC.store.get('calc.state', null);
    if (s && Array.isArray(s.tokens)) { tokens = s.tokens; evaluated = !!s.evaluated; lastExpr = s.lastExpr || ''; }
  })();
  function persist() { LC.store.set('calc.state', { tokens, evaluated, lastExpr }); }

  /* ---------- 표시용 포맷 ---------- */
  function fmtNumStr(s) {
    if (s === undefined || s === null) return '';
    if (/e/i.test(s) || s === 'Infinity' || s === 'NaN') return s;
    const neg = s.startsWith('-');
    const body = neg ? s.slice(1) : s;
    const [ip, fp] = body.split('.');
    const ipf = (ip || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + ipf + (fp !== undefined ? '.' + fp : '');
  }
  function exprText(list) {
    return list.map(t => t.t === 'n' ? (t.s.startsWith('-') && list.length > 1 ? '(' + fmtNumStr(t.s) + ')' : fmtNumStr(t.s)) + (t.p ? '%' : '') : ' ' + t.v + ' ').join('');
  }
  function resultToStr(v) {
    if (!isFinite(v)) return null;
    const x = F.fix(v);
    if (Math.abs(x) >= 1e15 || (x !== 0 && Math.abs(x) < 1e-10)) return x.toExponential(8).replace(/\.?0+e/, 'e');
    // 소수점 이하 최대 10자리
    let s = String(parseFloat(x.toFixed(10)));
    if (/e/.test(s)) s = x.toFixed(10).replace(/\.?0+$/, '');
    return s;
  }
  function last() { return tokens[tokens.length - 1]; }

  /* ---------- 입력 처리 ---------- */
  function input(key) {
    if (evaluated && /^[0-9.]$/.test(key)) { tokens = []; evaluated = false; lastExpr = ''; }
    if (evaluated && key !== '=') { evaluated = false; lastExpr = ''; }
    const L = last();

    if (/^[0-9]$/.test(key)) {
      if (L && L.t === 'n') {
        if (L.p) return; // 퍼센트 뒤에는 숫자 입력 불가
        const digits = L.s.replace(/[^0-9]/g, '').length;
        if (digits >= MAX_DIGITS) return;
        if (L.s === '0') L.s = key; else if (L.s === '-0') L.s = '-' + key; else L.s += key;
      } else tokens.push({ t: 'n', s: key, p: false });
    }
    else if (key === '.') {
      if (L && L.t === 'n') { if (L.p || L.s.includes('.') || /e/.test(L.s)) return; L.s += '.'; }
      else tokens.push({ t: 'n', s: '0.', p: false });
    }
    else if (['+', '−', '×', '÷'].includes(key)) {
      if (!L) tokens.push({ t: 'n', s: '0', p: false });
      else if (L.t === 'o') { L.v = key; render(); return; }
      else if (L.s.endsWith('.')) L.s = L.s.slice(0, -1);
      tokens.push({ t: 'o', v: key });
    }
    else if (key === '%') {
      if (L && L.t === 'n') L.p = !L.p;
    }
    else if (key === '±') {
      if (L && L.t === 'n') L.s = L.s.startsWith('-') ? L.s.slice(1) : '-' + L.s;
      else if (!L) tokens.push({ t: 'n', s: '-0', p: false });
    }
    else if (key === 'back') {
      if (!L) return;
      if (L.t === 'o') tokens.pop();
      else if (L.p) L.p = false;
      else {
        L.s = L.s.slice(0, -1);
        if (L.s === '' || L.s === '-') tokens.pop();
      }
    }
    else if (key === 'AC') { tokens = []; lastExpr = ''; evaluated = false; }
    else if (key === '=') { equals(); return; }
    render();
  }

  function equals() {
    if (!tokens.length || evaluated) return;
    if (tokens.length === 1 && !tokens[0].p) return;
    while (last() && last().t === 'o') tokens.pop();
    const expr = exprText(tokens);
    const v = F.evaluate(tokens);
    const s = resultToStr(v);
    if (s === null) {
      ui.toast('0으로 나눌 수 없어요');
      return;
    }
    history.add({ expr: expr, result: s, ts: Date.now() });
    const all = history.all();
    if (all.length > LC.config.historyLimit) history.save(all.slice(-LC.config.historyLimit));
    lastExpr = expr + ' =';
    tokens = [{ t: 'n', s: s, p: false }];
    evaluated = true;
    render();
  }

  /* ---------- 화면 ---------- */
  const KEYS = [
    ['AC', 'fn'], ['±', 'fn'], ['%', 'fn'], ['÷', 'op'],
    ['7'], ['8'], ['9'], ['×', 'op'],
    ['4'], ['5'], ['6'], ['−', 'op'],
    ['1'], ['2'], ['3'], ['+', 'op'],
    ['back', 'fn'], ['0'], ['.'], ['=', 'op']
  ];

  function mount(view) {
    root = ui.el(
      '<section class="calc">' +
      '<div class="calc-top">' +
      '<button class="nav-btn" data-history aria-label="계산 기록">' + LC.icon('history', { sw: 1.9 }) + '</button>' +
      '<button class="nav-btn" data-copy aria-label="결과 복사">' + LC.icon('copy', { sw: 1.9 }) + '</button>' +
      '</div>' +
      '<div class="calc-display">' +
      '<div class="calc-expr"></div>' +
      '<div class="calc-main" title="눌러서 복사"></div>' +
      '<div class="calc-preview"></div>' +
      '</div>' +
      '<div class="calc-keys"></div>' +
      '</section>');
    const keys = root.querySelector('.calc-keys');
    KEYS.forEach(([k, cls]) => {
      const label = k === 'back' ? LC.icon('backspace', { sw: 1.8 }) : (k === '.' ? '.' : k);
      const b = ui.el('<button class="key ' + (cls || '') + '" data-k="' + k + '" aria-label="' + (k === 'back' ? '지우기' : k) + '">' + label + '</button>');
      b.addEventListener('click', () => input(k));
      keys.appendChild(b);
    });
    root.querySelector('[data-history]').onclick = openHistory;
    const copyMain = () => {
      const L = tokens.length === 1 && tokens[0].t === 'n' ? tokens[0].s : currentResultStr();
      if (L) ui.copy(L, '');
    };
    root.querySelector('[data-copy]').onclick = copyMain;
    root.querySelector('.calc-main').onclick = copyMain;
    view.appendChild(root);
    render();
  }

  function currentResultStr() {
    if (!tokens.length) return '0';
    return resultToStr(F.evaluate(tokens)) || '';
  }

  function render() {
    persist();
    if (!root || !root.isConnected) return;
    const exprEl = root.querySelector('.calc-expr');
    const mainEl = root.querySelector('.calc-main');
    const prevEl = root.querySelector('.calc-preview');

    exprEl.textContent = lastExpr;
    mainEl.textContent = tokens.length ? exprText(tokens) : '0';

    const hasOp = tokens.some(t => t.t === 'o') || tokens.some(t => t.p);
    if (!evaluated && hasOp && last() && last().t === 'n') {
      const s = currentResultStr();
      prevEl.textContent = s ? '= ' + fmtNumStr(s) : '';
    } else prevEl.textContent = '';

    // AC 버튼 / 연산자 하이라이트
    const L = last();
    root.querySelectorAll('.key.op').forEach(b => b.classList.toggle('sel', !!(L && L.t === 'o' && L.v === b.dataset.k)));
    fitText(mainEl);
  }

  function fitText(elm) {
    const max = window.innerHeight < 700 ? 56 : 72;
    let size = max;
    elm.style.fontSize = size + 'px';
    const avail = elm.parentElement.clientWidth - 12;
    while (elm.scrollWidth > avail && size > 26) { size -= 2; elm.style.fontSize = size + 'px'; }
    if (elm.scrollWidth > avail) { elm.style.whiteSpace = 'normal'; elm.style.wordBreak = 'break-all'; elm.style.textAlign = 'right'; }
    else elm.style.whiteSpace = 'nowrap';
  }

  function openHistory() {
    const items = history.all().slice().reverse();
    const wrap = ui.el('<div></div>');
    if (!items.length) {
      wrap.innerHTML = '<div class="empty">' + LC.icon('history', { sw: 1.5 }) + '<div>계산 기록이 없어요</div></div>';
    } else {
      const g = ui.el('<div class="group"></div>');
      items.forEach(it => {
        const d = new Date(it.ts);
        const row = ui.el('<div class="history-item"><div class="history-expr">' + ui.esc(it.expr) + ' =</div>' +
          '<div class="history-res">' + fmtNumStr(it.result) + '</div>' +
          '<div class="li-small">' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</div></div>');
        row.onclick = () => { useValue(it.result); s.close(); };
        g.appendChild(row);
      });
      wrap.appendChild(g);
      wrap.appendChild(ui.el('<p class="footnote">기록을 누르면 결과값을 계산기로 가져옵니다.</p>'));
    }
    const s = ui.sheet({
      title: '계산 기록', content: wrap,
      left: items.length ? { label: '전체 삭제', onClick: async (sh) => {
        if (await ui.confirm('계산 기록을 모두 삭제할까요?', '삭제', true)) { history.clear(); sh.close(); ui.toast('삭제했어요'); }
      } } : null,
      right: { label: '완료' }
    });
  }

  function useValue(v) {
    const L = last();
    if (evaluated || !L) { tokens = [{ t: 'n', s: v, p: false }]; evaluated = false; lastExpr = ''; }
    else if (L.t === 'o') tokens.push({ t: 'n', s: v, p: false });
    else { tokens[tokens.length - 1] = { t: 'n', s: v, p: false }; }
    render();
  }

  /* ---------- 키보드 (윈도우) ---------- */
  const keyMap = { '+': '+', '-': '−', '*': '×', 'x': '×', '/': '÷', '%': '%', '.': '.', ',': '.', 'Enter': '=', '=': '=', 'Backspace': 'back', 'Escape': 'AC', 'Delete': 'AC' };
  document.addEventListener('keydown', e => {
    if (!root || !root.isConnected || document.querySelector('.sheet-backdrop')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { root.querySelector('[data-copy]').click(); }
      return;
    }
    const k = /^[0-9]$/.test(e.key) ? e.key : keyMap[e.key];
    if (!k) return;
    e.preventDefault();
    input(k);
    const b = root.querySelector('.key[data-k="' + CSS.escape(k) + '"]');
    if (b) { b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 110); }
  });
  window.addEventListener('resize', () => { if (root && root.isConnected) fitText(root.querySelector('.calc-main')); });

  LC.calculator = { mount };
})();
