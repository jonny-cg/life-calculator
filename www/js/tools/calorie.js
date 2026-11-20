/* 칼로리 계산기 — 칼로리 ↔ 운동 시간
 * 소모 칼로리(kcal/분) = MET × 3.5 × 체중(kg) ÷ 200
 * MET 값: 「Compendium of Physical Activities」(신체활동 개요서) 기준
 */
(function () {
  const F = LC.F, ui = LC.ui;
  const ACTS = [
    { id: 'walk', e: '🚶', n: '걷기', d: '보통 속도 · 시속 4.8km', met: 3.5, spm: 100 },
    { id: 'fastwalk', e: '🚶‍♀️', n: '빠르게 걷기', d: '시속 6.4km', met: 5.0, spm: 120 },
    { id: 'jog', e: '🏃', n: '가볍게 뛰기', d: '조깅 · 시속 8km', met: 8.3 },
    { id: 'run', e: '🏃‍♂️', n: '달리기', d: '시속 10km', met: 9.8 },
    { id: 'weight', e: '🏋️', n: '근력 운동', d: '웨이트 트레이닝', met: 5.0 },
    { id: 'circuit', e: '💪', n: '맨몸 서킷 운동', d: '스쿼트·버피 등 고강도', met: 8.0 },
    { id: 'stairs', e: '🪜', n: '계단 오르기', d: '빠르게', met: 8.8 },
    { id: 'hike', e: '⛰️', n: '등산', d: '일반 산행', met: 6.0 },
    { id: 'bike', e: '🚴', n: '자전거', d: '시속 16~19km', met: 6.8 },
    { id: 'swim', e: '🏊', n: '수영', d: '자유형 · 보통', met: 5.8 },
    { id: 'rope', e: '🤸', n: '줄넘기', d: '보통 속도', met: 11.8 },
    { id: 'badminton', e: '🏸', n: '배드민턴', d: '일반', met: 5.5 },
    { id: 'tennis', e: '🎾', n: '테니스', d: '일반', met: 7.3 },
    { id: 'soccer', e: '⚽', n: '축구', d: '일반', met: 7.0 },
    { id: 'golf', e: '⛳', n: '골프', d: '카트 없이 걸으며', met: 4.8 },
    { id: 'yoga', e: '🧘', n: '요가', d: '하타 요가', met: 2.5 },
    { id: 'pilates', e: '🤾', n: '필라테스', d: '일반', met: 3.0 },
    { id: 'clean', e: '🧹', n: '집안 청소', d: '보통', met: 3.3 }
  ];
  const MAIN = ['walk', 'run', 'weight'];
  const FOODS = [
    { n: '공기밥 1공기', k: 300 }, { n: '라면 1봉지', k: 500 }, { n: '김밥 1줄', k: 400 }, { n: '짜장면 1그릇', k: 800 },
    { n: '삼겹살 1인분', k: 650 }, { n: '치킨 반 마리', k: 1100 }, { n: '피자 1조각', k: 300 }, { n: '햄버거 세트', k: 1000 },
    { n: '소주 1병', k: 400 }, { n: '맥주 500ml', k: 200 }, { n: '콜라 1캔', k: 150 }, { n: '카페라떼 톨', k: 180 },
    { n: '아이스크림 1개', k: 250 }, { n: '초코파이 1개', k: 170 }
  ];
  // 기초대사량 (Mifflin-St Jeor 공식)
  function bmr(p) {
    const w = F.parseNum(p.weight), h = F.parseNum(p.height), a = F.parseNum(p.age);
    if (!(w > 0 && h > 0 && a > 0)) return NaN;
    return 10 * w + 6.25 * h - 5 * a + (p.sex === 'm' ? 5 : -161);
  }
  // 분당 소모 칼로리
  //  - 기초대사량 반영: 내 기초대사량을 1 MET 로 보고, 가만히 있어도 쓰는 몫(1 MET)을 뺀 '운동으로 추가로 쓴' 칼로리
  //  - 미반영: 표준 공식 MET × 3.5 × 체중 ÷ 200 (가만히 있을 때 소모분 포함)
  function perMinFor(met, p) {
    if (p.useBmr) { const b = bmr(p); return (met - 1) * b / 1440; }
    return met * 3.5 * F.parseNum(p.weight) / 200;
  }
  function dur(min) {
    if (!isFinite(min)) return '-';
    min = Math.round(min);
    if (min < 60) return min + '분';
    return Math.floor(min / 60) + '시간' + (min % 60 ? ' ' + (min % 60) + '분' : '');
  }

  function info() {
    ui.sheet({
      title: '칼로리 계산 기준', content:
        '<div class="group">' +
        '<div class="row"><span class="row-value" style="text-align:left;color:var(--text);line-height:1.6"><b>기초대사량 반영 (체크)</b><br/>기초대사량(Mifflin-St Jeor 공식) = 10×체중 + 6.25×키 − 5×나이 + 5(남) / −161(여)<br/>운동 소모 = (MET − 1) × 기초대사량 ÷ 1440 × 분<br/><small class="muted">성별·나이·키를 반영하고, 가만히 있어도 쓰는 기초대사 칼로리를 뺀 "운동으로 더 쓴" 칼로리입니다. 같은 칼로리를 태우는 데 필요한 시간이 조금 더 길게 나옵니다.</small></span></div>' +
        '<div class="row"><span class="row-value" style="text-align:left;color:var(--text);line-height:1.6"><b>기초대사량 미반영 (체크 해제)</b><br/>소모 칼로리(kcal/분) = MET × 3.5 × 체중(kg) ÷ 200<br/><small class="muted">체중만 반영하는 일반적인 공식이며, 운동하는 동안의 기초대사 소모분도 포함됩니다.</small></span></div>' +
        '</div><p class="footnote">MET(대사당량)은 가만히 앉아 있을 때를 1로 본 운동 강도입니다.</p>' +
        '<div class="section-title">운동별 MET</div><div class="table-wrap"><table class="table"><thead><tr><th>운동</th><th>강도</th><th>MET</th></tr></thead><tbody>' +
        ACTS.map(a => '<tr><td>' + a.e + ' ' + a.n + '</td><td style="color:var(--text-2)">' + a.d + '</td><td class="em">' + a.met + '</td></tr>').join('') +
        '</tbody></table></div>' +
        '<p class="footnote">MET 값은 「Compendium of Physical Activities」(신체활동 개요서)를 따랐습니다. 실제 소모량은 나이, 성별, 근육량, 운동 강도에 따라 달라지는 대략적인 값입니다. 음식 칼로리도 제품·조리법·양에 따라 다릅니다.</p>'
    });
  }

  LC.registerTool({
    id: 'calorie', title: '칼로리 계산기', short: '칼로리', icon: 'calorie', color: ['#FF9F43', '#EE5A24'],
    info: info,
    render(page) {
      const st = ui.toolState('calorie', { mode: 'burn', kcal: 500, foods: [], weight: 65, act: 'run', min: 30, useBmr: true, sex: 'm', age: 35, height: 170 });
      if (!Array.isArray(st.foods)) st.foods = [];
      page.appendChild(ui.segmented([{ value: 'burn', label: '칼로리 → 운동 시간' }, { value: 'act', label: '운동 → 소모 칼로리' }], st.mode, v => { st.mode = v; st.save(); draw(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);

      // 내 정보 (기초대사량)
      function profileGroup(onChange) {
        const g = ui.el('<div></div>');
        g.appendChild(ui.el('<div class="section-title">내 정보</div>'));
        const chk = ui.el('<label class="row check-row"><input type="checkbox"' + (st.useBmr ? ' checked' : '') + '/><span class="row-label" style="flex:1">기초대사량 반영<small>성별·나이·키에 따라 개인별로 계산</small></span></label>');
        const sexRow = ui.segRow({ label: '성별', options: [{ value: 'm', label: '남성' }, { value: 'f', label: '여성' }], value: st.sex, onChange: v => { st.sex = v; st.save(); onChange(); } });
        const ageRow = ui.numberRow({ label: '나이', unit: '세', value: st.age, decimals: 0, maxDigits: 3, onChange: v => { st.age = v; st.save(); onChange(); } });
        const hRow = ui.numberRow({ label: '키', unit: 'cm', value: st.height, decimals: 1, maxDigits: 3, onChange: v => { st.height = v; st.save(); onChange(); } });
        const wRow = ui.numberRow({ label: '체중', unit: 'kg', value: st.weight, decimals: 1, maxDigits: 3, onChange: v => { st.weight = v; st.save(); onChange(); } });
        const sync = () => [sexRow, ageRow, hRow].forEach(r => r.classList.toggle('hidden', !st.useBmr));
        chk.querySelector('input').onchange = e => { st.useBmr = e.target.checked; st.save(); sync(); onChange(); };
        sync();
        g.appendChild(ui.group([chk, sexRow, ageRow, hRow, wRow]));
        return g;
      }

      function draw() {
        box.innerHTML = '';
        const res = ui.el('<div></div>');
        if (st.mode === 'burn') {
          const kRow = ui.numberRow({ label: '칼로리', unit: 'kcal', value: st.kcal, decimals: 0, maxDigits: 5, onChange: v => {
            st.kcal = v; if (st.foods.length) { st.foods = []; drawCart(); } st.save(); calc();
          } });
          const g = ui.group([kRow]);
          const cart = ui.el('<div class="food-cart"></div>');
          g.appendChild(cart);
          g.appendChild(ui.el('<div class="footnote" style="margin:0 16px 6px">음식을 누르면 최대 3개까지 칼로리가 더해져요 · <b>＋</b> 직접 입력</div>'));
          const foods = ui.chips(FOODS.map(f => ({ label: f.n, value: f })), f => addFood({ n: f.n, k: f.k }));
          const plus = ui.el('<button type="button" class="chip add" aria-label="음식 직접 추가">＋</button>');
          plus.onclick = customFood;
          foods.appendChild(plus);
          g.appendChild(foods);
          box.appendChild(g);

          function addFood(f) {
            if (st.foods.length >= 3) { ui.toast('음식은 최대 3개까지 더할 수 있어요'); return; }
            st.foods.push(f); syncKcal();
          }
          function syncKcal() {
            st.kcal = st.foods.reduce((a, b) => a + b.k, 0) || st.kcal;
            st.save(); kRow.input.setNumber(st.kcal); drawCart(); calc();
          }
          function drawCart() {
            cart.innerHTML = '';
            cart.style.display = st.foods.length ? '' : 'none';
            st.foods.forEach((f, i) => {
              const it = ui.el('<div class="food-item"><span>' + ui.esc(f.n) + '</span><b>' + F.fmt(f.k, 0) + 'kcal</b>' +
                '<button type="button" class="row-del" aria-label="빼기">' + LC.icon('close', { sw: 2.4 }) + '</button></div>');
              it.querySelector('button').onclick = () => { st.foods.splice(i, 1); if (!st.foods.length) { st.save(); drawCart(); calc(); } else syncKcal(); };
              cart.appendChild(it);
            });
            if (st.foods.length) cart.insertAdjacentHTML('beforeend', '<div class="food-total"><span>' + st.foods.length + ' / 3개 선택</span><span>합계 <b>' + F.fmt(st.foods.reduce((a, b) => a + b.k, 0), 0) + 'kcal</b></span></div>');
          }
          function customFood() {
            if (st.foods.length >= 3) { ui.toast('음식은 최대 3개까지 더할 수 있어요'); return; }
            const w = ui.el('<div></div>');
            const nameRow = ui.el('<div class="row"><input class="text-input" maxlength="20" placeholder="음식 이름 (예: 떡볶이 1인분)"/></div>');
            const kr = ui.numberRow({ label: '칼로리', unit: 'kcal', value: '', decimals: 0, maxDigits: 5 });
            w.appendChild(ui.group([nameRow, kr]));
            ui.sheet({ title: '음식 직접 추가', content: w, left: { label: '취소' }, right: { label: '추가', onClick: () => {
              const k = F.parseNum(kr.input.value);
              if (!(k > 0)) { ui.toast('칼로리를 입력하세요'); return false; }
              addFood({ n: nameRow.querySelector('input').value.trim() || '직접 입력', k: k });
            } } });
            setTimeout(() => nameRow.querySelector('input').focus(), 350);
          }
          drawCart();
        } else {
          const sel = ui.el('<div class="row"><span class="row-label">운동</span><div class="field"><select aria-label="운동 종류">' +
            ACTS.map(a => '<option value="' + a.id + '">' + a.e + ' ' + a.n + ' (' + a.d + ')</option>').join('') + '</select></div></div>');
          const s = sel.querySelector('select'); s.value = st.act;
          s.onchange = () => { st.act = s.value; st.save(); calc(); };
          const mRow = ui.numberRow({ label: '운동 시간', unit: '분', value: st.min, decimals: 0, maxDigits: 4, onChange: v => { st.min = v; st.save(); calc(); } });
          const g = ui.group([sel, mRow]);
          g.appendChild(ui.chips([10, 20, 30, 45, 60, 90, 120].map(v => ({ label: v + '분', value: v })), v => { st.min = v; st.save(); mRow.input.setNumber(v); calc(); }));
          box.appendChild(g);
        }
        box.appendChild(profileGroup(calc));
        box.appendChild(res);
        box.appendChild(ui.infoBanner('계산 기준 · 운동별 강도(MET)', info));

        function calc() {
          const w = F.parseNum(st.weight);
          const card = t => '<div class="result-card"><div class="result-empty">' + t + '</div></div>';
          if (!(w >= 20 && w <= 300)) { res.innerHTML = card('체중을 입력하세요 (20~300kg)'); return; }
          const B = bmr(st);
          if (st.useBmr && !(B > 0) ) { res.innerHTML = card('기초대사량 계산을 위해 나이와 키를 입력하세요'); return; }
          const pm = a => perMinFor(a.met, st);
          const bmrLine = st.useBmr
            ? '<div class="result-sub" style="margin-top:10px">내 기초대사량 하루 ' + F.fmt(Math.round(B), 0) + 'kcal (시간당 약 ' + F.fmt(B / 24, 0) + 'kcal) · 기초대사 소모분 제외</div>'
            : '<div class="result-sub" style="margin-top:10px">체중만 반영한 일반 공식 · 기초대사량 미반영</div>';
          if (st.mode === 'burn') {
            const k = F.parseNum(st.kcal);
            if (!(k > 0)) { res.innerHTML = card('칼로리를 입력하세요'); return; }
            const main = MAIN.map(id => ACTS.find(a => a.id === id));
            const walk = ACTS[0], wm = k / pm(walk);
            const what = st.foods.length ? st.foods.map(f => ui.esc(f.n)).join(' + ') + ' (' + F.fmt(k, 0) + 'kcal)' : F.fmt(k, 0) + 'kcal';
            res.innerHTML = '<div class="result-card"><div class="result-label">' + what + '를 태우려면</div>' +
              '<div class="quote-stats" style="border-top:0;margin-top:8px;padding-top:0">' +
              main.map(a => '<div>' + a.e + ' ' + a.n + '<b style="font-size:20px">' + dur(k / pm(a)) + '</b></div>').join('') + '</div>' +
              '<div class="result-sub" style="margin-top:12px">걷기로는 약 ' + F.fmt(Math.round(wm * walk.spm / 100) * 100, 0) + '걸음 · 약 ' + F.fmt(wm / 60 * 4.8, 1) + 'km</div>' +
              (st.useBmr ? '<div class="result-sub">하루 기초대사량의 ' + F.fmt(k / B * 100, 0) + '%에 해당하는 칼로리예요</div>' : '') +
              bmrLine + '</div>' +
              '<div class="section-title">운동별 필요 시간</div><div class="group">' +
              ACTS.map(a => '<div class="row act-row"><span class="row-label"><span class="act-emoji">' + a.e + '</span><span>' + a.n + '<small class="li-sub" style="display:block;margin-top:1px">' + a.d + '</small></span></span>' +
                '<span class="act-val"><b>' + dur(k / pm(a)) + '</b><small>' + F.fmt(pm(a), 1) + 'kcal/분</small></span></div>').join('') + '</div>';
          } else {
            const a = ACTS.find(x => x.id === st.act) || ACTS[0];
            const m = F.parseNum(st.min);
            if (!(m > 0)) { res.innerHTML = card('운동 시간을 입력하세요'); return; }
            const k = pm(a) * m;
            const eq = [FOODS[0], FOODS[1], FOODS[10], FOODS[9], FOODS[13]];
            res.innerHTML = '<div class="result-card"><div class="result-label">' + a.e + ' ' + a.n + ' ' + dur(m) + '</div>' +
              '<div class="result-main">' + F.fmt(Math.round(k), 0) + '<span class="u">kcal</span></div>' +
              '<div class="result-sub">분당 약 ' + F.fmt(pm(a), 1) + 'kcal · MET ' + a.met + (a.spm ? ' · 약 ' + F.fmt(Math.round(m * a.spm / 100) * 100, 0) + '걸음' : '') + '</div>' +
              bmrLine +
              ui.resultRows(eq.map(f => ({ label: f.n + ' (' + f.k + 'kcal)', value: F.fmt(k / f.k, 1) + '개 분량' }))) + '</div>';
          }
        }
        calc();
      }
      draw();
    }
  });
})();
