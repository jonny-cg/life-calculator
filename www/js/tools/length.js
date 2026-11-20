/* 길이 변환 + 인치(화면 크기) 안내 */
(function () {
  const F = LC.F, ui = LC.ui;

  const RATIOS = [
    { value: '16:9', label: '16:9', w: 16, h: 9 },
    { value: '16:10', label: '16:10', w: 16, h: 10 },
    { value: '21:9', label: '21:9', w: 21, h: 9 },
    { value: '4:3', label: '4:3', w: 4, h: 3 },
    { value: '19.5:9', label: '19.5:9 (스마트폰)', w: 19.5, h: 9 },
    { value: '3:2', label: '3:2', w: 3, h: 2 }
  ];
  const TV = [32, 43, 50, 55, 65, 75, 85, 98];
  const MONITOR = [24, 27, 32];
  const ULTRAWIDE = [29, 34, 40];
  const LAPTOP = [13.3, 14, 15.6, 16, 17.3];
  // 스마트폰 (세로형 19.5:9 기준 — 대부분의 최신 스마트폰 비율)
  const PHONE = [
    { i: 5.4, t: '소형 (미니)' },
    { i: 6.1, t: '일반형' },
    { i: 6.2, t: '일반형' },
    { i: 6.3, t: '일반형 · 프로' },
    { i: 6.5, t: '중대형' },
    { i: 6.7, t: '대형 (플러스)' },
    { i: 6.9, t: '최대형 (맥스·울트라)' }
  ];
  const FOLD = [
    { i: 3.4, t: '플립형 바깥 화면', r: null },
    { i: 6.7, t: '플립형 펼친 화면', r: [22, 9] },
    { i: 6.3, t: '폴더블 바깥 화면', r: [21, 9] },
    { i: 7.6, t: '폴더블 펼친 화면', r: [6, 5] },
    { i: 8.0, t: '폴더블 펼친 화면 (대형)', r: [6, 5] }
  ];
  // 태블릿 (모델별 비율이 달라 대표 비율로 계산)
  const TABLET = [
    { i: 8.3, t: '소형 (iPad mini 등)', r: [3, 2] },
    { i: 10.9, t: '기본형 (10.9~11형)', r: [16, 10] },
    { i: 11, t: '11형 (iPad Air·Pro 11 등)', r: [10, 7] },
    { i: 12.4, t: '대형 (Galaxy Tab S+ 등)', r: [16, 10] },
    { i: 13, t: '대형 (iPad Air·Pro 13 등)', r: [4, 3] },
    { i: 14.6, t: '초대형 (Galaxy Tab S Ultra 등)', r: [16, 10] }
  ];
  const FAN = [12, 14, 16, 18];

  function info() {
    const st = ui.toolState('lengthInfo', { inch: 55, ratio: '16:9' });
    const wrap = ui.el('<div></div>');

    // 인치 계산기
    const calcGroup = ui.group([]);
    const inchRow = ui.numberRow({ label: '화면 크기', unit: '인치', value: st.inch, decimals: 1, maxDigits: 3, onChange: v => { st.inch = v; st.save(); upd(); } });
    calcGroup.appendChild(inchRow);
    calcGroup.appendChild(ui.el('<div class="row" style="min-height:40px;padding-bottom:0"><span class="row-label">화면 비율</span></div>'));
    const ratioChips = ui.chips(RATIOS.map(r => ({ label: r.label, value: r.value })), v => { st.ratio = v; st.save(); syncRatio(); upd(); });
    ratioChips.style.paddingTop = '8px';
    calcGroup.appendChild(ratioChips);
    function syncRatio() { ratioChips.querySelectorAll('.chip').forEach((c, k) => c.classList.toggle('on', RATIOS[k].value === st.ratio)); }
    syncRatio();
    const res = ui.el('<div class="result-card"></div>');
    wrap.appendChild(ui.el('<div class="footnote" style="margin:0 4px 10px">모니터·TV의 인치는 화면 <b>대각선</b> 길이입니다. 1인치 = 2.54cm</div>'));
    wrap.appendChild(calcGroup);
    wrap.appendChild(res);

    function upd() {
      const r = RATIOS.find(x => x.value === st.ratio) || RATIOS[0];
      const v = F.parseNum(st.inch);
      if (!(v > 0)) { res.innerHTML = '<div class="result-empty">인치를 입력하세요</div>'; return; }
      const s = F.screenSize(v, r.w, r.h);
      res.innerHTML = '<div class="result-label">' + F.fmt(v, 1) + '인치 대각선 길이</div>' +
        '<div class="result-main">' + F.fmt(s.diagonal, 1) + '<span class="u">cm</span></div>' +
        '<div class="result-sub">약 ' + F.fmt(s.diagonal / 100, 2) + 'm</div>' +
        ui.resultRows([
          { label: '화면 가로 (' + r.label + ')', value: F.fmt(s.width, 1) + ' cm' },
          { label: '화면 세로', value: F.fmt(s.height, 1) + ' cm' }
        ]);
    }
    upd();

    function table(title, list, ratio, note) {
      const r = ratio ? RATIOS.find(x => x.value === ratio) : null;
      return '<div class="section-title">' + title + '</div><div class="table-wrap"><table class="table"><thead><tr><th>인치</th><th>대각선</th>' +
        (r ? '<th>가로 × 세로 (' + r.label + ')</th>' : '') + '</tr></thead><tbody>' +
        list.map(i => {
          const s = r ? F.screenSize(i, r.w, r.h) : { diagonal: i * 2.54 };
          return '<tr><td class="em">' + i + '″</td><td>' + F.fmt(s.diagonal, 1) + ' cm</td>' +
            (r ? '<td>' + F.fmt(s.width, 1) + ' × ' + F.fmt(s.height, 1) + ' cm</td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>' + (note ? '<p class="footnote">' + note + '</p>' : '');
    }
    function deviceTable(title, list, defRatio, note) {
      return '<div class="section-title">' + title + '</div><div class="table-wrap"><table class="table"><thead><tr><th>인치</th><th>구분</th><th>대각선</th><th>긴 변 × 짧은 변</th></tr></thead><tbody>' +
        list.map(d => {
          const r = d.r === undefined ? defRatio : d.r;
          const s = r ? F.screenSize(d.i, r[0], r[1]) : { diagonal: d.i * 2.54 };
          return '<tr><td class="em">' + d.i + '″</td><td style="text-align:left;white-space:normal;color:var(--text-2);font-size:12.5px">' + d.t + (r ? '<br/><small>' + r[0] + ':' + r[1] + '</small>' : '') + '</td><td>' + F.fmt(s.diagonal, 1) + ' cm</td>' +
            '<td>' + (r ? F.fmt(s.width, 1) + ' × ' + F.fmt(s.height, 1) + ' cm' : '-') + '</td></tr>';
        }).join('') + '</tbody></table></div>' + (note ? '<p class="footnote">' + note + '</p>' : '');
    }
    wrap.insertAdjacentHTML('beforeend',
      table('TV (16:9)', TV, '16:9', '스탠드·베젤을 제외한 화면 기준입니다. 실제 제품 외곽 크기는 조금 더 큽니다.') +
      table('모니터 (16:9)', MONITOR, '16:9') +
      table('울트라와이드 모니터 (21:9)', ULTRAWIDE, '21:9') +
      table('노트북', LAPTOP, null) +
      deviceTable('스마트폰', PHONE, [19.5, 9], '대부분의 최신 스마트폰 비율(19.5:9) 기준입니다. 모서리가 둥근 화면은 실제 표시 영역이 조금 작습니다. 일반형 6.1~6.3″, 대형 6.7″, 최대형 6.9″가 가장 흔합니다.') +
      deviceTable('폴더블 · 플립', FOLD, null, '접는 폰은 모델마다 비율 차이가 커서 대표값으로 계산했습니다.') +
      deviceTable('태블릿', TABLET, null, '태블릿은 제조사별로 비율이 달라 대표 비율로 계산했습니다. 아이패드는 4:3에 가까운 비율, 갤럭시 탭은 16:10이 많습니다.') +
      table('선풍기 (날개 지름)', FAN, null, '선풍기의 인치는 날개(팬) 지름입니다. 14인치 ≈ 35.6cm'));
    ui.sheet({ title: '인치 크기 안내', content: wrap });
  }

  LC.registerTool({
    id: 'length', title: '길이 변환', short: '길이', icon: 'length', color: ['#5AC8FA', '#1E9BE0'],
    info: info,
    render(page) {
      const st = ui.toolState('length', { value: 1, unit: 'm' });
      LC.buildConverter(page, { units: F.LENGTH_UNITS, state: st });
      page.insertBefore(ui.infoBanner('TV·모니터·스마트폰·태블릿 인치 안내', info), page.querySelector('.section-title'));
    }
  });
})();
