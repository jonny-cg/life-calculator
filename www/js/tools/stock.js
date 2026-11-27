/* 코스피 / 코스닥 지수 */
(function () {
  const F = LC.F, ui = LC.ui;
  const IDX = [{ code: 'KOSPI', name: '코스피' }, { code: 'KOSDAQ', name: '코스닥' }];
  const RANGES = [{ value: '1mo', label: '1개월' }, { value: '3mo', label: '3개월' }, { value: '1y', label: '1년' }];

  function kstNow() { return new Date(Date.now() + (9 * 60 + new Date().getTimezoneOffset()) * 60000); }
  function marketHours() {
    const k = kstNow(), d = k.getDay(), m = k.getHours() * 60 + k.getMinutes();
    return d >= 1 && d <= 5 && m >= 9 * 60 && m <= 15 * 60 + 40;
  }
  function md(t) { const d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); }
  function timeLabel(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return String(s);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  LC.registerTool({
    id: 'stock', title: '코스피 · 코스닥', short: '코스피/코스닥', icon: 'stock', color: ['#48484A', '#1C1C1E'], refreshable: true,
    render(page) {
      const st = ui.toolState('stock', { range: '1mo' }, ['range']);
      const status = ui.el('<div class="status-line"><span>시세 불러오는 중…</span></div>');
      page.appendChild(status);
      const seg = ui.segmented(RANGES, st.range, v => { st.range = v; st.save(); IDX.forEach(i => loadChart(i, false)); }, 'wide');
      seg.style.margin = '10px 0 0';
      page.appendChild(seg);

      const cards = {};
      IDX.forEach(i => {
        const c = ui.el('<div class="quote-card">' +
          '<div class="quote-top"><span class="quote-name">' + i.name + '</span><span class="quote-time" data-time></span></div>' +
          '<div class="quote-price" data-price><span class="skeleton">0,000.00</span></div>' +
          '<div class="quote-change" data-change><span class="skeleton">+00.00 (+0.00%)</span></div>' +
          '<div data-chart style="min-height:110px"></div>' +
          '<div class="quote-stats" data-stats></div></div>');
        cards[i.code] = c;
        page.appendChild(c);
      });
      page.appendChild(ui.el('<p class="footnote">시세는 네이버 증권의 공개 데이터로 실시간이 아닐 수 있습니다(지연 시세). 투자 판단의 참고용으로만 이용하세요. 장중에는 1분마다 자동으로 갱신됩니다.</p>'));

      async function loadQuote(i, force) {
        const c = cards[i.code];
        try {
          const q = await LC.market.indexQuote(i.code, force);
          const cls = q.change > 0 ? 'up' : q.change < 0 ? 'down' : '';
          const arrow = q.change > 0 ? '▲ ' : q.change < 0 ? '▼ ' : '';
          c.querySelector('[data-price]').innerHTML = '<span class="' + cls + '">' + F.fmt(q.price, 2, 2) + '</span>';
          c.querySelector('[data-change]').innerHTML = '<span class="' + cls + '">' + arrow + F.fmt(Math.abs(q.change), 2, 2) + ' (' + (q.rate > 0 ? '+' : '') + F.fmt(q.rate, 2, 2) + '%)</span>';
          c.querySelector('[data-time]').textContent = (q.open ? '장 중 · ' : '') + timeLabel(q.time) + (q.stale ? ' · 저장된 시세' : '');
          return q;
        } catch (e) {
          c.querySelector('[data-price]').innerHTML = '<span class="muted" style="font-size:17px;font-weight:500">시세를 불러오지 못했어요</span>';
          c.querySelector('[data-change]').innerHTML = '';
          throw e;
        }
      }
      async function loadChart(i, force) {
        const c = cards[i.code];
        const box = c.querySelector('[data-chart]'), stats = c.querySelector('[data-stats]');
        box.innerHTML = '<div class="skeleton" style="height:90px;margin-top:12px"></div>';
        try {
          const ch = await LC.market.indexChart(i.code, st.range, force);
          const p = ch.points;
          if (p.length < 2) throw new Error('short');
          const first = p[0].v, last = p[p.length - 1].v;
          const color = last >= first ? '#F04452' : '#3182F6';
          box.innerHTML = LC.sparkline(p, color) + '<div class="spark-axis"><span>' + md(p[0].t) + '</span><span>' + md(p[p.length - 1].t) + '</span></div>';
          const vs = p.map(x => x.v), ret = (last - first) / first * 100;
          stats.innerHTML = '<div>기간 최고<b>' + F.fmt(Math.max.apply(null, vs), 2) + '</b></div>' +
            '<div>기간 최저<b>' + F.fmt(Math.min.apply(null, vs), 2) + '</b></div>' +
            '<div>기간 수익률<b class="' + (ret >= 0 ? 'up' : 'down') + '">' + (ret > 0 ? '+' : '') + F.fmt(ret, 2) + '%</b></div>';
        } catch (e) {
          box.innerHTML = '<div class="muted" style="font-size:13px;padding:30px 0;text-align:center">차트 데이터를 불러오지 못했어요</div>';
          stats.innerHTML = '';
        }
      }
      async function loadAll(force) {
        const rb = page.nav.querySelector('[data-refresh]');
        rb.classList.add('spin');
        const res = await Promise.allSettled(IDX.map(i => loadQuote(i, force)));
        IDX.forEach(i => loadChart(i, force));
        rb.classList.remove('spin');
        const ok = res.filter(r => r.status === 'fulfilled').map(r => r.value);
        if (!ok.length) status.innerHTML = '<span class="down">인터넷 연결을 확인해 주세요</span><button class="link-btn" data-retry>다시 시도</button>';
        else status.innerHTML = '<span>' + (marketHours() ? '장 운영 중 (09:00~15:30)' : '장 마감') + ' · 출처 ' + ok[0].source + '</span><span>' + LC.ago(ok[0].cachedAt) + ' 확인</span>';
        const retry = status.querySelector('[data-retry]');
        if (retry) retry.onclick = () => loadAll(true);
      }
      page.nav.querySelector('[data-refresh]').onclick = () => loadAll(true);
      loadAll(false);

      const timer = setInterval(() => { if (marketHours() && document.visibilityState === 'visible') IDX.forEach(i => loadQuote(i, true).catch(() => {})); }, 60000);
      LC.currentCleanup = () => clearInterval(timer);
    }
  });
})();
