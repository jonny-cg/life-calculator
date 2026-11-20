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
      '<p class="est-note">걷기·달리기 등 예시 속도는 일반적인 평균값입니다.</p><p class="footnote">마하는 해수면·기온 15℃ 기준 음속(340.29m/s)으로 계산합니다. 고도와 기온에 따라 음속은 달라집니다.</p>';
    ui.sheet({ title: '속도 참고표', content: html });
  }

  // 시간 입력 행 (시간 · 분 · 초)
  // opts.seconds === false 이면 시간·분만 입력
  LC.timeRow = function (label, st, key, onChange, opts) {
    const withSec = !(opts && opts.seconds === false);
    const t = st[key] || { h: 0, m: 0, s: 0 };
    if (!withSec) t.s = 0;
    const row = ui.el('<div class="row"><span class="row-label">' + ui.esc(label) + '</span><div class="time-fields' + (withSec ? '' : ' no-sec') + '">' +
      '<input data-k="h" inputmode="numeric" maxlength="3" aria-label="시간"/><span>시간</span>' +
      '<input data-k="m" inputmode="numeric" maxlength="2" aria-label="분"/><span>분</span>' +
      (withSec ? '<input data-k="s" inputmode="numeric" maxlength="2" aria-label="초"/><span>초</span>' : '') + '</div></div>');
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
    row.setSeconds = sec => {
      sec = withSec ? Math.round(sec || 0) : Math.round((sec || 0) / 60) * 60;
      t.h = Math.floor(sec / 3600); t.m = Math.floor(sec % 3600 / 60); t.s = sec % 60;
      st[key] = t;
      row.querySelectorAll('input').forEach(inp => { inp.value = sec ? String(t[inp.dataset.k]) : ''; });
    };
    return row;
  };
  function hms(sec) {
    if (!isFinite(sec) || sec <= 0) return '-';
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return ((h ? h + '시간 ' : '') + (h || m ? m + '분 ' : '') + (s || !(h || m) ? s + '초' : '')).trim();
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
      const pst = ui.toolState('dts', { dist: 10, time: { h: 0, m: 55, s: 0 }, kmh: '', order: ['dist', 'time'] });
      LC.buildConverter(page, { units: F.SPEED_UNITS, state: st });

      page.appendChild(ui.el('<div class="section-sep"></div>'));
      page.appendChild(ui.el('<div class="section-head" style="margin-top:18px"><span style="font-size:20px;font-weight:700;color:var(--text)">거리 · 시간 · 속도</span><button type="button" class="link-btn" data-reset>초기화</button></div>'));
      page.appendChild(ui.el('<p class="footnote" style="margin:-2px 4px 10px">두 가지를 입력하면 나머지 하나가 <b style="color:var(--accent)">자동 계산</b>됩니다.</p>'));

      const distRow = ui.numberRow({ label: '거리', unit: 'km', value: pst.dist, decimals: 4, maxDigits: 5, onChange: v => { pst.dist = v; touch('dist'); } });
      const chips = ui.chips(DIST_CHIPS, v => { pst.dist = v; distRow.input.setNumber(v); touch('dist'); });
      const timeRow = LC.timeRow('시간', pst, 'time', () => touch('time'), { seconds: false });
      const speedRow = ui.numberRow({ label: '속도', unit: 'km/h', value: pst.kmh, decimals: 2, maxDigits: 6, onChange: v => { pst.kmh = v; touch('kmh'); } });
      const g = ui.group([distRow]); g.appendChild(chips); g.appendChild(timeRow); g.appendChild(speedRow);
      page.appendChild(g);
      const res = ui.el('<div class="result-card"></div>');
      page.appendChild(res);
      page.appendChild(ui.infoBanner('걷기·달리기·KTX 등 속도 참고표', info));

      const rows = { dist: distRow, time: timeRow, kmh: speedRow };
      Object.keys(rows).forEach(k => rows[k].querySelector('.row-label').insertAdjacentHTML('beforeend', '<span class="auto-badge">자동</span>'));

      // 마지막으로 입력한 두 값으로 나머지 하나를 계산
      function touch(key) {
        pst.order = [key].concat(pst.order.filter(k => k !== key)).slice(0, 2);
        pst.save(); calc();
      }
      page.querySelector('[data-reset]').onclick = () => {
        pst.dist = ''; pst.kmh = ''; pst.time = { h: 0, m: 0, s: 0 }; pst.order = ['dist', 'time']; pst.save();
        distRow.input.setNumber(''); speedRow.input.setNumber(''); timeRow.setSeconds(0); calc();
      };

      function calc() {
        const target = ['dist', 'time', 'kmh'].find(k => !pst.order.includes(k));
        Object.keys(rows).forEach(k => rows[k].classList.toggle('auto', k === target));
        let d = F.parseNum(pst.dist), sec = timeRow.seconds(), k = F.parseNum(pst.kmh);
        if (target === 'kmh') { k = d > 0 && sec > 0 ? d / (sec / 3600) : NaN; pst.kmh = isFinite(k) ? F.fix(Math.round(k * 100) / 100) : ''; speedRow.input.setNumber(pst.kmh); }
        if (target === 'dist') { d = k > 0 && sec > 0 ? k * sec / 3600 : NaN; pst.dist = isFinite(d) ? F.fix(Math.round(d * 1000) / 1000) : ''; distRow.input.setNumber(pst.dist); }
        if (target === 'time') { sec = d > 0 && k > 0 ? d / k * 3600 : NaN; timeRow.setSeconds(isFinite(sec) ? sec : 0); } // 칸에는 분 단위, 결과에는 초까지
        pst.save();
        if (!(d > 0 && sec > 0 && k > 0)) {
          res.innerHTML = '<div class="result-empty">' + { kmh: '거리와 시간을', dist: '속도와 시간을', time: '거리와 속도를' }[target] + ' 입력하세요</div>';
          return;
        }
        const p = sec / d; // 1km 당 초
        const head = {
          kmh: { l: F.fmt(d, 3) + 'km를 ' + hms(sec) + '에 이동하면', v: '시속 ' + F.fmt(k, 2) + '<span class="u">km/h</span>' },
          dist: { l: '시속 ' + F.fmt(k, 2) + 'km로 ' + hms(sec) + ' 동안', v: F.fmt(d, 2) + '<span class="u">km</span>' },
          time: { l: '시속 ' + F.fmt(k, 2) + 'km로 ' + F.fmt(d, 3) + 'km 이동', v: hms(sec) }
        }[target];
        res.innerHTML = '<div class="result-label">' + head.l + '</div>' +
          '<div class="result-main"' + (target === 'time' ? ' style="font-size:30px"' : '') + '>' + head.v + '</div>' +
          '<div class="quote-stats" style="margin-top:14px">' +
          '<div>1km 페이스<b>' + pace(p) + '</b></div>' +
          '<div>100m<b>' + hms(p / 10) + '</b></div>' +
          '<div>초속<b>' + F.fmt(k / 3.6, 2) + ' m/s</b></div></div>' +
          '<div class="section-title" style="margin:16px 0 0">같은 속도라면</div>' +
          ui.resultRows([
            { label: '5km', value: hms(p * 5) },
            { label: '10km', value: hms(p * 10) },
            { label: '하프 (21.1km)', value: hms(p * 21.0975) },
            { label: '풀코스 (42.195km)', value: hms(p * 42.195) },
            { label: '1시간 동안', value: F.fmt(k, 2) + ' km' }
          ]).replace('result-rows', 'result-rows" style="margin-top:4px;border-top:0') +
          '<p class="est-note">"같은 속도라면" 기록은 처음부터 끝까지 같은 속도를 유지한다고 가정한 예상치입니다. 실제 기록은 체력·코스·날씨에 따라 달라집니다.</p>';
      }
      calc();
    }
  });
})();
