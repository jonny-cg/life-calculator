/* 체지방률 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  const COLORS = ['#5AC8FA', '#30B0C7', '#34C759', '#FFCC00', '#FF3B30'];

  function info() {
    const lv = s => F.FAT_LEVELS[s].map((l, i) => {
      const from = i ? F.FAT_LEVELS[s][i - 1].max : (s === 'm' ? 2 : 10);
      return '<td>' + (l.max === Infinity ? from + '% 이상' : from + ' ~ ' + (l.max - 1) + '%') + '</td>';
    });
    const m = lv('m'), f = lv('f');
    const html = '<div class="table-wrap"><table class="table"><thead><tr><th>분류</th><th>남성</th><th>여성</th></tr></thead><tbody>' +
      F.FAT_LEVELS.m.map((l, i) => '<tr><td class="em"><span class="li-dot" style="display:inline-block;background:' + COLORS[i] + ';margin-right:8px"></span>' + l.name + '</td>' + m[i] + f[i] + '</tr>').join('') +
      '</tbody></table></div><p class="footnote">미국운동협회(ACE)의 체지방률 분류 기준입니다.</p>' +
      '<div class="section-title">계산 방식</div><div class="group">' +
      '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px">간편 추정</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">BMI·나이·성별로 추정하는 Deurenberg 공식입니다. 측정이 필요 없지만 근육량이 많으면 오차가 큽니다.</span></div>' +
      '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px">둘레 측정</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">미 해군(US Navy) 방식으로 목·허리(·엉덩이) 둘레를 이용합니다. 허리는 배꼽 높이(여성은 가장 가는 부분), 엉덩이는 가장 넓은 부분을 잽니다.</span></div></div>' +
      '<p class="footnote">계산값은 추정치이며 인바디(체성분 분석기)나 DEXA 측정 결과와 다를 수 있습니다.</p>';
    ui.sheet({ title: '체지방률 안내', content: html });
  }

  LC.registerTool({
    id: 'bodyfat', title: '체지방 계산기', short: '체지방', icon: 'bodyfat', color: ['#FF8A65', '#F4511E'],
    info: info,
    render(page) {
      const st = ui.toolState('bodyfat', { method: 'simple', sex: 'm', age: 35, height: 170, weight: 65, neck: 37, waist: 82, hip: 95 });
      page.appendChild(ui.segmented([{ value: 'simple', label: '간편 추정 (BMI)' }, { value: 'navy', label: '둘레 측정 (정밀)' }], st.method, v => { st.method = v; st.save(); draw(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);

      function num(label, key, unit, opt) {
        return ui.numberRow(Object.assign({ label: label, unit: unit, value: st[key], decimals: 1, maxDigits: 3, onChange: v => { st[key] = v; st.save(); calc(); } }, opt || {}));
      }
      let res, hipRow;
      function draw() {
        box.innerHTML = '';
        const rows = [ui.segRow({ label: '성별', options: [{ value: 'm', label: '남성' }, { value: 'f', label: '여성' }], value: st.sex, onChange: v => { st.sex = v; st.save(); if (hipRow) hipRow.classList.toggle('hidden', v !== 'f'); calc(); } })];
        if (st.method === 'simple') {
          rows.push(num('나이', 'age', '세', { decimals: 0 }), num('키', 'height', 'cm'), num('몸무게', 'weight', 'kg'));
          box.appendChild(ui.group(rows));
          hipRow = null;
        } else {
          box.appendChild(ui.group(rows.concat([num('키', 'height', 'cm'), num('몸무게', 'weight', 'kg', { sub: '체지방량 계산용' })])));
          hipRow = num('엉덩이 둘레', 'hip', 'cm');
          box.appendChild(ui.el('<div class="section-title">둘레 (cm)</div>'));
          box.appendChild(ui.group([num('목 둘레', 'neck', 'cm'), num('허리 둘레', 'waist', 'cm'), hipRow]));
          hipRow.classList.toggle('hidden', st.sex !== 'f');
        }
        res = ui.el('<div class="result-card"></div>');
        box.appendChild(res);
        box.appendChild(ui.infoBanner('체지방률 기준 · 측정 방법 안내', info));
        calc();
      }

      function calc() {
        const h = F.parseNum(st.height), w = F.parseNum(st.weight);
        let pct;
        if (st.method === 'simple') {
          const age = F.parseNum(st.age);
          if (!(h >= 50) || !(w >= 10) || !(age >= 7 && age <= 120)) { res.innerHTML = '<div class="result-empty">나이(7세 이상), 키, 몸무게를 입력하세요</div>'; return; }
          pct = F.bodyFatBmi(st.sex, age, h, w);
        } else {
          const n = F.parseNum(st.neck), wa = F.parseNum(st.waist), hp = F.parseNum(st.hip);
          if (!(h >= 50) || !(n > 0) || !(wa > 0) || (st.sex === 'f' && !(hp > 0))) { res.innerHTML = '<div class="result-empty">키와 둘레를 입력하세요</div>'; return; }
          pct = F.bodyFatNavy(st.sex, h, n, wa, hp);
          if (!isFinite(pct) || pct <= 0 || pct > 70) { res.innerHTML = '<div class="result-empty">입력한 둘레 값을 확인하세요 (허리 둘레는 목 둘레보다 커야 해요)</div>'; return; }
        }
        pct = Math.max(2, pct);
        const lv = F.fatLevel(st.sex, pct);
        const L = lv.levels, base = st.sex === 'm' ? 2 : 10;
        const segs = L.map((l, i) => ({ from: i ? L[i - 1].max : base, to: l.max === Infinity ? (st.sex === 'm' ? 40 : 48) : l.max, color: COLORS[i] }));
        const hasW = w > 0;
        res.innerHTML = '<div class="result-label">체지방률 (추정)</div>' +
          '<div style="display:flex;align-items:center;gap:12px;margin-top:4px"><div class="result-main" style="margin:0">' + F.fmt(pct, 1) + '<span class="u">%</span></div>' +
          '<span class="badge" style="background:' + COLORS[lv.index] + '">' + lv.name + '</span></div>' +
          ui.gauge(segs, Math.min(segs[segs.length - 1].to, pct), L.slice(0, -1).map(l => l.max)) +
          (hasW ? ui.resultRows([
            { label: '체지방량', value: F.fmt(w * pct / 100, 1) + ' kg' },
            { label: '제지방량 (근육·뼈·수분 등)', value: F.fmt(w * (1 - pct / 100), 1) + ' kg' }
          ]) : '');
      }
      draw();
    }
  });
})();
