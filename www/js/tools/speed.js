/* 속도 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  const REF = [
    ['걷기', 4.5], ['빠르게 걷기', 6], ['조깅', 8], ['달리기', 12], ['마라톤 세계기록', 21.1],
    ['자전거', 20], ['시내 주행', 50], ['고속도로', 100], ['KTX', 300], ['여객기 순항', 900], ['음속 (마하 1)', F.MACH_KMH]
  ];
  const DIST_CHIPS = [
    { label: '1km', value: 1 }, { label: '3km', value: 3 }, { label: '5km', value: 5 }, { label: '10km', value: 10 },
    { label: '하프 21.1km', value: 21.0975 }, { label: '풀코스 42.195km', value: 42.195 }, { label: '100km', value: 100 }
  ];

  function info() {
    const html = '<div class="table-wrap"><table class="table"><thead><tr><th>예시</th><th>시속</th><th>1km 이동</th></tr></thead><tbody>' +
      REF.map(r => '<tr><td>' + r[0] + '</td><td class="em">' + F.fmt(r[1], 1) + ' km/h</td><td>' + F.mmss(F.paceFromKmh(r[1])) + '</td></tr>').join('') +
      '</tbody></table></div>' +
      '<div class="section-title">단위 안내</div><div class="group">' +
      '<div class="row"><span class="row-label">1 mph</span><span class="row-value">1.609344 km/h (마일)</span></div>' +
      '<div class="row"><span class="row-label">1 노트</span><span class="row-value">1.852 km/h (해리/시)</span></div>' +
      '<div class="row"><span class="row-label">마하 1</span><span class="row-value">' + F.fmt(F.MACH_KMH, 1) + ' km/h</span></div>' +
      '<div class="row"><span class="row-label">1 m/s</span><span class="row-value">3.6 km/h</span></div></div>' +
      '<p class="footnote">마하는 해수면·기온 15℃ 기준 음속(340.29m/s)으로 계산합니다. 고도와 기온에 따라 음속은 달라집니다.</p>';
    ui.sheet({ title: '속도 참고표', content: html });
  }

  // 시간 입력 행 (시간 · 분 · 초)
  LC.timeRow = function (label, st, key, onChange) {
    const t = st[key] || { h: 0, m: 0, s: 0 };
    const row = ui.el('<div class="row"><span class="row-label">' + ui.esc(label) + '</span><div class="time-fields">' +
      '<input data-k="h" inputmode="numeric" maxlength="3" aria-label="시간"/><span>시간</span>' +
      '<input data-k="m" inputmode="numeric" maxlength="2" aria-label="분"/><span>분</span>' +
      '<input data-k="s" inputmode="numeric" maxlength="2" aria-label="초"/><span>초</span></div></div>');
    row.querySelectorAll('input').forEach(inp => {
      inp.value = t[inp.dataset.k] ? t[inp.dataset.k] : '';
      inp.placeholder = '0';
      inp.addEventListener('focus', () => setTimeout(() => inp.select(), 0));
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g, '');
        t[inp.dataset.k] = +inp.value || 0;
        st[key] = t; st.save(); onChange();
      });
    });
    row.seconds = () => (t.h || 0) * 3600 + (t.m || 0) * 60 + (t.s || 0);
    return row;
  };
  function hms(sec) {
    if (!isFinite(sec) || sec <= 0) return '-';
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + '시간 ' : '') + (h || m ? m + '분 ' : '') + s + '초';
  }
  function pace(secPerKm) { // 5'30"/km 형식
    if (!isFinite(secPerKm) || secPerKm <= 0) return '-';
    const s = Math.round(secPerKm);
    return Math.floor(s / 60) + '분 ' + String(s % 60).padStart(2, '0') + '초';
  }

  LC.registerTool({
    id: 'speed', title: '속도 계산기', short: '속도', icon: 'speed', color: ['#C87BFF', '#9B3FD6'],
    info: info,
    render(page) {
      const st = ui.toolState('speed', { value: 100, unit: 'kmh' });
      const pst = ui.toolState('pace2', { mode: 'record', kmh: 10, dist: 10, time: { h: 0, m: 55, s: 0 } });
      LC.buildConverter(page, { units: F.SPEED_UNITS, state: st });

      page.appendChild(ui.el('<div class="section-title big">거리 · 시간 · 속도 계산</div>'));
      page.appendChild(ui.segmented([
        { value: 'record', label: '거리·시간 → 속도' },
        { value: 'time', label: '속도·거리 → 시간' }
      ], pst.mode, v => { pst.mode = v; pst.save(); draw(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);
      page.appendChild(ui.infoBanner('걷기·달리기·KTX 등 속도 참고표', info));

      function draw() {
        box.innerHTML = '';
        const res = ui.el('<div class="result-card"></div>');
        const distRow = ui.numberRow({ label: '거리', unit: 'km', value: pst.dist, decimals: 4, maxDigits: 5, onChange: v => { pst.dist = v; pst.save(); calc(); } });
        const chips = ui.chips(DIST_CHIPS, v => { pst.dist = v; pst.save(); distRow.input.setNumber(v); calc(); });
        let timeRow = null;
        if (pst.mode === 'record') {
          timeRow = LC.timeRow('걸린 시간', pst, 'time', calc);
          const g = ui.group([distRow]); g.appendChild(chips); g.appendChild(timeRow);
          box.appendChild(g);
          box.appendChild(ui.el('<p class="footnote">예) 10km를 55분에 뛰었다 → 거리 10km, 걸린 시간 0시간 55분 0초</p>'));
        } else {
          const g = ui.group([ui.numberRow({ label: '시속', unit: 'km/h', value: pst.kmh, decimals: 2, maxDigits: 6, onChange: v => { pst.kmh = v; pst.save(); calc(); } }), distRow]);
          g.appendChild(chips);
          box.appendChild(g);
        }
        box.appendChild(res);

        function calc() {
          const d = F.parseNum(pst.dist);
          if (!(d > 0)) { res.innerHTML = '<div class="result-empty">거리를 입력하세요</div>'; return; }
          if (pst.mode === 'record') {
            const sec = timeRow.seconds();
            if (!(sec > 0)) { res.innerHTML = '<div class="result-empty">걸린 시간을 입력하세요</div>'; return; }
            const kmh = d / (sec / 3600), p = sec / d;
            res.innerHTML = '<div class="result-label">' + F.fmt(d, 3) + 'km를 ' + hms(sec) + '에 이동</div>' +
              '<div class="result-main">시속 ' + F.fmt(kmh, 2) + '<span class="u">km/h</span></div>' +
              '<div class="result-sub">1km 평균 ' + pace(p) + ' (페이스)</div>' +
              ui.resultRows([
                { label: '1km 페이스', value: pace(p) + ' /km', cls: 'accent' },
                { label: '100m 평균', value: hms(p / 10) },
                { label: '초속 · 마일', value: F.fmt(kmh / 3.6, 2) + ' m/s · ' + F.fmt(kmh / 1.609344, 2) + ' mph' },
                { label: '같은 속도로 5km', value: hms(p * 5) },
                { label: '같은 속도로 10km', value: hms(p * 10) },
                { label: '같은 속도로 하프', value: hms(p * 21.0975) },
                { label: '같은 속도로 풀코스', value: hms(p * 42.195) }
              ]);
          } else {
            const k = F.parseNum(pst.kmh);
            if (!(k > 0)) { res.innerHTML = '<div class="result-empty">시속을 입력하세요</div>'; return; }
            const sec = d / k * 3600;
            res.innerHTML = '<div class="result-label">시속 ' + F.fmt(k, 2) + 'km로 ' + F.fmt(d, 3) + 'km 이동</div>' +
              '<div class="result-main" style="font-size:30px">' + hms(sec) + '</div>' +
              '<div class="result-sub">약 ' + F.fmt(sec / 3600, 2) + '시간 · ' + F.fmt(sec / 60, 1) + '분</div>' +
              ui.resultRows([
                { label: '1km 페이스', value: pace(3600 / k) + ' /km', cls: 'accent' },
                { label: '100m 이동', value: hms(360 / k) },
                { label: '1시간 동안 이동', value: F.fmt(k, 2) + ' km' }
              ]);
          }
        }
        calc();
      }
      draw();
    }
  });
})();
