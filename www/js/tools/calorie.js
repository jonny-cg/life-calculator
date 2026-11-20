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
  const perMin = (met, kg) => met * 3.5 * kg / 200;
  function dur(min) {
    if (!isFinite(min)) return '-';
    min = Math.round(min);
    if (min < 60) return min + '분';
    return Math.floor(min / 60) + '시간' + (min % 60 ? ' ' + (min % 60) + '분' : '');
  }

  function info() {
    ui.sheet({
      title: '칼로리 계산 기준', content:
        '<div class="group"><div class="row"><span class="row-value" style="text-align:left;color:var(--text);line-height:1.6">소모 칼로리(kcal/분) = MET × 3.5 × 체중(kg) ÷ 200<br/><small class="muted">MET(대사당량)은 가만히 앉아 있을 때를 1로 본 운동 강도입니다.</small></span></div></div>' +
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
      const st = ui.toolState('calorie', { mode: 'burn', kcal: 500, weight: 65, act: 'run', min: 30 });
      page.appendChild(ui.segmented([{ value: 'burn', label: '칼로리 → 운동 시간' }, { value: 'act', label: '운동 → 소모 칼로리' }], st.mode, v => { st.mode = v; st.save(); draw(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);

      function draw() {
        box.innerHTML = '';
        const weightRow = ui.numberRow({ label: '내 체중', unit: 'kg', value: st.weight, decimals: 1, maxDigits: 3, onChange: v => { st.weight = v; st.save(); calc(); } });
        const res = ui.el('<div></div>');
        if (st.mode === 'burn') {
          const kRow = ui.numberRow({ label: '칼로리', unit: 'kcal', value: st.kcal, decimals: 0, maxDigits: 5, onChange: v => { st.kcal = v; st.save(); calc(); } });
          const g = ui.group([kRow]);
          g.appendChild(ui.el('<div class="footnote" style="margin:0 16px 6px">음식을 고르면 대략의 칼로리가 입력돼요</div>'));
          const foods = ui.chips(FOODS.map(f => ({ label: f.n, value: f.k })), (v, b) => {
            st.kcal = v; st.save(); kRow.input.setNumber(v); calc();
            foods.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
          });
          g.appendChild(foods);
          box.appendChild(g);
          box.appendChild(ui.group([weightRow]));
        } else {
          const sel = ui.el('<div class="row"><span class="row-label">운동</span><div class="field"><select aria-label="운동 종류">' +
            ACTS.map(a => '<option value="' + a.id + '">' + a.e + ' ' + a.n + ' (' + a.d + ')</option>').join('') + '</select></div></div>');
          const s = sel.querySelector('select'); s.value = st.act;
          s.onchange = () => { st.act = s.value; st.save(); calc(); };
          const mRow = ui.numberRow({ label: '운동 시간', unit: '분', value: st.min, decimals: 0, maxDigits: 4, onChange: v => { st.min = v; st.save(); calc(); } });
          const g = ui.group([sel, mRow]);
          g.appendChild(ui.chips([10, 20, 30, 45, 60, 90, 120].map(v => ({ label: v + '분', value: v })), v => { st.min = v; st.save(); mRow.input.setNumber(v); calc(); }));
          box.appendChild(g);
          box.appendChild(ui.group([weightRow]));
        }
        box.appendChild(res);
        box.appendChild(ui.infoBanner('계산 기준 · 운동별 강도(MET)', info));

        function calc() {
          const w = F.parseNum(st.weight);
          if (!(w >= 20 && w <= 300)) { res.innerHTML = '<div class="result-card"><div class="result-empty">체중을 입력하세요 (20~300kg)</div></div>'; return; }
          if (st.mode === 'burn') {
            const k = F.parseNum(st.kcal);
            if (!(k > 0)) { res.innerHTML = '<div class="result-card"><div class="result-empty">칼로리를 입력하세요</div></div>'; return; }
            const main = MAIN.map(id => ACTS.find(a => a.id === id));
            const walk = ACTS[0], wm = k / perMin(walk.met, w);
            res.innerHTML = '<div class="result-card"><div class="result-label">' + F.fmt(k, 0) + 'kcal를 태우려면 (체중 ' + F.fmt(w, 1) + 'kg)</div>' +
              '<div class="quote-stats" style="border-top:0;margin-top:8px;padding-top:0">' +
              main.map(a => '<div>' + a.e + ' ' + a.n + '<b style="font-size:20px">' + dur(k / perMin(a.met, w)) + '</b></div>').join('') + '</div>' +
              '<div class="result-sub" style="margin-top:12px">걷기로는 약 ' + F.fmt(Math.round(wm * walk.spm / 100) * 100, 0) + '걸음 · 약 ' + F.fmt(wm / 60 * 4.8, 1) + 'km</div></div>' +
              '<div class="section-title">운동별 필요 시간</div><div class="group">' +
              ACTS.map(a => {
                const m = k / perMin(a.met, w);
                return '<div class="row act-row"><span class="row-label"><span class="act-emoji">' + a.e + '</span><span>' + a.n + '<small class="li-sub" style="display:block;margin-top:1px">' + a.d + '</small></span></span>' +
                  '<span class="act-val"><b>' + dur(m) + '</b><small>' + F.fmt(perMin(a.met, w), 1) + 'kcal/분</small></span></div>';
              }).join('') + '</div>';
          } else {
            const a = ACTS.find(x => x.id === st.act) || ACTS[0];
            const m = F.parseNum(st.min);
            if (!(m > 0)) { res.innerHTML = '<div class="result-card"><div class="result-empty">운동 시간을 입력하세요</div></div>'; return; }
            const k = perMin(a.met, w) * m;
            const eq = [FOODS[0], FOODS[1], FOODS[10], FOODS[9], FOODS[13]];
            res.innerHTML = '<div class="result-card"><div class="result-label">' + a.e + ' ' + a.n + ' ' + dur(m) + ' (체중 ' + F.fmt(w, 1) + 'kg)</div>' +
              '<div class="result-main">' + F.fmt(Math.round(k), 0) + '<span class="u">kcal</span></div>' +
              '<div class="result-sub">분당 약 ' + F.fmt(perMin(a.met, w), 1) + 'kcal · MET ' + a.met + (a.spm ? ' · 약 ' + F.fmt(Math.round(m * a.spm / 100) * 100, 0) + '걸음' : '') + '</div>' +
              ui.resultRows(eq.map(f => ({ label: f.n + ' (' + f.k + 'kcal)', value: F.fmt(k / f.k, 1) + '개 분량' }))) + '</div>';
          }
        }
        calc();
      }
      draw();
    }
  });
})();
