/* 나이 계산기 (만 나이 · 세는 나이 · 연 나이 / 나이 → 출생연도) */
(function () {
  const F = LC.F, ui = LC.ui;

  function info() {
    ui.sheet({
      title: '나이 계산 기준', content:
        '<div class="group">' +
        '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px;min-width:84px">만 나이</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">태어난 날 0살, 생일이 지날 때마다 1살씩 늘어납니다. 2023년 6월 28일부터 법령·계약·공문서의 나이는 원칙적으로 만 나이입니다.</span></div>' +
        '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px;min-width:84px">연 나이</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">올해 연도 − 출생 연도. 병역법, 청소년보호법(술·담배 구매 등) 등 일부 법률은 연 나이를 씁니다.</span></div>' +
        '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px;min-width:84px">세는 나이</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">태어나자마자 1살, 매년 1월 1일에 1살씩 늘어나는 한국식 나이입니다. (연 나이 + 1)</span></div>' +
        '</div><p class="footnote">띠는 음력 설을 기준으로 바뀌므로, 1~2월 초에 태어났다면 생년월일을 모두 입력해야 정확한 띠가 나옵니다.</p>'
    });
  }

  function animalOf(y, m, d) {
    // 생년월일을 알면 음력 연도로 띠 계산
    if (m && d && LC.lunar) {
      const l = LC.lunar.solarToLunar(y, m, d);
      if (l) return F.yearGanji(l.year);
    }
    return F.yearGanji(y);
  }

  LC.registerTool({
    id: 'age', title: '나이 계산기', short: '나이', icon: 'age', color: ['#FF8FB1', '#D63384'],
    info: info,
    render(page) {
      const t = F.todayYMD();
      const st = ui.toolState('age', { mode: 'birth', by: 1990, bm: '', bd: '', n: 30, kind: 'man' }, ['mode']);
      page.appendChild(ui.segmented([{ value: 'birth', label: '생년월일 → 나이' }, { value: 'age', label: '나이 → 출생연도' }], st.mode, v => { st.mode = v; st.save(); draw(); }, 'wide'));
      const box = ui.el('<div></div>');
      page.appendChild(box);

      function draw() {
        box.innerHTML = '';
        const res = ui.el('<div class="result-card"></div>');
        if (st.mode === 'birth') {
          box.appendChild(ui.group([
            ui.numberRow({ label: '출생 연도', unit: '년', value: st.by, decimals: 0, comma: false, maxDigits: 4, onChange: v => { st.by = v; st.save(); calc(); } }),
            ui.numberRow({ label: '월', sub: '선택', unit: '월', value: st.bm, placeholder: '-', decimals: 0, maxDigits: 2, onChange: v => { st.bm = v; st.save(); calc(); } }),
            ui.numberRow({ label: '일', sub: '선택', unit: '일', value: st.bd, placeholder: '-', decimals: 0, maxDigits: 2, onChange: v => { st.bd = v; st.save(); calc(); } })
          ]));
          box.appendChild(ui.el('<p class="footnote">월·일을 비워 두면 출생 연도만으로 계산합니다.</p>'));
        } else {
          box.appendChild(ui.group([
            ui.numberRow({ label: '나이', unit: '세', value: st.n, decimals: 0, maxDigits: 3, onChange: v => { st.n = v; st.save(); calc(); } }),
            ui.segRow({ label: '기준', options: [{ value: 'man', label: '만 나이' }, { value: 'korean', label: '세는 나이' }, { value: 'year', label: '연 나이' }], value: st.kind, onChange: v => { st.kind = v; st.save(); calc(); } })
          ]));
        }
        box.appendChild(res);
        box.appendChild(ui.infoBanner('만 나이 · 연 나이 · 세는 나이 차이', info));

        function calc() {
          if (st.mode === 'birth') {
            const by = F.parseNum(st.by), bm = F.parseNum(st.bm), bd = F.parseNum(st.bd);
            if (!(by >= 1900 && by <= t.y)) { res.innerHTML = '<div class="result-empty">출생 연도를 입력하세요 (1900 ~ ' + t.y + ')</div>'; return; }
            const hasMD = bm >= 1 && bd >= 1;
            if ((st.bm !== '' && st.bm !== null && !isNaN(bm) && !(bm >= 1 && bm <= 12)) ||
                (hasMD && bd > F.daysInMonth(by, bm))) { res.innerHTML = '<div class="result-empty">올바른 월·일을 입력하세요</div>'; return; }
            if (hasMD && F.dayNum(by, bm, bd) > F.dayNum(t.y, t.m, t.d)) { res.innerHTML = '<div class="result-empty">오늘 이후 날짜는 계산할 수 없어요</div>'; return; }
            const a = F.age(by, hasMD ? bm : null, hasMD ? bd : null, t);
            const gj = animalOf(by, hasMD ? bm : null, hasMD ? bd : null);
            if (a.exact) {
              res.innerHTML = '<div class="result-label">만 나이 (' + t.y + '.' + t.m + '.' + t.d + ' 기준)</div>' +
                '<div class="result-main">만 ' + a.manAge + '<span class="u">세</span></div>' +
                '<div class="result-sub">' + F.dateLabel({ y: by, m: bm, d: bd }) + ' 출생 · ' + gj.animal + '띠 (' + gj.name + ')</div>' +
                ui.resultRows([
                  { label: '세는 나이 (한국식)', value: a.koreanAge + '세' },
                  { label: '연 나이', value: a.yearAge + '세' },
                  { label: '다음 생일', value: a.daysToBirthday === 0 ? '오늘! 🎂' : F.dateLabel(a.nextBirthday) + ' · D-' + a.daysToBirthday, cls: 'accent' },
                  { label: '태어난 지', value: F.fmt(a.daysLived + 1, 0) + '일째' }
                ]);
            } else {
              res.innerHTML = '<div class="result-label">' + by + '년생 · ' + t.y + '년 기준</div>' +
                '<div class="result-main">만 ' + a.manAgeMin + '~' + a.manAgeMax + '<span class="u">세</span></div>' +
                '<div class="result-sub">올해 생일 전이면 만 ' + a.manAgeMin + '세, 생일이 지났으면 만 ' + a.manAgeMax + '세</div>' +
                ui.resultRows([
                  { label: '세는 나이 (한국식)', value: a.koreanAge + '세' },
                  { label: '연 나이', value: a.yearAge + '세' },
                  { label: '띠', value: gj.animal + '띠 (' + gj.name + ')' }
                ]);
            }
          } else {
            const n = F.parseNum(st.n);
            if (!(n >= 0 && n <= 130)) { res.innerHTML = '<div class="result-empty">나이를 입력하세요</div>'; return; }
            if (st.kind === 'korean' && n < 1) { res.innerHTML = '<div class="result-empty">세는 나이는 1세부터예요</div>'; return; }
            const b = F.birthYearFromAge(n, st.kind, t);
            const label = { man: '만 ' + n + '세', korean: '세는 나이 ' + n + '세', year: '연 나이 ' + n + '세' }[st.kind];
            if (st.kind === 'man') {
              const y1 = b.years[0], y2 = b.years[1];
              res.innerHTML = '<div class="result-label">' + label + '는</div>' +
                '<div class="result-main">' + y1 + '<span class="u">년생</span> <span style="font-size:20px;color:var(--text-2)">또는</span> ' + y2 + '<span class="u">년생</span></div>' +
                '<div class="result-sub">올해 생일이 지났으면 ' + y1 + '년생, 아직 안 지났으면 ' + y2 + '년생</div>' +
                ui.resultRows([
                  { label: '출생일 범위', value: F.dateLabel(b.from, false) + ' ~' },
                  { label: '', value: F.dateLabel(b.to, false) },
                  { label: y1 + '년생', value: F.yearGanji(y1).animal + '띠 · 세는 나이 ' + (t.y - y1 + 1) + '세' },
                  { label: y2 + '년생', value: F.yearGanji(y2).animal + '띠 · 세는 나이 ' + (t.y - y2 + 1) + '세' }
                ]);
            } else {
              const y = b.years[0];
              res.innerHTML = '<div class="result-label">' + label + '는</div>' +
                '<div class="result-main">' + y + '<span class="u">년생</span></div>' +
                '<div class="result-sub">' + F.yearGanji(y).animal + '띠 (' + F.yearGanji(y).name + ')</div>' +
                ui.resultRows([
                  { label: '만 나이', value: '만 ' + Math.max(0, t.y - y - 1) + '세 (생일 전) / 만 ' + (t.y - y) + '세 (생일 후)' },
                  { label: '세는 나이', value: (t.y - y + 1) + '세' },
                  { label: '연 나이', value: (t.y - y) + '세' }
                ]);
            }
          }
        }
        calc();
      }
      draw();
    }
  });
})();
