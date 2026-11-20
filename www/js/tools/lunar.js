/* 음력 날짜 계산기 (한국천문연구원 기준 데이터: korean-lunar-calendar, 1000~2050년) */
(function () {
  const F = LC.F, ui = LC.ui;
  const ANIMALS = { '자': '쥐', '축': '소', '인': '호랑이', '묘': '토끼', '진': '용', '사': '뱀', '오': '말', '미': '양', '신': '원숭이', '유': '닭', '술': '개', '해': '돼지' };
  const MAX_YEAR = 2050;

  function cal() { return new KoreanLunarCalendar(); }
  function solarToLunar(y, m, d) {
    const c = cal();
    if (!c.setSolarDate(y, m, d)) return null;
    return Object.assign({}, c.getLunarCalendar(), { gapja: c.getKoreanGapja() });
  }
  function lunarToSolar(y, m, d, leap) {
    const c = cal();
    if (!c.setLunarDate(y, m, d, !!leap)) return null;
    const s = c.getSolarCalendar();
    // 라이브러리는 존재하지 않는 윤달을 평달로 처리할 수 있으므로 역변환으로 검증
    const back = solarToLunar(s.year, s.month, s.day);
    if (!back || back.month !== m || back.day !== d || !!back.intercalation !== !!leap) return null;
    return { y: s.year, m: s.month, d: s.day };
  }
  function lunarLabel(l) { return '음력 ' + l.year + '년 ' + (l.intercalation ? '윤' : '') + l.month + '월 ' + l.day + '일'; }
  function animal(gapja) { const ch = gapja.year.charAt(1); return ANIMALS[ch] ? ANIMALS[ch] + '띠' : ''; }
  function ddayText(o) {
    const t = F.todayYMD();
    const left = F.dayNum(o.y, o.m, o.d) - F.dayNum(t.y, t.m, t.d);
    return left === 0 ? '오늘' : left > 0 ? 'D-' + F.fmt(left, 0) : F.fmt(-left, 0) + '일 지남';
  }

  LC.lunar = { solarToLunar, lunarToSolar, lunarLabel };

  LC.registerTool({
    id: 'lunar', title: '음력 변환', short: '음력', icon: 'lunar', color: ['#7D7AFF', '#5856D6'],
    render(page) {
      const t = F.todayYMD();
      const st = ui.toolState('lunar', { mode: 'l2s', ly: t.y, lm: 1, ld: 1, leap: false, solar: '' });

      // 오늘
      const today = solarToLunar(t.y, t.m, t.d);
      page.appendChild(ui.el(
        '<div class="result-card" style="margin-top:4px">' +
        '<div class="result-label">오늘 · ' + F.dateLabel(t) + '</div>' +
        '<div class="result-main" style="font-size:30px">' + (today ? lunarLabel(today).replace('음력 ', '음력 ').replace(/^음력 \d+년 /, '음력 ') : '-') + '</div>' +
        (today ? '<div class="result-sub">' + today.gapja.year + ' ' + today.gapja.month + ' ' + today.gapja.day + ' · ' + animal(today.gapja) + '</div>' : '') +
        '</div>'));

      page.appendChild(ui.el('<div class="mt24"></div>'));
      page.appendChild(ui.segmented([{ value: 'l2s', label: '음력 → 양력' }, { value: 's2l', label: '양력 → 음력' }], st.mode, v => { st.mode = v; st.save(); draw(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);

      function draw() {
        box.innerHTML = '';
        const res = ui.el('<div class="result-card"></div>');
        if (st.mode === 'l2s') {
          box.appendChild(ui.group([
            ui.numberRow({ label: '음력 연도', unit: '년', value: st.ly, decimals: 0, comma: false, maxDigits: 4, onChange: v => { st.ly = v; st.save(); calc(); } }),
            ui.numberRow({ label: '월', unit: '월', value: st.lm, decimals: 0, maxDigits: 2, onChange: v => { st.lm = v; st.save(); calc(); } }),
            ui.numberRow({ label: '일', unit: '일', value: st.ld, decimals: 0, maxDigits: 2, onChange: v => { st.ld = v; st.save(); calc(); } }),
            ui.switchRow({ label: '윤달', value: st.leap, onChange: v => { st.leap = v; st.save(); calc(); } })
          ]));
          box.appendChild(res);
          const yearly = ui.el('<div></div>');
          box.appendChild(yearly);
          box.appendChild(ui.el('<p class="footnote">음력 생일·제사·명절 날짜를 해마다 양력으로 확인할 때 사용하세요. 1000년 ~ ' + MAX_YEAR + '년까지 지원합니다.</p>'));

          function calc() {
            const y = F.parseNum(st.ly), m = F.parseNum(st.lm), d = F.parseNum(st.ld);
            yearly.innerHTML = '';
            if (!(y >= 1000 && y <= MAX_YEAR && m >= 1 && m <= 12 && d >= 1 && d <= 30)) {
              res.innerHTML = '<div class="result-empty">음력 날짜를 입력하세요 (1000~' + MAX_YEAR + '년)</div>'; return;
            }
            const s = lunarToSolar(y, m, d, st.leap);
            if (!s) {
              res.innerHTML = '<div class="result-empty">존재하지 않는 음력 날짜입니다.' + (st.leap ? '<br/>' + y + '년에는 윤' + m + '월이 없어요.' : (d === 30 ? '<br/>해당 월은 29일까지 있어요.' : '')) + '</div>';
              return;
            }
            res.innerHTML = '<div class="result-label">음력 ' + y + '년 ' + (st.leap ? '윤' : '') + m + '월 ' + d + '일은</div>' +
              '<div class="result-main" style="font-size:28px">양력 ' + F.dateLabel(s) + '</div>' +
              '<div class="result-sub">오늘 기준 ' + ddayText(s) + '</div>';
            // 해마다의 양력 날짜 (윤달 제외 평달 기준)
            const rows = [];
            for (let yy = t.y; yy <= Math.min(MAX_YEAR, t.y + 9); yy++) {
              let r = lunarToSolar(yy, m, d, false), note = '';
              if (!r && d === 30) { r = lunarToSolar(yy, m, 29, false); note = ' <small class="muted">(29일)</small>'; }
              if (r) rows.push('<div class="row"><span class="row-label" style="font-weight:600">' + yy + '년' + note + '</span><span class="row-value">' + F.dateLabel(r) + '</span>' +
                '<span style="min-width:72px;text-align:right;font-size:13px;color:var(--text-2)">' + ddayText(r) + '</span></div>');
            }
            yearly.innerHTML = '<div class="section-title">해마다 음력 ' + m + '월 ' + d + '일 (양력)</div><div class="group">' + rows.join('') + '</div>';
          }
          calc();
        } else {
          st.solar = st.solar || F.ymdStr(t);
          box.appendChild(ui.group([ui.dateRow({ label: '양력 날짜', value: st.solar, onChange: v => { st.solar = v; st.save(); calc(); } })]));
          box.appendChild(res);
          function calc() {
            const s = F.parseYMD(st.solar);
            const l = s ? solarToLunar(s.y, s.m, s.d) : null;
            if (!l) { res.innerHTML = '<div class="result-empty">1000년 2월 13일 ~ ' + MAX_YEAR + '년 12월 31일 사이 날짜를 선택하세요</div>'; return; }
            res.innerHTML = '<div class="result-label">양력 ' + F.dateLabel(s) + '은</div>' +
              '<div class="result-main" style="font-size:28px">' + lunarLabel(l) + '</div>' +
              '<div class="result-sub">' + l.gapja.year + ' ' + l.gapja.month + ' ' + l.gapja.day + ' · ' + animal(l.gapja) + '</div>';
          }
          calc();
        }
      }
      draw();
    }
  });
})();
