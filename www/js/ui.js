/* 공통 UI 컴포넌트 */
(function () {
  const F = LC.F;

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 토스트 ---------- */
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }
  function copy(text, label) {
    const done = () => toast((label || '') + '복사했어요');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }

  /* ---------- 바텀 시트 ---------- */
  const openSheets = [];
  function sheet(opts) {
    const root = document.getElementById('sheet-root');
    const back = el(
      '<div class="sheet-backdrop"><div class="sheet" role="dialog" aria-modal="true">' +
      '<div class="sheet-head">' +
      '<div>' + (opts.left ? '<button class="nav-btn" data-act="left">' + esc(opts.left.label) + '</button>' : '') + '</div>' +
      '<div class="sheet-title">' + esc(opts.title || '') + '</div>' +
      '<button class="nav-btn" data-act="right">' + esc(opts.right ? opts.right.label : '닫기') + '</button>' +
      '</div><div class="sheet-body"></div></div></div>');
    const body = back.querySelector('.sheet-body');
    if (typeof opts.content === 'string') body.innerHTML = opts.content;
    else if (opts.content) body.appendChild(opts.content);
    root.appendChild(back);
    requestAnimationFrame(() => requestAnimationFrame(() => back.classList.add('open')));

    const api = {
      el: back, body: body,
      close() {
        const i = openSheets.indexOf(api);
        if (i >= 0) openSheets.splice(i, 1);
        back.classList.remove('open');
        setTimeout(() => back.remove(), 380);
        if (opts.onClose) opts.onClose();
      }
    };
    back.addEventListener('click', e => { if (e.target === back) api.close(); });
    back.querySelector('[data-act="right"]').addEventListener('click', () => {
      if (opts.right && opts.right.onClick) { if (opts.right.onClick(api) === false) return; }
      api.close();
    });
    const lb = back.querySelector('[data-act="left"]');
    if (lb) lb.addEventListener('click', () => { if (opts.left.onClick) opts.left.onClick(api); else api.close(); });
    openSheets.push(api);
    return api;
  }
  function closeTopSheet() {
    if (!openSheets.length) return false;
    openSheets[openSheets.length - 1].close();
    return true;
  }

  function confirmDialog(message, okLabel, danger) {
    return new Promise(resolve => {
      let answered = false;
      const content = el('<div><p style="text-align:center;font-size:15px;line-height:1.5;margin:8px 4px 20px;color:var(--text-2)">' + esc(message) + '</p>' +
        '<button class="btn ' + (danger ? 'danger-fill' : '') + '" data-ok style="' + (danger ? 'background:var(--red)' : '') + '">' + esc(okLabel || '확인') + '</button>' +
        '<button class="btn secondary mt8" data-cancel>취소</button></div>');
      const s = sheet({ title: '', right: { label: '' }, content: content, onClose: () => { if (!answered) resolve(false); } });
      s.el.querySelector('.sheet-head [data-act="right"]').style.visibility = 'hidden';
      content.querySelector('[data-ok]').onclick = () => { answered = true; resolve(true); s.close(); };
      content.querySelector('[data-cancel]').onclick = () => { s.close(); };
    });
  }

  /* ---------- 세그먼트 컨트롤 ---------- */
  function segmented(options, value, onChange, extraClass) {
    const s = el('<div class="seg ' + (extraClass || '') + '"><span class="seg-thumb"></span></div>');
    const thumb = s.firstElementChild;
    options.forEach(o => {
      const b = el('<button type="button" data-v="' + esc(o.value) + '">' + esc(o.label) + '</button>');
      b.onclick = () => { set(o.value); onChange && onChange(o.value); };
      s.appendChild(b);
    });
    function set(v) {
      value = v;
      const btns = [...s.querySelectorAll('button')];
      const idx = Math.max(0, btns.findIndex(b => b.dataset.v === String(v)));
      btns.forEach((b, i) => b.classList.toggle('on', i === idx));
      thumb.style.width = 'calc((100% - 4px) / ' + btns.length + ')';
      thumb.style.transform = 'translateX(' + (idx * 100) + '%)';
    }
    set(value);
    s.setValue = set;
    return s;
  }

  /* ---------- 숫자 입력 (콤마 자동) ---------- */
  function bindNumber(input, opts) {
    opts = opts || {};
    const decimals = opts.decimals === undefined ? 10 : opts.decimals;
    input.setAttribute('inputmode', decimals > 0 ? 'decimal' : 'numeric');
    input.setAttribute('autocomplete', 'off');
    function format(raw) {
      let s = raw.replace(/[^0-9.\-]/g, '');
      const neg = opts.negative && s.startsWith('-');
      s = s.replace(/-/g, '');
      if (decimals === 0) s = s.replace(/\./g, '');
      const dot = s.indexOf('.');
      let ip = dot >= 0 ? s.slice(0, dot) : s;
      let fp = dot >= 0 ? s.slice(dot + 1).replace(/\./g, '').slice(0, decimals) : null;
      ip = ip.replace(/^0+(?=\d)/, '');
      if (opts.maxDigits) ip = ip.slice(0, opts.maxDigits);
      const ipf = opts.comma === false ? ip : ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return (neg ? '-' : '') + (dot >= 0 ? (ipf || '0') + '.' + fp : ipf);
    }
    input.addEventListener('input', () => {
      const pos = input.selectionStart || 0;
      const sig = input.value.slice(0, pos).replace(/[^0-9.\-]/g, '').length;
      const out = format(input.value);
      input.value = out;
      let c = 0, k = 0;
      while (k < out.length && c < sig) { if (/[0-9.\-]/.test(out[k])) c++; k++; }
      try { input.setSelectionRange(k, k); } catch (e) {}
      opts.onChange && opts.onChange(F.parseNum(out));
    });
    input.addEventListener('focus', () => setTimeout(() => { try { input.select(); } catch (e) {} }, 0));
    input.setNumber = v => {
      input.value = (v === '' || v === null || v === undefined || isNaN(v)) ? '' : format(String(v));
    };
    if (opts.value !== undefined) input.setNumber(opts.value);
    return input;
  }

  /* ---------- 폼 행 생성 ---------- */
  // 숫자 입력 행: 반환된 행에 .input, .hint 참조
  function numberRow(o) {
    const row = el('<div class="row"><label class="row-label">' + esc(o.label) +
      (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</label>' +
      '<div class="field"><input type="text" placeholder="' + esc(o.placeholder || '0') + '" aria-label="' + esc(o.label) + '"/>' +
      (o.unit ? '<span class="unit">' + esc(o.unit) + '</span>' : '') + '</div></div>');
    row.input = row.querySelector('input');
    bindNumber(row.input, { decimals: o.decimals, value: o.value, maxDigits: o.maxDigits, onChange: o.onChange, negative: o.negative, comma: o.comma });
    return row;
  }
  function dateRow(o) {
    const row = el('<div class="row"><label class="row-label">' + esc(o.label) + '</label>' +
      '<div class="field"><input type="date" min="1000-01-01" max="2999-12-31" value="' + esc(o.value || '') + '"/></div></div>');
    row.input = row.querySelector('input');
    row.input.addEventListener('change', () => o.onChange && o.onChange(row.input.value));
    row.input.addEventListener('input', () => o.onChange && o.onChange(row.input.value));
    return row;
  }
  function switchRow(o) {
    const row = el('<label class="row" style="cursor:pointer"><span class="row-label">' + esc(o.label) +
      (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span>' +
      '<span class="switch"><input type="checkbox" ' + (o.value ? 'checked' : '') + '/><span></span></span></label>');
    row.input = row.querySelector('input');
    row.input.addEventListener('change', () => o.onChange && o.onChange(row.input.checked));
    return row;
  }
  function segRow(o) {
    const row = el('<div class="row"><span class="row-label">' + esc(o.label) + '</span></div>');
    row.seg = segmented(o.options, o.value, o.onChange);
    row.appendChild(row.seg);
    return row;
  }
  function chips(list, onPick) {
    const c = el('<div class="chips"></div>');
    list.forEach(item => {
      const b = el('<button type="button" class="chip">' + esc(item.label) + '</button>');
      b.onclick = () => onPick(item.value, b);
      c.appendChild(b);
    });
    return c;
  }
  function group(rows) {
    const g = el('<div class="group"></div>');
    rows.forEach(r => r && g.appendChild(r));
    return g;
  }

  /* ---------- 결과 카드 ---------- */
  function resultRows(list) {
    return '<div class="result-rows">' + list.filter(Boolean).map(r =>
      '<div class="result-row ' + (r.cls || '') + '"><span>' + esc(r.label) + '</span><span>' + r.value + '</span></div>').join('') + '</div>';
  }

  /* ---------- 게이지 ---------- */
  // segments: [{from, to, color}], value, labels: [numbers]
  function gauge(segments, value, labels, legend) {
    const min = segments[0].from, max = segments[segments.length - 1].to;
    const pct = v => Math.max(0, Math.min(100, (v - min) / (max - min) * 100));
    return '<div class="gauge"><div class="gauge-bar">' +
      segments.map(s => '<i style="width:' + (pct(s.to) - pct(s.from)) + '%;background:' + s.color + '"></i>').join('') +
      (isFinite(value) ? '<span class="gauge-pin" style="left:' + pct(value) + '%"></span>' : '') +
      '</div><div class="gauge-labels">' +
      (labels || []).map(l => '<span style="left:' + pct(l) + '%">' + l + '</span>').join('') + '</div>' +
      (legend ? '<div class="gauge-legend">' + legend.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '') +
      '</div>';
  }

  /* ---------- 도구 화면 공통 틀 ---------- */
  function toolPage(def, ctx) {
    const page = el('<div class="page push"></div>');
    const nav = el('<header class="navbar">' +
      '<button class="nav-btn" data-back>' + LC.icon('back', { sw: 2.4 }) + '메뉴</button>' +
      '<div class="navbar-title">' + esc(def.title) + '</div>' +
      '<div class="nav-right"></div></header>');
    nav.querySelector('[data-back]').onclick = () => ctx.back();
    if (def.info) {
      const ib = el('<button class="nav-btn icon-only" aria-label="안내">' + LC.icon('info') + '</button>');
      ib.onclick = () => def.info();
      nav.querySelector('.nav-right').appendChild(ib);
    }
    if (def.refreshable) {
      const rb = el('<button class="nav-btn icon-only" data-refresh aria-label="새로고침">' + LC.icon('refresh', { sw: 2.1 }) + '</button>');
      nav.querySelector('.nav-right').appendChild(rb);
    }
    page.appendChild(nav);
    page.nav = nav;
    return page;
  }

  function infoBanner(text, onClick) {
    const b = el('<button type="button" class="info-banner">' + LC.icon('info') + '<span>' + esc(text) + '</span>' +
      '<span class="chev">' + LC.icon('chevron', { sw: 2.6 }) + '</span></button>');
    b.onclick = onClick;
    return b;
  }

  // 화면별 입력값 기억 (앱을 다시 열어도 마지막 입력 유지)
  function toolState(id, defaults) {
    const key = 'state.' + id;
    const state = Object.assign({}, defaults, LC.store.get(key, {}));
    state.save = () => {
      const copy = Object.assign({}, state); delete copy.save;
      LC.store.set(key, copy);
    };
    return state;
  }

  LC.ui = {
    el, esc, toast, copy, sheet, closeTopSheet, confirm: confirmDialog,
    segmented, bindNumber, numberRow, dateRow, switchRow, segRow, chips, group,
    resultRows, gauge, toolPage, infoBanner, toolState
  };

  /* ---------- 도구 등록 ---------- */
  LC.tools = [];
  LC.registerTool = def => LC.tools.push(def);
})();
