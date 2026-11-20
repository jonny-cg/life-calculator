/* 금값 (국제 금·은 시세 환산) */
(function () {
  const F = LC.F, ui = LC.ui;
  const OZ = 31.1034768;   // 1 트로이온스(g)
  const DON = 3.75;        // 1돈(g)
  const UNITS = [{ value: 'g', label: 'g', g: 1 }, { value: 'don', label: '돈', g: DON }, { value: 'oz', label: '온스', g: OZ }];
  const PURITY = [{ value: '24', label: '24K', p: 0.9999 }, { value: '18', label: '18K', p: 0.75 }, { value: '14', label: '14K', p: 0.585 }];

  function shift(dateStr, days) { const d = F.parseYMD(dateStr); return F.ymdStr(F.fromDayNum(F.dayNum(d.y, d.m, d.d) + days)); }
  // 1g 가격(원)
  const krwPerGram = (r, metal) => r.rates.krw / r.rates[metal] / OZ;
  const usdPerOz = (r, metal) => 1 / r.rates[metal];

  LC.registerTool({
    id: 'gold', title: '금값 시세', short: '금값', icon: 'gold', color: ['#F7CE46', '#D69A0B'], refreshable: true,
    render(page) {
      const st = ui.toolState('gold', { vat: false, weight: 1, unit: 'don', purity: '24' });
      let data = null, prev = null;

      const status = ui.el('<div class="status-line"><span>시세 불러오는 중…</span></div>');
      page.appendChild(status);
      const main = ui.el('<div class="quote-card">' +
        '<div class="quote-top"><span class="quote-name">순금 1돈 (3.75g)</span><span class="quote-time" data-vat-label></span></div>' +
        '<div class="quote-price" data-price><span class="skeleton">000,000원</span></div>' +
        '<div class="quote-change" data-change><span class="skeleton">+0,000 (+0.00%)</span></div>' +
        '<div data-chart style="min-height:110px"></div></div>');
      page.appendChild(main);

      const vatRow = ui.switchRow({ label: '부가세 10% 포함', sub: '금을 살 때 가격에 가깝게 표시', value: st.vat, onChange: v => { st.vat = v; st.save(); draw(); } });
      page.appendChild(ui.el('<div class="mt16"></div>'));
      page.appendChild(ui.group([vatRow]));

      page.appendChild(ui.el('<div class="section-title">단위별 금 시세</div>'));
      const table = ui.el('<div class="group"></div>');
      page.appendChild(table);

      page.appendChild(ui.el('<div class="section-title big">금 가격 계산</div>'));
      const wRow = ui.numberRow({ label: '중량', value: st.weight, decimals: 3, maxDigits: 6, onChange: v => { st.weight = v; st.save(); calc(); } });
      const unitSeg = ui.segmented(UNITS, st.unit, v => { st.unit = v; st.save(); calc(); });
      unitSeg.style.cssText = 'flex:none;width:150px;margin-left:4px';
      wRow.querySelector('.field').appendChild(unitSeg);
      page.appendChild(ui.group([wRow, ui.segRow({ label: '순도', options: PURITY, value: st.purity, onChange: v => { st.purity = v; st.save(); calc(); } })]));
      const res = ui.el('<div class="result-card"></div>');
      page.appendChild(res);

      page.appendChild(ui.el('<div class="section-title">은 시세</div>'));
      const silver = ui.el('<div class="group"></div>');
      page.appendChild(silver);
      page.appendChild(ui.el('<p class="est-note">금·은 가격은 국제 시세를 환율로 환산한 참고값이며, 실제 매매 가격과 다릅니다.</p>'));
      page.appendChild(ui.el('<p class="footnote">국제 금·은 시세(하루 1회 갱신)를 원/달러 환율로 환산한 값입니다. 국내 금거래소·금은방 가격은 부가세, 세공비, 매입·매도 수수료에 따라 다릅니다. 18K·14K는 순금 함량 기준 이론가입니다.</p>'));

      const vat = () => st.vat ? 1.1 : 1;
      function row(label, value, sub) {
        return '<div class="row"><span class="row-label">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span><span class="row-value strong num">' + value + '</span></div>';
      }

      function draw() {
        main.querySelector('[data-vat-label]').textContent = st.vat ? '부가세 포함' : '부가세 별도';
        if (!data) return;
        const g = krwPerGram(data, 'xau') * vat();
        const don = g * DON;
        main.querySelector('[data-price]').textContent = F.fmt(Math.round(don), 0) + '원';
        if (prev && prev.rates.xau) {
          const p = krwPerGram(prev, 'xau') * vat() * DON, d = don - p, pct = d / p * 100;
          const cls = d > 0 ? 'up' : d < 0 ? 'down' : '';
          main.querySelector('[data-change]').innerHTML = '<span class="' + cls + '">' + (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + F.fmt(Math.abs(Math.round(d)), 0) + '원 (' + (pct > 0 ? '+' : '') + F.fmt(pct, 2, 2) + '%)</span> <span class="muted" style="font-size:13px;font-weight:500">전일 대비</span>';
        } else main.querySelector('[data-change]').innerHTML = '<span class="muted" style="font-size:13px">기준일 ' + data.date + '</span>';

        table.innerHTML =
          row('1g', F.won(g)) +
          row('1돈', F.won(don), '3.75g') +
          row('1냥', F.won(g * 37.5), '10돈 · 37.5g') +
          row('1온스', F.won(g * OZ), '31.1g') +
          row('1kg', F.won(g * 1000)) +
          row('국제 시세', '$' + F.fmt(usdPerOz(data, 'xau'), 2) + ' /oz', '달러 기준');
        const sg = krwPerGram(data, 'xag') * vat();
        silver.innerHTML = data.rates.xag ? row('1g', F.won(sg)) + row('1돈', F.won(sg * DON), '3.75g') + row('1kg', F.won(sg * 1000)) +
          row('국제 시세', '$' + F.fmt(usdPerOz(data, 'xag'), 2) + ' /oz', '달러 기준') : row('은 시세', '-');
        calc();
      }

      function calc() {
        if (!data) { res.innerHTML = '<div class="result-empty">시세를 불러오는 중이에요</div>'; return; }
        const w = F.parseNum(st.weight);
        const u = UNITS.find(x => x.value === st.unit), p = PURITY.find(x => x.value === st.purity);
        if (!(w > 0)) { res.innerHTML = '<div class="result-empty">중량을 입력하세요</div>'; return; }
        const grams = w * u.g;
        const price = grams * p.p * krwPerGram(data, 'xau') * vat();
        res.innerHTML = '<div class="result-label">' + p.label + ' ' + F.fmt(w, 3) + u.label + ' 예상 가격</div>' +
          '<div class="result-main">' + F.fmt(Math.round(price), 0) + '<span class="u">원</span></div>' +
          '<div class="result-sub">' + F.koreanAmount(Math.round(price)) + '</div>' +
          ui.resultRows([
            { label: '중량 환산', value: F.fmt(grams, 2) + 'g · ' + F.fmt(grams / DON, 2) + '돈' },
            { label: '순금 함량', value: F.fmt(grams * p.p, 3) + 'g (' + F.fmt(p.p * 100, 2) + '%)' }
          ]);
      }

      async function loadChart() {
        const box = main.querySelector('[data-chart]');
        box.innerHTML = '<div class="skeleton" style="height:90px;margin-top:12px"></div>';
        const dates = [30, 25, 20, 15, 10, 5, 1].map(d => shift(data.date, -d));
        const pts = (await Promise.all(dates.map(d => LC.market.fxOn(d).then(r => ({ t: Date.parse(d), v: krwPerGram(r, 'xau') * DON }), () => null))))
          .filter(Boolean);
        pts.push({ t: Date.parse(data.date), v: krwPerGram(data, 'xau') * DON });
        if (pts.length < 3) { box.innerHTML = ''; return; }
        const up = pts[pts.length - 1].v >= pts[0].v;
        const ret = (pts[pts.length - 1].v - pts[0].v) / pts[0].v * 100;
        box.innerHTML = LC.sparkline(pts, up ? '#F04452' : '#3182F6') +
          '<div class="spark-axis"><span>' + dates[0].slice(5).replace('-', '/') + '</span><span>최근 1개월 <b class="' + (up ? 'up' : 'down') + '">' + (ret > 0 ? '+' : '') + F.fmt(ret, 2) + '%</b></span><span>' + data.date.slice(5).replace('-', '/') + '</span></div>';
      }

      async function load(force) {
        const rb = page.nav.querySelector('[data-refresh]');
        rb.classList.add('spin');
        try {
          data = await LC.market.fxLatest(force);
          if (!data.rates.xau) throw new Error('no gold');
          status.innerHTML = '<span>기준일 ' + data.date + (data.stale ? ' · <b class="down">저장된 시세</b>' : '') + '</span><span>' + LC.ago(data.cachedAt) + ' 확인</span>';
          draw();
          try { prev = await LC.market.fxOn(shift(data.date, -1)); draw(); } catch (e) {}
          loadChart();
        } catch (e) {
          status.innerHTML = '<span class="down">시세를 불러오지 못했어요 · 인터넷 연결을 확인해 주세요</span><button class="link-btn" data-retry>다시 시도</button>';
          status.querySelector('[data-retry]').onclick = () => load(true);
          main.querySelector('[data-price]').innerHTML = '<span class="muted" style="font-size:17px;font-weight:500">-</span>';
          main.querySelector('[data-change]').innerHTML = '';
          main.querySelector('[data-chart]').innerHTML = '';
          calc();
        } finally { rb.classList.remove('spin'); }
      }
      page.nav.querySelector('[data-refresh]').onclick = () => load(true);
      draw(); calc();
      load(false);
    }
  });
})();
