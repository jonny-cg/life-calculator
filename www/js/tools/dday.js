/* 날짜 계산기 (D-Day 목록 + 날짜 계산) */
(function () {
  const F = LC.F, ui = LC.ui;
  const db = LC.store.collection('dday');
  const COLORS = ['#FF3B30', '#FF9500', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93'];
  // 목록에 표시할 아이콘
  const ICONS = [
    { id: 'dday', n: '일정' }, { id: 'age', n: '생일' }, { id: 'heart', n: '기념일' }, { id: 'gift', n: '이벤트' }, { id: 'flag', n: '행사' },
    { id: 'plane', n: '여행' }, { id: 'star', n: '중요' }, { id: 'book', n: '시험·공부' }, { id: 'work', n: '업무' }, { id: 'health', n: '병원·건강' }
  ];
  function iconBox(item, size) {
    const ic = ICONS.some(i => i.id === item.icon) ? item.icon : 'dday';
    const s = size || 38;
    return '<span class="dd-icon" style="width:' + s + 'px;height:' + s + 'px;background:' + item.color + '22;color:' + item.color + '">' + LC.icon(ic, { sw: 2 }) + '</span>';
  }

  function todayStr() { return F.ymdStr(F.todayYMD()); }
  function dotDate(s) { const d = F.parseYMD(s); return d ? d.y + '.' + String(d.m).padStart(2, '0') + '.' + String(d.d).padStart(2, '0') + ' (' + F.weekday(d) + ')' : ''; }
  function dotObj(o) { return dotDate(F.ymdStr(o)); }

  function seed() {
    if (LC.store.get('dday.seeded', false)) return;
    LC.store.set('dday.seeded', true);
    const t = F.todayYMD();
    db.add({ title: t.y + '년 새해부터', date: t.y + '-01-01', includeStart: true, repeat: 'none', color: '#007AFF', icon: 'star' });
    db.add({ title: '크리스마스', date: t.y + '-12-25', includeStart: true, repeat: 'none', color: '#34C759', icon: 'gift' });
  }

  function describe(item) {
    const r = F.dday(item);
    if (!r) return { big: '-', small: '' };
    if (r.mode === 'yearly') return { big: r.label, small: dotObj(r.next) + (r.years > 0 ? ' · ' + r.years + '주년' : '') };
    if (r.mode === 'since') return { big: item.includeStart !== false ? F.fmt(r.nth, 0) + '일째' : r.label, small: item.includeStart !== false ? r.label : F.fmt(r.diff, 0) + '일 지남' };
    return { big: r.label, small: F.fmt(r.left, 0) + '일 남음' };
  }

  /* ---------- 편집 시트 ---------- */
  function editSheet(item, onDone) {
    const isNew = !item;
    const d = Object.assign({ title: '', date: todayStr(), includeStart: true, repeat: 'none', color: COLORS[3], icon: 'dday' }, item || {});
    const wrap = ui.el('<div></div>');
    const titleRow = ui.el('<div class="row"><input class="text-input" maxlength="30" placeholder="제목 (예: 우리 만난 날, 시험일)"/></div>');
    titleRow.querySelector('input').value = d.title;
    titleRow.querySelector('input').oninput = e => { d.title = e.target.value; };
    const dateRow = ui.dateRow({ label: '지정일', value: d.date, onChange: v => { d.date = v; } });
    const repeatRow = ui.segRow({ label: '방식', options: [{ value: 'none', label: '며칠째 · D-Day' }, { value: 'yearly', label: '매년 반복' }], value: d.repeat, onChange: v => { d.repeat = v; sync(); } });
    const incRow = ui.switchRow({ label: '지정일을 1일로 계산', sub: '기념일(100일 등)은 보통 켜 둡니다', value: d.includeStart !== false, onChange: v => { d.includeStart = v; } });
    const colorRow = ui.el('<div class="row"><span class="row-label">색상</span><div class="color-pick"></div></div>');
    // 아이콘 선택
    const iconPick = ui.el('<div class="icon-pick"></div>');
    ICONS.forEach(ic => {
      const b = ui.el('<button type="button" data-ic="' + ic.id + '"><span>' + LC.icon(ic.id, { sw: 2 }) + '</span><span>' + ic.n + '</span></button>');
      b.onclick = () => { d.icon = ic.id; syncIcon(); };
      iconPick.appendChild(b);
    });
    function syncIcon() {
      iconPick.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.ic === d.icon); b.style.setProperty('--c', d.color); });
    }
    syncIcon();
    COLORS.forEach(c => {
      const b = ui.el('<button type="button" style="--c:' + c + '" aria-label="색상"></button>');
      b.onclick = () => { d.color = c; colorRow.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); syncIcon(); };
      if (c === d.color) b.classList.add('on');
      colorRow.querySelector('.color-pick').appendChild(b);
    });
    wrap.appendChild(ui.group([titleRow]));
    wrap.appendChild(ui.group([dateRow, repeatRow, incRow]));
    wrap.appendChild(ui.el('<div class="section-title" style="margin-top:20px">아이콘 · 색상</div>'));
    const ig = ui.group([colorRow]); ig.insertBefore(iconPick, ig.firstChild);
    wrap.appendChild(ig);
    const help = ui.el('<p class="footnote"></p>');
    wrap.appendChild(help);
    function sync() {
      incRow.classList.toggle('hidden', d.repeat === 'yearly');
      help.textContent = d.repeat === 'yearly'
        ? '생일·결혼기념일처럼 매년 돌아오는 날까지 남은 날짜를 알려줍니다.'
        : '지정일이 지났으면 "며칠째", 다가오는 날이면 "D-며칠"로 표시합니다.';
    }
    sync();
    if (!isNew) {
      const del = ui.el('<button class="btn danger mt16">삭제</button>');
      del.onclick = async () => {
        if (await ui.confirm('"' + (d.title || '제목 없음') + '"을(를) 삭제할까요?', '삭제', true)) {
          db.remove(item.id); s.close(); onDone(); ui.toast('삭제했어요');
        }
      };
      wrap.appendChild(del);
    }
    const s = ui.sheet({
      title: isNew ? '새 날짜 추가' : '편집', content: wrap,
      left: { label: '취소' },
      right: {
        label: '저장', onClick: () => {
          if (!F.parseYMD(d.date)) { ui.toast('날짜를 선택하세요'); return false; }
          d.title = (d.title || '').trim() || '제목 없음';
          if (isNew) db.add(d); else db.update(item.id, d);
          onDone(); ui.toast('저장했어요');
        }
      }
    });
    if (isNew) setTimeout(() => titleRow.querySelector('input').focus(), 400);
  }

  /* ---------- 상세 시트 ---------- */
  function detailSheet(item, onDone) {
    const r = F.dday(item);
    const desc = describe(item);
    const base = F.parseYMD(item.date);
    const wrap = ui.el('<div></div>');
    wrap.innerHTML =
      '<div class="result-card" style="margin-top:4px;text-align:center">' +
      '<div style="display:flex;justify-content:center;margin-bottom:8px">' + iconBox(item, 48) + '</div>' +
      '<div class="result-label">' + ui.esc(item.title) + '</div>' +
      '<div class="result-main" style="font-size:44px;color:' + item.color + '">' + desc.big + '</div>' +
      '<div class="result-sub">' + desc.small + '</div>' +
      '<div class="result-sub">' + (item.repeat === 'yearly' ? '매년 ' + base.m + '월 ' + base.d + '일' : '지정일 ' + dotDate(item.date) + (item.includeStart !== false ? ' · 1일째' : '')) + '</div></div>';

    if (item.repeat !== 'yearly') {
      const t = F.todayYMD(), tn = F.dayNum(t.y, t.m, t.d);
      const bn = F.dayNum(base.y, base.m, base.d);
      const inc = item.includeStart !== false;
      const ms = [];
      [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 3000, 5000, 10000].forEach(n => ms.push({ label: F.fmt(n, 0) + '일', dn: bn + (inc ? n - 1 : n) }));
      for (let k = 1; k <= 30; k++) {
        if (k > 10 && k % 5) continue;
        const dd = Math.min(base.d, F.daysInMonth(base.y + k, base.m));
        ms.push({ label: k + '주년', dn: F.dayNum(base.y + k, base.m, dd), year: true });
      }
      ms.sort((a, b) => a.dn - b.dn);
      // 오늘 기준 지난 2개 ~ 앞으로 12개
      const nextIdx = ms.findIndex(m => m.dn >= tn);
      const start = Math.max(0, (nextIdx < 0 ? ms.length : nextIdx) - 2);
      const view = ms.slice(start, start + 14);
      if (r.mode !== 'until') {
        wrap.insertAdjacentHTML('beforeend', '<div class="section-title">기념일</div><div class="group">' +
          view.map(m => {
            const o = F.fromDayNum(m.dn), left = m.dn - tn;
            const tag = left === 0 ? '<b style="color:var(--red)">오늘</b>' : left > 0 ? '<b style="color:var(--accent)">D-' + F.fmt(left, 0) + '</b>' : '<span class="muted">지남</span>';
            return '<div class="row" style="' + (left < 0 ? 'opacity:.55' : '') + '"><span class="row-label" style="font-weight:600">' + m.label + '</span>' +
              '<span class="row-value">' + dotObj(o) + '</span><span style="min-width:62px;text-align:right;font-size:14px">' + tag + '</span></div>';
          }).join('') + '</div>');
      } else {
        const weeks = Math.floor(r.left / 7), days = r.left % 7;
        wrap.insertAdjacentHTML('beforeend', '<div class="group mt16">' +
          '<div class="row"><span class="row-label">남은 기간</span><span class="row-value strong">' + (weeks ? weeks + '주 ' : '') + days + '일</span></div>' +
          '<div class="row"><span class="row-label">남은 시간</span><span class="row-value strong">약 ' + F.fmt(r.left * 24, 0) + '시간</span></div></div>');
      }
    }
    const edit = ui.el('<button class="btn secondary mt24">' + LC.icon('edit') + ' 편집</button>');
    edit.querySelector('svg').style.cssText = 'width:18px;height:18px';
    wrap.appendChild(edit);
    const s = ui.sheet({ title: '상세', content: wrap });
    edit.onclick = () => { s.close(); setTimeout(() => editSheet(item, onDone), 250); };
  }

  /* ---------- 날짜 계산 탭 ---------- */
  function renderCalc(box) {
    const st = ui.toolState('datecalc', { base: '', n: 100, op: 'nth', a: '', b: '' });
    const today = todayStr();
    st.base = st.base || today; st.a = st.a || today; st.b = st.b || today;

    box.appendChild(ui.el('<div class="section-title big" style="margin-top:4px">며칠째 되는 날</div>'));
    const res1 = ui.el('<div class="result-card"></div>');
    const g1 = ui.group([
      ui.dateRow({ label: '기준일', value: st.base, onChange: v => { st.base = v; st.save(); c1(); } }),
      ui.segRow({ label: '계산', options: [{ value: 'nth', label: 'N일째' }, { value: 'after', label: 'N일 후' }, { value: 'before', label: 'N일 전' }], value: st.op, onChange: v => { st.op = v; st.save(); c1(); } }),
      ui.numberRow({ label: '일수', unit: '일', value: st.n, decimals: 0, maxDigits: 6, onChange: v => { st.n = v; st.save(); c1(); } })
    ]);
    g1.appendChild(ui.chips([100, 200, 300, 365, 500, 1000].map(v => ({ label: v + '일', value: v })), v => {
      st.n = v; st.save(); g1.querySelectorAll('input[type=text]')[0].setNumber(v); c1();
    }));
    box.appendChild(g1); box.appendChild(res1);
    function c1() {
      const n = F.parseNum(st.n);
      if (!F.parseYMD(st.base) || !(n >= 0)) { res1.innerHTML = '<div class="result-empty">기준일과 일수를 입력하세요</div>'; return; }
      const b = F.parseYMD(st.base);
      const bn = F.dayNum(b.y, b.m, b.d);
      const dn = st.op === 'nth' ? bn + Math.max(0, n - 1) : st.op === 'after' ? bn + n : bn - n;
      const o = F.fromDayNum(dn);
      const t = F.todayYMD(), left = dn - F.dayNum(t.y, t.m, t.d);
      res1.innerHTML = '<div class="result-label">' + (st.op === 'nth' ? '기준일을 1일로 ' + F.fmt(n, 0) + '일째' : F.fmt(n, 0) + '일 ' + (st.op === 'after' ? '후' : '전')) + '</div>' +
        '<div class="result-main" style="font-size:28px">' + F.dateLabel(o) + '</div>' +
        '<div class="result-sub">오늘 기준 ' + (left === 0 ? 'D-Day (오늘)' : left > 0 ? 'D-' + F.fmt(left, 0) : F.fmt(-left, 0) + '일 지남') + '</div>';
    }
    c1();

    box.appendChild(ui.el('<div class="section-title big">두 날짜 사이 기간</div>'));
    const res2 = ui.el('<div class="result-card"></div>');
    box.appendChild(ui.group([
      ui.dateRow({ label: '시작일', value: st.a, onChange: v => { st.a = v; st.save(); c2(); } }),
      ui.dateRow({ label: '종료일', value: st.b, onChange: v => { st.b = v; st.save(); c2(); } })
    ]));
    box.appendChild(res2);
    function c2() {
      if (!F.parseYMD(st.a) || !F.parseYMD(st.b)) { res2.innerHTML = '<div class="result-empty">날짜를 선택하세요</div>'; return; }
      const diff = Math.abs(F.daysBetween(st.a, st.b));
      const p = F.ymdDiff(st.a, st.b);
      res2.innerHTML = '<div class="result-label">차이</div>' +
        '<div class="result-main">' + F.fmt(diff, 0) + '<span class="u">일</span></div>' +
        ui.resultRows([
          { label: '시작일 포함 시', value: F.fmt(diff + 1, 0) + '일째' },
          { label: '년·월·일', value: (p.y ? p.y + '년 ' : '') + (p.m ? p.m + '개월 ' : '') + p.d + '일' },
          { label: '주 단위', value: Math.floor(diff / 7) + '주 ' + (diff % 7) + '일' }
        ]);
    }
    c2();
  }

  LC.registerTool({
    id: 'dday', title: '날짜 계산기', short: '날짜·D-Day', icon: 'dday', color: ['#FF6259', '#E5322A'],
    render(page) {
      seed();
      const st = ui.toolState('dday', { tab: 'list' });
      const addBtn = ui.el('<button class="nav-btn icon-only" aria-label="추가">' + LC.icon('plus', { sw: 2.2 }) + '</button>');
      page.nav.querySelector('.nav-right').appendChild(addBtn);
      addBtn.onclick = () => editSheet(null, drawList);

      page.appendChild(ui.segmented([{ value: 'list', label: 'D-Day 목록' }, { value: 'calc', label: '날짜 계산' }], st.tab, v => { st.tab = v; st.save(); show(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);

      function show() {
        box.innerHTML = '';
        addBtn.classList.toggle('hidden', st.tab !== 'list');
        if (st.tab === 'list') drawList(); else renderCalc(box);
      }
      function drawList() {
        if (st.tab !== 'list') return;
        box.innerHTML = '';
        const t = F.todayYMD();
        box.appendChild(ui.el('<div class="footnote" style="margin:0 4px 10px">오늘 ' + F.dateLabel(t) + '</div>'));
        const items = db.all();
        if (!items.length) {
          box.appendChild(ui.el('<div class="empty">' + LC.icon('dday', { sw: 1.5 }) + '<div>등록된 날짜가 없어요<br/>기념일이나 D-Day를 추가해 보세요</div></div>'));
        } else {
          const g = ui.el('<div class="group"></div>');
          items.forEach(it => {
            const ds = describe(it);
            const sub = it.repeat === 'yearly' ? '매년 ' + +it.date.slice(5, 7) + '월 ' + +it.date.slice(8, 10) + '일' : dotDate(it.date);
            const li = ui.el('<div class="list-item">' + iconBox(it) +
              '<div class="li-main"><div class="li-title">' + ui.esc(it.title) + '</div><div class="li-sub">' + sub + '</div></div>' +
              '<div class="li-right"><div class="li-big" style="color:' + it.color + '">' + ds.big + '</div><div class="li-small">' + ds.small + '</div></div></div>');
            li.onclick = () => detailSheet(it, drawList);
            g.appendChild(li);
          });
          box.appendChild(g);
        }
        const add = ui.el('<button class="btn secondary mt16">' + LC.icon('plus', { sw: 2.2 }) + ' 날짜 추가</button>');
        add.querySelector('svg').style.cssText = 'width:20px;height:20px';
        add.onclick = () => editSheet(null, drawList);
        box.appendChild(add);
      }
      show();
    }
  });
})();
