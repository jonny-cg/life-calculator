/* BMI 계산기 (대한비만학회 2022 기준) */
(function () {
  const F = LC.F, ui = LC.ui;

  function info() {
    const html = '<div class="table-wrap"><table class="table"><thead><tr><th>분류</th><th>BMI (kg/㎡)</th></tr></thead><tbody>' +
      F.BMI_LEVELS.map((l, i) => {
        const from = i ? F.BMI_LEVELS[i - 1].max : null;
        const range = !from ? '18.5 미만' : l.max === Infinity ? from + ' 이상' : from + ' ~ ' + (l.max - 0.1).toFixed(1);
        return '<tr><td class="em"><span class="li-dot" style="display:inline-block;background:' + l.color + ';margin-right:8px"></span>' + l.name + '</td><td>' + range + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="footnote">대한비만학회 「비만 진료지침 2022」의 성인 기준입니다. BMI는 근육량·체형을 반영하지 못하므로 참고용으로만 활용하세요. 소아·청소년, 임산부, 근육량이 많은 사람에게는 맞지 않을 수 있습니다.</p>' +
      '<div class="section-title">계산 방법</div><div class="group"><div class="row"><span class="row-value" style="text-align:left;color:var(--text)">BMI = 체중(kg) ÷ 키(m)²<br/><small class="muted">표준체중은 BMI 22 기준으로 계산합니다.</small></span></div></div>';
    ui.sheet({ title: 'BMI 판정 기준', content: html });
  }

  LC.registerTool({
    id: 'bmi', title: 'BMI 계산기', short: 'BMI', icon: 'bmi', color: ['#40C8E0', '#1A9FB8'],
    info: info,
    render(page) {
      const st = ui.toolState('bmi', { height: 170, weight: 65 });
      page.appendChild(ui.group([
        ui.numberRow({ label: '키', unit: 'cm', value: st.height, decimals: 1, maxDigits: 3, onChange: v => { st.height = v; st.save(); calc(); } }),
        ui.numberRow({ label: '몸무게', unit: 'kg', value: st.weight, decimals: 1, maxDigits: 3, onChange: v => { st.weight = v; st.save(); calc(); } })
      ]));
      const res = ui.el('<div class="result-card"></div>');
      page.appendChild(res);
      page.appendChild(ui.infoBanner('BMI 판정 기준 보기', info));

      function calc() {
        const h = F.parseNum(st.height), w = F.parseNum(st.weight);
        if (!(h >= 50 && h <= 250) || !(w >= 10 && w <= 400)) { res.innerHTML = '<div class="result-empty">키(50~250cm)와 몸무게를 입력하세요</div>'; return; }
        const o = F.bmi(h, w);
        const segs = [
          { from: 14, to: 18.5, color: F.BMI_LEVELS[0].color }, { from: 18.5, to: 23, color: F.BMI_LEVELS[1].color },
          { from: 23, to: 25, color: F.BMI_LEVELS[2].color }, { from: 25, to: 30, color: F.BMI_LEVELS[3].color },
          { from: 30, to: 35, color: F.BMI_LEVELS[4].color }, { from: 35, to: 40, color: F.BMI_LEVELS[5].color }
        ];
        let diff = '';
        if (w < o.normalMin) diff = '정상 범위까지 +' + F.fmt(o.normalMin - w, 1) + 'kg';
        else if (w > o.normalMax) diff = '정상 범위까지 −' + F.fmt(w - o.normalMax, 1) + 'kg';
        else diff = '정상 범위 안에 있어요';
        res.innerHTML = '<div class="result-label">나의 BMI</div>' +
          '<div style="display:flex;align-items:center;gap:12px;margin-top:4px"><div class="result-main" style="margin:0">' + F.fmt(o.bmi, 1) + '</div>' +
          '<span class="badge" style="background:' + o.level.color + '">' + o.level.name + '</span></div>' +
          ui.gauge(segs, Math.min(40, Math.max(14, o.bmi)), [18.5, 23, 25, 30, 35]) +
          ui.resultRows([
            { label: '정상 체중 범위', value: F.fmt(o.normalMin, 1) + ' ~ ' + F.fmt(o.normalMax, 1) + ' kg' },
            { label: '표준 체중 (BMI 22)', value: F.fmt(o.standard, 1) + ' kg' },
            { label: '정상 범위와 차이', value: diff, cls: 'accent' }
          ]);
      }
      calc();
    }
  });
})();
