/* 속도 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  const REF = [
    ['걷기', 4.5], ['빠르게 걷기', 6], ['조깅', 8], ['달리기', 12], ['마라톤 세계기록', 21.1],
    ['자전거', 20], ['시내 주행', 50], ['고속도로', 100], ['KTX', 300], ['여객기 순항', 900], ['음속 (마하 1)', F.MACH_KMH]
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

  LC.registerTool({
    id: 'speed', title: '속도 계산기', short: '속도', icon: 'speed', color: ['#C87BFF', '#9B3FD6'],
    info: info,
    render(page) {
      const st = ui.toolState('speed', { value: 100, unit: 'kmh' });
      const pst = ui.toolState('pace', { mode: 'k2p', kmh: 10, min: 6, sec: 0 });
      LC.buildConverter(page, { units: F.SPEED_UNITS, state: st });

      page.appendChild(ui.el('<div class="section-title big">시속 ↔ 1km 이동 시간</div>'));
      page.appendChild(ui.segmented([{ value: 'k2p', label: '시속 → 1km 시간' }, { value: 'p2k', label: '1km 시간 → 시속' }], pst.mode, v => { pst.mode = v; pst.save(); draw(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);
      page.appendChild(ui.infoBanner('걷기·달리기·KTX 등 속도 참고표', info));

      function draw() {
        box.innerHTML = '';
        const res = ui.el('<div class="result-card"></div>');
        if (pst.mode === 'k2p') {
          box.appendChild(ui.group([ui.numberRow({ label: '시속', unit: 'km/h', value: pst.kmh, decimals: 2, maxDigits: 6, onChange: v => { pst.kmh = v; pst.save(); calc(); } })]));
        } else {
          box.appendChild(ui.group([
            ui.numberRow({ label: '1km 이동', unit: '분', value: pst.min, decimals: 0, maxDigits: 4, onChange: v => { pst.min = v; pst.save(); calc(); } }),
            ui.numberRow({ label: '', unit: '초', value: pst.sec, decimals: 0, maxDigits: 2, onChange: v => { pst.sec = v; pst.save(); calc(); } })
          ]));
        }
        box.appendChild(res);
        function calc() {
          if (pst.mode === 'k2p') {
            const k = F.parseNum(pst.kmh);
            if (!(k > 0)) { res.innerHTML = '<div class="result-empty">시속을 입력하세요</div>'; return; }
            const sec = F.paceFromKmh(k);
            res.innerHTML = '<div class="result-label">시속 ' + F.fmt(k, 2) + 'km 로 1km 이동 시간</div>' +
              '<div class="result-main" style="font-size:30px">' + F.mmss(sec) + '</div>' +
              ui.resultRows([
                { label: '100m 이동', value: F.mmss(sec / 10) },
                { label: '5km 이동', value: F.mmss(sec * 5) },
                { label: '10km 이동', value: F.mmss(sec * 10) },
                { label: '하프 마라톤 (21.0975km)', value: F.mmss(sec * 21.0975) },
                { label: '풀 마라톤 (42.195km)', value: F.mmss(sec * 42.195) }
              ]);
          } else {
            const sec = (F.parseNum(pst.min) || 0) * 60 + (F.parseNum(pst.sec) || 0);
            if (!(sec > 0)) { res.innerHTML = '<div class="result-empty">1km 이동 시간을 입력하세요</div>'; return; }
            const k = F.kmhFromPace(sec);
            res.innerHTML = '<div class="result-label">1km 를 ' + F.mmss(sec) + '에 이동하면</div>' +
              '<div class="result-main">시속 ' + F.fmt(k, 2) + '<span class="u">km/h</span></div>' +
              ui.resultRows([
                { label: '초속', value: F.fmt(k / 3.6, 2) + ' m/s' },
                { label: '마일', value: F.fmt(k / 1.609344, 2) + ' mph' },
                { label: '10km 완주', value: F.mmss(sec * 10) }
              ]);
          }
        }
        calc();
      }
      draw();
    }
  });
})();
