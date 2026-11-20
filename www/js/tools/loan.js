/* 대출 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  const METHODS = [
    { value: 'equal', label: '원리금균등' },
    { value: 'principal', label: '원금균등' },
    { value: 'bullet', label: '만기일시' }
  ];
  const METHOD_HELP = {
    equal: '매달 같은 금액(원금+이자)을 갚는 방식입니다. 주택담보대출에 가장 많이 쓰입니다.',
    principal: '매달 같은 원금에 남은 잔액의 이자를 더해 갚습니다. 초반 부담이 크지만 총 이자가 가장 적습니다.',
    bullet: '대출 기간 동안 이자만 내고, 만기에 원금을 한 번에 갚습니다. 총 이자가 가장 많습니다.'
  };

  // 숫자 + [년|개월] 단위 선택 행
  LC.periodRow = function (label, st, key, unitKey, onChange, sub) {
    const row = ui.numberRow({ label: label, sub: sub, value: st[key], decimals: 0, maxDigits: 3, onChange: v => { st[key] = v; st.save(); onChange(); } });
    const seg = ui.segmented([{ value: 'y', label: '년' }, { value: 'm', label: '개월' }], st[unitKey], v => { st[unitKey] = v; st.save(); onChange(); });
    seg.style.cssText = 'flex:none;width:104px;margin-left:4px';
    row.querySelector('.field').appendChild(seg);
    return row;
  };
  const months = (v, u) => { const n = F.parseNum(v); return isNaN(n) ? NaN : (u === 'y' ? n * 12 : n); };

  LC.amountRow = function (label, st, key, onChange, sub) {
    const row = ui.numberRow({ label: label, sub: sub, unit: '원', value: st[key], decimals: 0, maxDigits: 13, onChange: v => { st[key] = v; st.save(); hint(); onChange(); } });
    const h = ui.el('<div class="field-hint"></div>');
    function hint() { h.textContent = F.koreanAmount(F.parseNum(st[key]) || 0); }
    hint();
    const frag = [row, h];
    frag.setValue = v => { st[key] = v; st.save(); row.input.setNumber(v); hint(); onChange(); };
    return frag;
  };

  function schedule(result) {
    const rows = result.rows;
    const html = '<div class="table-wrap"><table class="table"><thead><tr><th>회차</th><th>상환금</th><th>원금</th><th>이자</th><th>잔액</th></tr></thead><tbody>' +
      rows.map(r => '<tr' + (r.phase === 'grace' ? ' style="color:var(--text-2)"' : '') + '><td>' + r.n + (r.phase === 'grace' ? ' <small>거치</small>' : '') + '</td>' +
        '<td class="em">' + F.fmt(Math.round(r.payment), 0) + '</td><td>' + F.fmt(Math.round(r.principal), 0) + '</td>' +
        '<td>' + F.fmt(Math.round(r.interest), 0) + '</td><td>' + F.fmt(Math.round(r.balance), 0) + '</td></tr>').join('') +
      '</tbody></table></div><p class="footnote">단위: 원 · 원 미만 반올림으로 합계와 약간 차이가 날 수 있습니다.</p>';
    ui.sheet({ title: '월별 상환 스케줄', content: html });
  }

  LC.registerTool({
    id: 'loan', title: '대출 계산기', short: '대출', icon: 'loan', color: ['#3D9BFF', '#0066E0'],
    render(page) {
      const st = ui.toolState('loan', { method: 'equal', amount: 100000000, rate: 4.5, period: 30, periodUnit: 'y', grace: 0, graceUnit: 'y' });

      page.appendChild(ui.segmented(METHODS, st.method, v => { st.method = v; st.save(); help.textContent = METHOD_HELP[v]; graceRow.classList.toggle('hidden', v === 'bullet'); calc(); }, 'wide'));
      const help = ui.el('<p class="footnote" style="margin:-6px 4px 14px">' + METHOD_HELP[st.method] + '</p>');
      page.appendChild(help);

      const amt = LC.amountRow('대출금액', st, 'amount', calc);
      const g = ui.group([amt[0], amt[1]]);
      g.appendChild(ui.chips([
        { label: '+100만', value: 1e6 }, { label: '+1,000만', value: 1e7 }, { label: '+1억', value: 1e8 }, { label: '초기화', value: 0 }
      ], v => amt.setValue(v ? (F.parseNum(st.amount) || 0) + v : '')));
      page.appendChild(g);

      const graceRow = LC.periodRow('거치기간', st, 'grace', 'graceUnit', calc, '이자만 납부');
      page.appendChild(ui.group([
        ui.numberRow({ label: '연 이자율', unit: '%', value: st.rate, decimals: 3, maxDigits: 2, onChange: v => { st.rate = v; st.save(); calc(); } }),
        LC.periodRow('대출기간', st, 'period', 'periodUnit', calc),
        graceRow
      ]));
      graceRow.classList.toggle('hidden', st.method === 'bullet');
      page.appendChild(ui.el('<p class="footnote">거치기간은 대출기간에 포함됩니다. (예: 30년 중 거치 1년 → 29년간 원금 상환)</p>'));

      const res = ui.el('<div class="result-card"></div>');
      page.appendChild(res);
      const btn = ui.el('<button class="btn secondary mt16">월별 상환 스케줄 보기</button>');
      page.appendChild(btn);
      let last = null;
      btn.onclick = () => last && schedule(last);

      function calc() {
        const P = F.parseNum(st.amount), r = F.parseNum(st.rate);
        const n = months(st.period, st.periodUnit), gm = months(st.grace, st.graceUnit) || 0;
        btn.classList.add('hidden'); last = null;
        if (!(P > 0) || !(r >= 0) || !(n >= 1)) { res.innerHTML = '<div class="result-empty">대출금액, 이자율, 기간을 입력하세요</div>'; return; }
        if (n > 600) { res.innerHTML = '<div class="result-empty">대출기간은 50년(600개월) 이하로 입력하세요</div>'; return; }
        if (st.method !== 'bullet' && gm >= n) { res.innerHTML = '<div class="result-empty">거치기간은 대출기간보다 짧아야 해요</div>'; return; }
        const o = F.loan({ principal: P, rate: r, months: n, grace: gm, method: st.method });
        last = o; btn.classList.remove('hidden');
        let mainLabel, mainVal, extra = [];
        if (st.method === 'equal') {
          mainLabel = '매월 상환금' + (o.graceMonths ? ' (거치 후)' : '');
          mainVal = o.firstPayment;
          extra.push({ label: '첫 달 이자', value: F.won(o.firstInterest) });
        } else if (st.method === 'principal') {
          mainLabel = '첫 달 상환금' + (o.graceMonths ? ' (거치 후)' : '');
          mainVal = o.firstPayment;
          extra.push({ label: '마지막 달 상환금', value: F.won(o.lastPayment) });
          extra.push({ label: '매월 원금', value: F.won(P / (n - o.graceMonths)) });
        } else {
          mainLabel = '매월 이자';
          mainVal = o.rows[0].interest;
          extra.push({ label: '만기 상환금 (원금+이자)', value: F.won(o.lastPayment) });
        }
        if (o.graceMonths) extra.unshift({ label: '거치기간 월 이자 (' + o.graceMonths + '개월)', value: F.won(o.graceInterest) });
        const pr = P / o.totalPayment * 100;
        res.innerHTML = '<div class="result-label">' + mainLabel + '</div>' +
          '<div class="result-main">' + F.fmt(Math.round(mainVal), 0) + '<span class="u">원</span></div>' +
          '<div class="result-sub">' + F.koreanAmount(Math.round(mainVal)) + '</div>' +
          ui.resultRows(extra.concat([
            { label: '총 대출이자', value: F.won(o.totalInterest), cls: 'red' },
            { label: '총 상환금액', value: F.won(o.totalPayment), cls: 'accent' },
            { label: '상환 횟수', value: n + '회' }
          ])) +
          '<div class="ratio"><i style="width:' + pr + '%;background:var(--accent)"></i><i style="width:' + (100 - pr) + '%;background:var(--red)"></i></div>' +
          '<div class="ratio-legend"><span style="--c:var(--accent)">원금 ' + F.fmt(pr, 1) + '%</span><span style="--c:var(--red)">이자 ' + F.fmt(100 - pr, 1) + '%</span></div>';
      }
      calc();
    }
  });
})();
