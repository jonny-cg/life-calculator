/* 할인 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;

  LC.registerTool({
    id: 'discount', title: '할인 계산기', short: '할인', icon: 'discount', color: ['#FF5E7E', '#FF2D55'],
    render(page) {
      const st = ui.toolState('discount', { mode: 'price', price: 50000, rate: 20, extra: '', sale: '' });
      const modeSeg = ui.segmented([
        { value: 'price', label: '할인가 계산' }, { value: 'rate', label: '할인율 계산' }
      ], st.mode, v => { st.mode = v; st.save(); draw(); }, 'wide');
      page.appendChild(modeSeg);
      const body = ui.el('<div></div>');
      page.appendChild(body);

      function draw() {
        body.innerHTML = '';
        const res = ui.el('<div class="result-card"></div>');
        const priceRow = ui.numberRow({ label: '정가', unit: '원', value: st.price, decimals: 0, maxDigits: 13, onChange: v => { st.price = v; st.save(); calc(); } });

        if (st.mode === 'price') {
          const rateRow = ui.numberRow({ label: '할인율', unit: '%', value: st.rate, decimals: 2, maxDigits: 3, onChange: v => { st.rate = v; st.save(); calc(); } });
          const extraRow = ui.numberRow({ label: '추가 할인', sub: '중복 할인 (선택)', unit: '%', value: st.extra, decimals: 2, maxDigits: 3, placeholder: '0', onChange: v => { st.extra = v; st.save(); calc(); } });
          const g = ui.group([priceRow, rateRow]);
          g.appendChild(ui.chips([5, 10, 15, 20, 30, 40, 50, 70].map(v => ({ label: v + '%', value: v })), v => {
            st.rate = v; st.save(); rateRow.input.setNumber(v); calc();
          }));
          body.appendChild(g);
          body.appendChild(ui.group([extraRow]));
          body.appendChild(ui.el('<p class="footnote">추가 할인은 1차 할인된 가격에 한 번 더 적용됩니다. (예: 20% + 10% = 총 28% 할인)</p>'));
        } else {
          const saleRow = ui.numberRow({ label: '판매가', sub: '할인 후 가격', unit: '원', value: st.sale, decimals: 0, maxDigits: 13, onChange: v => { st.sale = v; st.save(); calc(); } });
          body.appendChild(ui.group([priceRow, saleRow]));
        }
        body.appendChild(res);

        function calc() {
          const p = F.parseNum(st.price);
          if (!(p > 0)) { res.innerHTML = '<div class="result-empty">정가를 입력하세요</div>'; return; }
          if (st.mode === 'price') {
            const r = F.parseNum(st.rate) || 0, e = F.parseNum(st.extra) || 0;
            if (r > 100 || e > 100) { res.innerHTML = '<div class="result-empty">할인율은 100% 이하로 입력하세요</div>'; return; }
            const d = F.discount(p, r, e);
            res.innerHTML = '<div class="result-label">최종 결제 금액</div>' +
              '<div class="result-main">' + F.fmt(Math.round(d.final), 0) + '<span class="u">원</span></div>' +
              '<div class="result-sub">' + F.koreanAmount(Math.round(d.final)) + '</div>' +
              ui.resultRows([
                { label: '정가', value: F.won(p) },
                e ? { label: '1차 할인가 (' + F.fmt(r, 2) + '%)', value: F.won(d.first) } : null,
                { label: '할인 금액', value: '−' + F.won(d.saved), cls: 'red' },
                { label: '총 할인율', value: F.fmt(d.totalRate, 2) + '%', cls: 'accent' }
              ]);
          } else {
            const s = F.parseNum(st.sale);
            if (!(s >= 0)) { res.innerHTML = '<div class="result-empty">판매가를 입력하세요</div>'; return; }
            const d = F.discountRate(p, s);
            res.innerHTML = '<div class="result-label">' + (d.rate >= 0 ? '할인율' : '인상률') + '</div>' +
              '<div class="result-main">' + F.fmt(Math.abs(d.rate), 2) + '<span class="u">%</span></div>' +
              ui.resultRows([
                { label: '정가', value: F.won(p) },
                { label: '판매가', value: F.won(s) },
                { label: d.saved >= 0 ? '할인 금액' : '인상 금액', value: F.won(Math.abs(d.saved)), cls: d.saved >= 0 ? 'red' : '' }
              ]);
          }
        }
        calc();
      }
      draw();
    }
  });
})();
