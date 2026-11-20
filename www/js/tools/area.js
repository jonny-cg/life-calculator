/* 면적 변환 + 공통 단위 변환기 */
(function () {
  const F = LC.F, ui = LC.ui;

  /* 공통 단위 변환 화면 (면적·길이·속도에서 사용) */
  LC.buildConverter = function (page, o) {
    const st = o.state;
    const inputGroup = ui.group([]);
    const row = ui.numberRow({ label: '값 입력', value: st.value, decimals: 8, maxDigits: 15, onChange: v => { st.value = isNaN(v) ? '' : v; st.save(); update(); } });
    const unitTag = ui.el('<span class="unit"></span>');
    row.querySelector('.field').appendChild(unitTag);
    inputGroup.appendChild(row);

    const unitChips = ui.el('<div class="chips" style="padding-top:10px"></div>');
    o.units.forEach(u => {
      const b = ui.el('<button class="chip" data-u="' + u.id + '">' + ui.esc(u.name) + '</button>');
      b.onclick = () => { st.unit = u.id; st.save(); update(); };
      unitChips.appendChild(b);
    });
    inputGroup.appendChild(unitChips);

    const label = ui.el('<div class="section-title">변환 결과 · 눌러서 복사</div>');
    const results = ui.el('<div class="group"></div>');
    page.appendChild(inputGroup);
    page.appendChild(label);
    page.appendChild(results);

    function update() {
      const from = o.units.find(u => u.id === st.unit) || o.units[0];
      unitTag.textContent = from.sym;
      unitChips.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.u === from.id));
      const v = F.parseNum(st.value);
      results.innerHTML = '';
      F.convert(isNaN(v) ? 0 : v, from, o.units).forEach(r => {
        const text = isNaN(v) ? '-' : F.fmtSig(r.value, 10);
        const rr = ui.el('<div class="row conv-row tappable ' + (r.unit.id === from.id ? 'base' : '') + '">' +
          '<span class="row-label">' + ui.esc(r.unit.name) + '</span>' +
          '<span class="row-value">' + text + ' <span class="muted" style="font-weight:500;font-size:14px">' + ui.esc(r.unit.sym) + '</span></span></div>');
        rr.onclick = () => { if (!isNaN(v)) ui.copy(text.replace(/,/g, ''), r.unit.name + ' 값을 '); };
        results.appendChild(rr);
      });
      if (o.onUpdate) o.onUpdate(v, from);
    }
    update();
    return { update, setValue(v, unitId) { st.value = v; if (unitId) st.unit = unitId; st.save(); row.input.setNumber(v); update(); } };
  };

  /* ---------- 면적 ---------- */
  const HOUSING = [
    { ex: 39, supply: '52~56', type: '16~17평형' },
    { ex: 49, supply: '64~69', type: '20~21평형' },
    { ex: 59, supply: '78~85', type: '24~25평형' },
    { ex: 74, supply: '95~102', type: '29~31평형' },
    { ex: 84, supply: '105~115', type: '32~34평형', hl: true, note: '국민평형' },
    { ex: 101, supply: '128~135', type: '39~41평형' },
    { ex: 114, supply: '140~150', type: '43~45평형' },
    { ex: 135, supply: '165~175', type: '50~53평형' }
  ];

  function info() {
    const py = F.PYEONG;
    const html =
      '<div class="result-card" style="margin-top:4px">' +
      '<div class="result-label">기본 환산</div>' +
      '<div class="result-main" style="font-size:24px">1평 = ' + F.fmt(py, 4) + '㎡</div>' +
      '<div class="result-sub">1㎡ = ' + F.fmt(1 / py, 4) + '평 · 간편 계산: ㎡ × 0.3025 = 평</div></div>' +

      '<div class="section-title">아파트 전용면적별 평형 (일반적인 기준)</div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>전용면적</th><th>전용(평)</th><th>공급면적(약)</th><th>통상 평형</th></tr></thead><tbody>' +
      HOUSING.map(h => '<tr class="' + (h.hl ? 'hl' : '') + '"><td class="em">' + h.ex + '㎡' + (h.note ? ' <small class="muted">' + h.note + '</small>' : '') + '</td>' +
        '<td>' + F.fmt(h.ex / py, 1) + '평</td><td>' + h.supply + '㎡</td><td class="em">' + h.type + '</td></tr>').join('') +
      '</tbody></table></div>' +
      '<p class="footnote">공급면적과 평형은 단지·건설사·발코니 구조에 따라 달라질 수 있습니다. 정확한 면적은 분양 공고나 건축물대장을 확인하세요.</p>' +

      '<div class="section-title">면적 용어 정리</div>' +
      '<div class="group">' +
      term('전용면적', '현관 안쪽, 가족이 실제로 사용하는 공간 (방·거실·주방·욕실)') +
      term('주거공용면적', '계단, 복도, 엘리베이터 등 다른 세대와 함께 쓰는 공간') +
      term('공급면적', '전용면적 + 주거공용면적. 흔히 말하는 "OO평형"의 기준') +
      term('계약면적', '공급면적 + 기타공용면적(관리사무소, 주차장, 커뮤니티 등)') +
      term('서비스면적', '발코니 등 면적 산정에서 제외되는 공간 (확장 시 실사용 증가)') +
      '</div>' +
      '<p class="footnote">2007년 7월부터 부동산 공식 거래·광고에는 ㎡ 표기가 의무화되었습니다. 오피스텔은 계약면적 기준으로 표기하는 경우가 많아 전용률이 50~60% 수준으로 낮을 수 있습니다.</p>';
    ui.sheet({ title: '주택 평수 안내', content: html });
  }
  function term(t, d) {
    return '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="min-width:92px;font-weight:600;font-size:15px">' + t + '</span>' +
      '<span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">' + d + '</span></div>';
  }

  LC.registerTool({
    id: 'area', title: '면적 변환', short: '면적', icon: 'area', color: ['#4CD964', '#28A745'],
    info: info,
    render(page) {
      const st = ui.toolState('area', { value: 84, unit: 'm2' });
      LC.buildConverter(page, { units: F.AREA_UNITS, state: st });
      page.insertBefore(ui.infoBanner('국내 주택 평수 · ㎡ 안내', info), page.querySelector('.section-title'));
    }
  });
})();
