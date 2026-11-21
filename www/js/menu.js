/* 메뉴(홈) 화면
 * - 아이콘을 길게 누르면(손가락·마우스) 편집 모드 → 끌어서 순서 변경
 * - 최근 사용 목록 (개별 삭제 · 전체 삭제)
 */
(function () {
  const F = LC.F, ui = LC.ui;
  const LONG_PRESS_MS = 450;
  const RECENT_MAX = 5;   // 최근 사용 목록 최대 표시 개수
  let editing = false;
  let exitEditFn = null;

  /* ---------- 순서 ---------- */
  function orderedTools() {
    const saved = LC.store.get('toolOrder', []);
    const list = saved.map(id => LC.tools.find(t => t.id === id)).filter(Boolean);
    LC.tools.forEach(t => { if (!list.includes(t)) list.push(t); }); // 새로 추가된 메뉴는 뒤에
    return list;
  }
  function saveOrder(ids) { LC.store.set('toolOrder', ids); }

  function iconHTML(t, small) {
    return '<div class="tool-icon' + (small ? ' small' : '') + '" style="background:linear-gradient(160deg,' + t.color[0] + ',' + t.color[1] + ')">' + LC.icon(t.icon, { sw: 2 }) + '</div>';
  }

  /* ---------- 최근 사용 ---------- */
  function recentIds() { return LC.store.get('recentTools', []); }
  function pushRecent(id) {
    const r = recentIds().filter(x => x !== id);
    r.unshift(id);
    LC.store.set('recentTools', r.slice(0, RECENT_MAX));
  }

  function mount(view, go) {
    editing = false;
    const page = ui.el('<div class="page menu-page"></div>');
    // 편집 완료 버튼은 화면 아래쪽에 고정 (손가락이 닿기 쉬운 위치)
    const doneBar = ui.el('<div class="edit-bar hidden"><button class="btn edit-done" type="button">' + LC.icon('check', { sw: 2.6 }) + ' 완료</button></div>');
    const doneBtn = doneBar.querySelector('.edit-done');

    // 오늘 날짜 카드 (양력 + 음력)
    const t = F.todayYMD();
    const l = LC.lunar && LC.lunar.solarToLunar(t.y, t.m, t.d);
    const today = ui.el('<div class="today-card"><div class="today-moon">' + LC.icon('lunar', { sw: 2 }) + '</div><div>' +
      '<div class="today-date">' + t.m + '월 ' + t.d + '일 ' + F.WEEK[t.w] + '요일</div>' +
      '<div class="today-sub">' + (l ? '음력 ' + (l.intercalation ? '윤' : '') + l.month + '월 ' + l.day + '일 · ' + l.gapja.year : '') + '</div></div></div>');
    today.style.cursor = 'pointer';
    today.onclick = () => { if (!editing) go('tool/lunar'); };
    page.appendChild(today);

    const hint = ui.el('<div class="edit-hint hidden">아이콘을 끌어서 원하는 위치에 놓으세요' +
      '<button type="button" class="link-btn" data-reset>기본 순서로</button></div>');
    page.appendChild(hint);

    const grid = ui.el('<div class="tool-grid"></div>');
    orderedTools().forEach(tool => {
      const item = ui.el('<div class="tool-item" role="button" tabindex="0" data-id="' + tool.id + '" aria-label="' + ui.esc(tool.title) + '">' +
        iconHTML(tool) + '<span class="tool-name">' + ui.esc(tool.short) + '</span></div>');
      item.addEventListener('click', () => { if (!editing && !suppressClick) go('tool/' + tool.id); });
      item.addEventListener('keydown', e => { if (e.key === 'Enter' && !editing) go('tool/' + tool.id); });
      grid.appendChild(item);
    });
    page.appendChild(grid);
    page.appendChild(doneBar);
    if (!LC.store.get('menu.hintShown', false)) {
      page.appendChild(ui.el('<p class="footnote" data-first-hint>아이콘을 길게 누르면 메뉴 순서를 바꿀 수 있어요.</p>'));
    }

    const recentBox = ui.el('<div></div>');
    page.appendChild(recentBox);
    drawRecent();
    view.appendChild(page);

    function drawRecent() {
      recentBox.innerHTML = '';
      const recent = recentIds().map(id => LC.tools.find(x => x.id === id)).filter(Boolean).slice(0, RECENT_MAX);
      if (!recent.length) return;
      const header = ui.el('<div class="section-head"><span>최근 사용</span><button type="button" class="link-btn">전체 삭제</button></div>');
      header.querySelector('button').onclick = async () => {
        if (await ui.confirm('최근 사용 목록을 모두 지울까요?', '전체 삭제', true)) {
          LC.store.set('recentTools', []); drawRecent(); ui.toast('최근 사용 목록을 지웠어요');
        }
      };
      recentBox.appendChild(header);
      const g = ui.el('<div class="group"></div>');
      recent.forEach(tool => {
        const r = ui.el('<div class="row tappable">' + iconHTML(tool, true) +
          '<span class="row-label" style="flex:1">' + ui.esc(tool.title) + '</span>' +
          '<button type="button" class="row-del" aria-label="' + ui.esc(tool.title) + ' 삭제">' + LC.icon('close', { sw: 2.4 }) + '</button></div>');
        r.onclick = () => { if (!editing) go('tool/' + tool.id); };
        r.querySelector('.row-del').onclick = e => {
          e.stopPropagation();
          LC.store.set('recentTools', recentIds().filter(x => x !== tool.id));
          r.style.transition = 'opacity .2s, transform .2s';
          r.style.opacity = '0'; r.style.transform = 'translateX(30px)';
          setTimeout(drawRecent, 200);
        };
        g.appendChild(r);
      });
      recentBox.appendChild(g);
    }

    /* ---------- 편집 모드 ---------- */
    function enterEdit() {
      if (editing) return;
      editing = true;
      page.classList.add('editing');
      doneBar.classList.remove('hidden');
      hint.classList.remove('hidden');
      const fh = page.querySelector('[data-first-hint]');
      if (fh) fh.remove();
      LC.store.set('menu.hintShown', true);
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
    }
    function exitEdit() {
      if (!editing) return;
      editing = false;
      page.classList.remove('editing');
      doneBar.classList.add('hidden');
      hint.classList.add('hidden');
      saveOrder([...grid.children].map(c => c.dataset.id));
    }
    exitEditFn = () => { if (editing) { exitEdit(); return true; } return false; };
    doneBtn.onclick = exitEdit;
    hint.querySelector('[data-reset]').onclick = () => {
      const def = LC.tools.map(x => x.id);
      const rects = snapshot();
      def.forEach(id => grid.appendChild(grid.querySelector('[data-id="' + id + '"]')));
      animateFrom(rects);
      saveOrder(def);
    };
    view.addEventListener('click', e => {
      if (editing && !e.target.closest('.tool-grid') && !e.target.closest('.edit-hint') && !e.target.closest('.edit-bar')) exitEdit();
    });

    /* ---------- 드래그 ---------- */
    let pressTimer = null, press = null, drag = null, suppressClick = false;

    function snapshot() {
      const m = new Map();
      [...grid.children].forEach(c => m.set(c, c.getBoundingClientRect()));
      return m;
    }
    function animateFrom(rects) {
      [...grid.children].forEach(c => {
        if (drag && c === drag.item) return;
        const a = rects.get(c), b = c.getBoundingClientRect();
        if (!a) return;
        const dx = a.left - b.left, dy = a.top - b.top;
        if (!dx && !dy) return;
        c.style.transition = 'none';
        c.style.translate = dx + 'px ' + dy + 'px';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          c.style.transition = 'translate .22s cubic-bezier(.2,.8,.2,1)';
          c.style.translate = '0 0';
        }));
      });
    }

    function startDrag(item, x, y) {
      const r = item.getBoundingClientRect();
      const ghost = item.cloneNode(true);
      ghost.classList.add('drag-ghost');
      ghost.style.width = r.width + 'px';
      ghost.style.left = r.left + 'px';
      ghost.style.top = r.top + 'px';
      document.body.appendChild(ghost);
      item.classList.add('drag-src');
      drag = { item, ghost, dx: x - r.left, dy: y - r.top, x0: r.left, y0: r.top };
      moveDrag(x, y);
    }
    function moveDrag(x, y) {
      if (!drag) return;
      drag.ghost.style.transform = 'translate(' + (x - drag.dx - drag.x0) + 'px,' + (y - drag.dy - drag.y0) + 'px) scale(1.12)';
      // 가장 가까운 칸 찾기
      let best = null, bestD = Infinity;
      const gr = grid.getBoundingClientRect();
      [...grid.children].forEach(c => {
        // 애니메이션 중 위치(translate)가 아닌 실제 배치 위치 기준
        const cx = gr.left + c.offsetLeft + c.offsetWidth / 2;
        const cy = gr.top + c.offsetTop + c.offsetHeight / 2;
        const d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
        if (d < bestD) { bestD = d; best = c; }
      });
      if (best && best !== drag.item) {
        const kids = [...grid.children];
        const from = kids.indexOf(drag.item), to = kids.indexOf(best);
        const rects = snapshot();
        if (to > from) best.after(drag.item); else best.before(drag.item);
        animateFrom(rects);
      }
      // 화면 가장자리에서 자동 스크롤
      const vr = view.getBoundingClientRect();
      if (y < vr.top + 50) view.scrollTop -= 8; else if (y > vr.bottom - 50) view.scrollTop += 8;
    }
    function endDrag() {
      if (!drag) return;
      const { item, ghost } = drag;
      const r = item.getBoundingClientRect();
      ghost.style.transition = 'transform .18s ease';
      ghost.style.transform = 'translate(' + (r.left - drag.x0) + 'px,' + (r.top - drag.y0) + 'px) scale(1)';
      drag = null;
      setTimeout(() => { ghost.remove(); item.classList.remove('drag-src'); }, 180);
      saveOrder([...grid.children].map(c => c.dataset.id));
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 250);
    }

    function pressStart(item, x, y) {
      press = { item, x, y };
      if (editing) { startDrag(item, x, y); return; }
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        if (!press) return;
        enterEdit();
        startDrag(press.item, press.x, press.y);
      }, LONG_PRESS_MS);
    }
    function pressMove(x, y) {
      if (drag) { moveDrag(x, y); return true; }
      if (press && Math.hypot(x - press.x, y - press.y) > 10) { clearTimeout(pressTimer); press = null; }
      return false;
    }
    function pressEnd() {
      clearTimeout(pressTimer);
      press = null;
      endDrag();
    }

    // 터치
    grid.addEventListener('touchstart', e => {
      const item = e.target.closest('.tool-item');
      if (!item || e.touches.length > 1) return;
      const p = e.touches[0];
      pressStart(item, p.clientX, p.clientY);
    }, { passive: true });
    grid.addEventListener('touchmove', e => {
      const p = e.touches[0];
      if (pressMove(p.clientX, p.clientY) && e.cancelable) e.preventDefault();
    }, { passive: false });
    grid.addEventListener('touchend', e => { if (drag) e.preventDefault(); pressEnd(); });
    grid.addEventListener('touchcancel', pressEnd);
    grid.addEventListener('contextmenu', e => e.preventDefault());

    // 마우스
    grid.addEventListener('mousedown', e => {
      if (e.button !== 0 || e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      const item = e.target.closest('.tool-item');
      if (!item) return;
      e.preventDefault();
      pressStart(item, e.clientX, e.clientY);
      const mm = ev => pressMove(ev.clientX, ev.clientY);
      const mu = () => { pressEnd(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', mu);
    });
  }

  LC.menu = {
    mount, orderedTools, pushRecent,
    handleBack() { return exitEditFn ? exitEditFn() : false; }
  };
})();
