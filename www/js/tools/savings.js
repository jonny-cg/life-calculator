/* 예·적금 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  const TAX = [
    { value: '15.4', label: '일반 15.4%' },
    { value: '9.5', label: '세금우대 9.5%' },
    { value: '0', label: '비과세' }
  ];

  LC.registerTool({
    id: 'savings', title: '예적금 계산기', short: '예적금', icon: 'savings', color: ['#FFB340', '#FF8A00'],
    render(page) {
      const st = ui.toolState('savings', { type: 'installment', compound: 'simple', amount: 500000, rate: 3.5, period: 12, periodUnit: 'm', tax: 15.4 });

      page.appendChild(ui.segmented([{ value: 'installment', label: '적금 (매월 납입)' }, { value: 'deposit', label: '예금 (목돈 예치)' }], st.type, v => {
        st.type = v; st.save(); amtLabel(); calc();
      }, 'wide'));

      const amt = LC.amountRow('', st, 'amount', calc);
      const amtG = ui.group([amt[0], amt[1]]);
      amtG.appendChild(ui.chips([
        { label: '+10만', value: 1e5 }, { label: '+50만', value: 5e5 }, { label: '+100만', value: 1e6 }, { label: '+1,000만', value: 1e7 }, { label: '초기화', value: 0 }
      ], v => amt.setValue(v ? (F.parseNum(st.amount) || 0) + v : '')));
      page.appendChild(amtG);
      function amtLabel() {
        amt[0].querySelector('.row-label').innerHTML = st.type === 'deposit' ? '예치금액' : '월 납입액';
      }
      amtLabel();

      page.appendChild(ui.group([
        ui.numberRow({ label: '연 이자율', unit: '%', value: st.rate, decimals: 3, maxDigits: 2, onChange: v => { st.rate = v; st.save(); calc(); } }),
        LC.periodRow('저축기간', st, 'period', 'periodUnit', calc),
        ui.segRow({ label: '이자 방식', options: [{ value: 'simple', label: '단리' }, { value: 'monthly', label: '월복리' }], value: st.compound, onChange: v => { st.compound = v; st.save(); calc(); } })
      ]));

      // 세율
      const taxRow = ui.numberRow({ label: '이자 소득세', sub: '직접 수정 가능', unit: '%', value: st.tax, decimals: 2, maxDigits: 2, onChange: v => { st.tax = v; st.save(); syncChips(); calc(); } });
      const taxG = ui.group([taxRow]);
      const taxChips = ui.chips(TAX, v => { st.tax = +v; st.save(); taxRow.input.setNumber(+v); syncChips(); calc(); });
      taxG.appendChild(taxChips);
      page.appendChild(taxG);
      function syncChips() {
        taxChips.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('on', +TAX[i].value === F.parseNum(st.tax)));
      }
      syncChips();
      page.appendChild(ui.el('<p class="footnote">일반과세 15.4% (소득세 14% + 지방소득세 1.4%), 세금우대 9.5%, 비과세종합저축 등은 0%입니다. 실제 이자는 은행별 계산 방식(일할 계산 등)에 따라 조금 다를 수 있습니다.</p>'));

      const res = ui.el('<div class="result-card"></div>');
      page.appendChild(res);

      function calc() {
        const A = F.parseNum(st.amount), r = F.parseNum(st.rate);
        const n = st.periodUnit === 'y' ? F.parseNum(st.period) * 12 : F.parseNum(st.period);
        const tax = F.parseNum(st.tax);
        if (!(A > 0) || !(r >= 0) || !(n >= 1)) { res.innerHTML = '<div class="result-empty">금액, 이자율, 기간을 입력하세요</div>'; return; }
        if (n > 600) { res.innerHTML = '<div class="result-empty">저축기간은 50년 이하로 입력하세요</div>'; return; }
        if (!(tax >= 0 && tax <= 100)) { res.innerHTML = '<div class="result-empty">세율을 확인하세요</div>'; return; }
        const o = F.savings({ type: st.type, compound: st.compound, amount: A, rate: r, months: n, taxRate: tax });
        const pr = o.principal / o.total * 100;
        res.innerHTML = '<div class="result-label">세후 만기 수령액</div>' +
          '<div class="result-main">' + F.fmt(o.total, 0) + '<span class="u">원</span></div>' +
          '<div class="result-sub">' + F.koreanAmount(o.total) + '</div>' +
          ui.resultRows([
            { label: '원금 합계' + (st.type === 'installment' ? ' (' + n + '회 납입)' : ''), value: F.won(o.principal) },
            { label: '세전 이자', value: F.won(o.interest) },
            { label: '이자 과세 (' + F.fmt(tax, 2) + '%)', value: '−' + F.won(o.tax), cls: 'red' },
            { label: '세후 이자 소득', value: F.won(o.net), cls: 'accent' },
            { label: '세후 실질 수익률', value: F.fmt(o.net / o.principal * 100, 2) + '%' }
          ]) +
          '<div class="ratio"><i style="width:' + pr + '%;background:var(--orange)"></i><i style="width:' + (100 - pr) + '%;background:var(--green)"></i></div>' +
          '<div class="ratio-legend"><span style="--c:var(--orange)">원금</span><span style="--c:var(--green)">세후 이자</span></div>';
      }
      calc();
    }
  });
})();
