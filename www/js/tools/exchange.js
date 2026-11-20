/* 환율 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  const CUR = [
    { c: 'krw', n: '대한민국 원', s: '₩' },
    { c: 'usd', n: '미국 달러', s: '$' },
    { c: 'jpy', n: '일본 엔', s: '¥', u: 100 },
    { c: 'eur', n: '유로', s: '€' },
    { c: 'cny', n: '중국 위안', s: '元' },
    { c: 'gbp', n: '영국 파운드', s: '£' },
    { c: 'hkd', n: '홍콩 달러', s: 'HK$' },
    { c: 'twd', n: '대만 달러', s: 'NT$' },
    { c: 'aud', n: '호주 달러', s: 'A$' },
    { c: 'cad', n: '캐나다 달러', s: 'C$' },
    { c: 'chf', n: '스위스 프랑', s: 'Fr' },
    { c: 'sgd', n: '싱가포르 달러', s: 'S$' },
    { c: 'nzd', n: '뉴질랜드 달러', s: 'NZ$' },
    { c: 'thb', n: '태국 바트', s: '฿' },
    { c: 'vnd', n: '베트남 동', s: '₫', u: 100 },
    { c: 'php', n: '필리핀 페소', s: '₱' },
    { c: 'idr', n: '인도네시아 루피아', s: 'Rp', u: 100 },
    { c: 'myr', n: '말레이시아 링깃', s: 'RM' },
    { c: 'inr', n: '인도 루피', s: '₹' },
    { c: 'aed', n: 'UAE 디르함', s: 'AED' },
    { c: 'mnt', n: '몽골 투그릭', s: '₮' }
  ];
  const cur = c => CUR.find(x => x.c === c) || { c: c, n: c.toUpperCase(), s: '' };
  function prevDate(s) { const d = F.parseYMD(s); return F.ymdStr(F.fromDayNum(F.dayNum(d.y, d.m, d.d) - 1)); }
  function digitsFor(v) { return Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 1 ? 4 : 6; }

  LC.registerTool({
    id: 'exchange', title: '환율 계산기', short: '환율', icon: 'exchange', color: ['#30D5C8', '#0E9F94'], refreshable: true,
    render(page) {
      const st = ui.toolState('exchange', { from: 'usd', to: 'krw', amount: 100 });
      let data = null, prev = null;

      const status = ui.el('<div class="status-line"><span>시세 불러오는 중…</span></div>');
      page.appendChild(status);

      // 변환기
      const options = CUR.map(x => '<option value="' + x.c + '">' + x.c.toUpperCase() + '</option>').join('');
      const conv = ui.el('<div class="mt8"></div>');
      const g1 = ui.el('<div class="group"><div class="row"><select class="cur-select" data-from aria-label="보낼 통화">' + options + '</select>' +
        '<div class="field"><input type="text" aria-label="금액"/></div></div><div class="field-hint" data-from-name></div></div>');
      const swap = ui.el('<button type="button" class="swap-btn" aria-label="통화 바꾸기">' + LC.icon('swap', { sw: 2 }) + '</button>');
      const g2 = ui.el('<div class="group"><div class="row"><select class="cur-select" data-to aria-label="받을 통화">' + options + '</select>' +
        '<div class="row-value strong" data-result style="font-size:22px;font-weight:700;color:var(--text)">-</div></div><div class="field-hint" data-to-name></div></div>');
      conv.append(g1, swap, g2);
      page.appendChild(conv);
      const amountInput = g1.querySelector('input');
      ui.bindNumber(amountInput, { decimals: 4, maxDigits: 15, value: st.amount, onChange: v => { st.amount = v; st.save(); calc(); } });
      const selFrom = g1.querySelector('[data-from]'), selTo = g2.querySelector('[data-to]');
      selFrom.value = st.from; selTo.value = st.to;
      selFrom.onchange = () => { st.from = selFrom.value; st.save(); calc(); };
      selTo.onchange = () => { st.to = selTo.value; st.save(); calc(); };
      swap.onclick = () => { const t = st.from; st.from = st.to; st.to = t; st.save(); selFrom.value = st.from; selTo.value = st.to; calc(); };
      const chips = ui.chips([1, 10, 100, 1000, 10000, 100000].map(v => ({ label: F.fmt(v, 0), value: v })), v => { st.amount = v; st.save(); amountInput.setNumber(v); calc(); });
      chips.style.padding = '12px 4px 0';
      page.appendChild(chips);

      const listTitle = ui.el('<div class="section-title">주요 통화 · 원화 기준 (전일 대비)</div>');
      const list = ui.el('<div class="group"></div>');
      page.append(listTitle, list);
      page.appendChild(ui.el('<p class="footnote">국제 외환시장 기준 환율(하루 1회 갱신)로, 은행 고시 매매기준율과 조금 다를 수 있습니다. 실제 환전·송금 시에는 은행 수수료(스프레드)가 더해집니다.</p>'));

      function rate(c) { return c === 'usd' ? 1 : data.rates[c]; }
      function krwPer(c, d) { const r = d || data; return r.rates.krw / (c === 'usd' ? 1 : r.rates[c]); }

      function calc() {
        g1.querySelector('[data-from-name]').textContent = cur(st.from).n;
        g2.querySelector('[data-to-name]').textContent = cur(st.to).n;
        const out = g2.querySelector('[data-result]');
        if (!data) { out.textContent = '-'; return; }
        const a = F.parseNum(st.amount);
        if (!(a >= 0) || !rate(st.from) || !rate(st.to)) { out.textContent = '-'; return; }
        const v = a * rate(st.to) / rate(st.from);
        out.innerHTML = cur(st.to).s ? '<span class="muted" style="font-size:16px;font-weight:500;margin-right:4px">' + cur(st.to).s + '</span>' + F.fmt(v, st.to === 'krw' ? 0 : digitsFor(v)) : F.fmt(v, digitsFor(v));
        out.title = '눌러서 복사';
        out.onclick = () => ui.copy(String(F.fix(v)), '');
      }

      function drawList() {
        list.innerHTML = '';
        CUR.filter(x => x.c !== 'krw').forEach(x => {
          if (!data.rates[x.c] && x.c !== 'usd') return;
          const u = x.u || 1;
          const v = krwPer(x.c) * u;
          let chg = '';
          if (prev && (prev.rates[x.c] || x.c === 'usd')) {
            const p = krwPer(x.c, prev) * u, d = v - p, pct = d / p * 100;
            const cls = d > 0.0001 ? 'up' : d < -0.0001 ? 'down' : 'muted';
            chg = '<small class="' + cls + '">' + (d > 0 ? '▲' : d < 0 ? '▼' : '') + ' ' + F.fmt(Math.abs(d), 2) + ' (' + (pct > 0 ? '+' : '') + F.fmt(pct, 2) + '%)</small>';
          }
          const r = ui.el('<div class="row tappable fx-row"><span class="row-label"><span class="flag" style="font-size:14px;font-weight:700;color:var(--text-2)">' + x.s + '</span>' +
            '<span>' + x.n + (u > 1 ? ' <span class="fx-code">' + u + '</span>' : '') + '<br/><span class="fx-code">' + x.c.toUpperCase() + '</span></span></span>' +
            '<span class="fx-val"><b>' + F.fmt(v, 2) + '원</b>' + chg + '</span></div>');
          r.onclick = () => {
            st.from = x.c; st.to = 'krw'; st.amount = u; st.save();
            selFrom.value = st.from; selTo.value = st.to; amountInput.setNumber(u); calc();
            document.getElementById('view').scrollTo({ top: 0, behavior: 'smooth' });
          };
          list.appendChild(r);
        });
      }

      async function load(force) {
        const rb = page.nav.querySelector('[data-refresh]');
        rb.classList.add('spin');
        if (!data) list.innerHTML = '<div class="row"><span class="skeleton" style="width:100%">loading</span></div>'.repeat(5);
        try {
          data = await LC.market.fxLatest(force);
          status.innerHTML = '<span>기준일 ' + data.date + (data.stale ? ' · <b class="down">오프라인(저장된 시세)</b>' : '') + '</span><span>' + LC.ago(data.cachedAt) + ' 확인</span>';
          calc(); drawList();
          try { prev = await LC.market.fxOn(prevDate(data.date)); drawList(); } catch (e) { /* 전일 데이터 없음 */ }
        } catch (e) {
          status.innerHTML = '<span class="down">시세를 불러오지 못했어요</span>';
          list.innerHTML = '';
          const box = ui.el('<div class="error-box">인터넷 연결을 확인한 뒤 다시 시도해 주세요.<button class="btn secondary">다시 시도</button></div>');
          box.querySelector('button').onclick = () => { box.remove(); load(true); };
          list.appendChild(box);
        } finally { rb.classList.remove('spin'); }
      }
      page.nav.querySelector('[data-refresh]').onclick = () => load(true);
      calc();
      load(false);
    }
  });
})();
