/* 환율 계산기 */
(function () {
  const F = LC.F, ui = LC.ui;
  // m: 주요 통화(목록에 표시), k: 검색용 국가·별칭
  const CUR = [
    { c: 'krw', n: '대한민국 원', s: '₩', m: 1, k: '한국 대한민국' },
    { c: 'usd', n: '미국 달러', s: '$', m: 1, k: '미국 아메리카 미합중국 에콰도르 엘살바도르 파나마' },
    { c: 'jpy', n: '일본 엔', s: '¥', u: 100, m: 1, k: '일본' },
    { c: 'eur', n: '유로', s: '€', m: 1, k: '유럽 유럽연합 독일 프랑스 이탈리아 스페인 네덜란드 벨기에 오스트리아 포르투갈 그리스 핀란드 아일랜드 크로아티아 슬로바키아 슬로베니아 에스토니아 라트비아 리투아니아 룩셈부르크 몰타 키프로스' },
    { c: 'cny', n: '중국 위안', s: '元', m: 1, k: '중국 위안화' },
    { c: 'gbp', n: '영국 파운드', s: '£', m: 1, k: '영국 잉글랜드' },
    { c: 'hkd', n: '홍콩 달러', s: 'HK$', m: 1, k: '홍콩' },
    { c: 'twd', n: '대만 달러', s: 'NT$', m: 1, k: '대만 타이완' },
    { c: 'aud', n: '호주 달러', s: 'A$', m: 1, k: '호주 오스트레일리아' },
    { c: 'cad', n: '캐나다 달러', s: 'C$', m: 1, k: '캐나다' },
    { c: 'chf', n: '스위스 프랑', s: 'Fr', m: 1, k: '스위스 리히텐슈타인' },
    { c: 'sgd', n: '싱가포르 달러', s: 'S$', m: 1, k: '싱가포르' },
    { c: 'nzd', n: '뉴질랜드 달러', s: 'NZ$', m: 1, k: '뉴질랜드' },
    { c: 'thb', n: '태국 바트', s: '฿', m: 1, k: '태국' },
    { c: 'vnd', n: '베트남 동', s: '₫', u: 100, m: 1, k: '베트남' },
    { c: 'php', n: '필리핀 페소', s: '₱', m: 1, k: '필리핀' },
    { c: 'idr', n: '인도네시아 루피아', s: 'Rp', u: 100, m: 1, k: '인도네시아 발리' },
    { c: 'myr', n: '말레이시아 링깃', s: 'RM', m: 1, k: '말레이시아' },
    { c: 'inr', n: '인도 루피', s: '₹', m: 1, k: '인도' },
    { c: 'aed', n: 'UAE 디르함', s: 'AED', m: 1, k: '아랍에미리트 두바이 아부다비' },
    { c: 'mnt', n: '몽골 투그릭', s: '₮', m: 1, k: '몽골' },
    { c: 'mop', n: '마카오 파타카', s: 'MOP', k: '마카오' },
    { c: 'khr', n: '캄보디아 리엘', s: '៛', u: 100, k: '캄보디아' },
    { c: 'lak', n: '라오스 킵', s: '₭', u: 100, k: '라오스' },
    { c: 'mmk', n: '미얀마 짯', s: 'K', u: 100, k: '미얀마 버마' },
    { c: 'bnd', n: '브루나이 달러', s: 'B$', k: '브루나이' },
    { c: 'npr', n: '네팔 루피', s: 'Rs', k: '네팔' },
    { c: 'pkr', n: '파키스탄 루피', s: 'Rs', k: '파키스탄' },
    { c: 'bdt', n: '방글라데시 타카', s: '৳', k: '방글라데시' },
    { c: 'lkr', n: '스리랑카 루피', s: 'Rs', k: '스리랑카' },
    { c: 'kzt', n: '카자흐스탄 텡게', s: '₸', k: '카자흐스탄' },
    { c: 'uzs', n: '우즈베키스탄 숨', s: 'soʻm', u: 100, k: '우즈베키스탄' },
    { c: 'rub', n: '러시아 루블', s: '₽', k: '러시아' },
    { c: 'uah', n: '우크라이나 흐리우냐', s: '₴', k: '우크라이나' },
    { c: 'try', n: '튀르키예 리라', s: '₺', k: '튀르키예 터키' },
    { c: 'sar', n: '사우디 리얄', s: '﷼', k: '사우디아라비아' },
    { c: 'qar', n: '카타르 리얄', s: 'QR', k: '카타르' },
    { c: 'kwd', n: '쿠웨이트 디나르', s: 'KD', k: '쿠웨이트' },
    { c: 'bhd', n: '바레인 디나르', s: 'BD', k: '바레인' },
    { c: 'omr', n: '오만 리알', s: 'OMR', k: '오만' },
    { c: 'jod', n: '요르단 디나르', s: 'JD', k: '요르단' },
    { c: 'ils', n: '이스라엘 셰켈', s: '₪', k: '이스라엘' },
    { c: 'egp', n: '이집트 파운드', s: 'E£', k: '이집트' },
    { c: 'mad', n: '모로코 디르함', s: 'MAD', k: '모로코' },
    { c: 'zar', n: '남아공 랜드', s: 'R', k: '남아프리카공화국 남아공' },
    { c: 'kes', n: '케냐 실링', s: 'KSh', k: '케냐' },
    { c: 'ngn', n: '나이지리아 나이라', s: '₦', k: '나이지리아' },
    { c: 'sek', n: '스웨덴 크로나', s: 'kr', k: '스웨덴' },
    { c: 'nok', n: '노르웨이 크로네', s: 'kr', k: '노르웨이' },
    { c: 'dkk', n: '덴마크 크로네', s: 'kr', k: '덴마크 그린란드' },
    { c: 'isk', n: '아이슬란드 크로나', s: 'kr', k: '아이슬란드' },
    { c: 'pln', n: '폴란드 즐로티', s: 'zł', k: '폴란드' },
    { c: 'czk', n: '체코 코루나', s: 'Kč', k: '체코' },
    { c: 'huf', n: '헝가리 포린트', s: 'Ft', k: '헝가리' },
    { c: 'ron', n: '루마니아 레우', s: 'lei', k: '루마니아' },
    { c: 'mxn', n: '멕시코 페소', s: 'MX$', k: '멕시코' },
    { c: 'brl', n: '브라질 헤알', s: 'R$', k: '브라질' },
    { c: 'ars', n: '아르헨티나 페소', s: 'AR$', k: '아르헨티나' },
    { c: 'clp', n: '칠레 페소', s: 'CL$', k: '칠레' },
    { c: 'cop', n: '콜롬비아 페소', s: 'CO$', k: '콜롬비아' },
    { c: 'pen', n: '페루 솔', s: 'S/', k: '페루' },
    { c: 'fjd', n: '피지 달러', s: 'FJ$', k: '피지' }
  ];
  const cur = c => CUR.find(x => x.c === c) || { c: c, n: c.toUpperCase(), s: '' };
  function prevDate(s) { const d = F.parseYMD(s); return F.ymdStr(F.fromDayNum(F.dayNum(d.y, d.m, d.d) - 1)); }
  function digitsFor(v) { return Math.abs(v) >= 1 ? 2 : 4; }

  LC.registerTool({
    id: 'exchange', title: '환율 계산기', short: '환율', icon: 'exchange', color: ['#30D5C8', '#0E9F94'], refreshable: true,
    render(page) {
      // 기본: 위쪽 원화, 아래쪽 미국 달러. edited = 마지막으로 입력한 칸('from' 위 / 'to' 아래)
      const st = ui.toolState('exchange2', { from: 'krw', to: 'usd', amount: 10000, toAmount: '', edited: 'from' });
      let data = null, prev = null;

      const status = ui.el('<div class="status-line"><span>시세 불러오는 중…</span></div>');
      page.appendChild(status);

      // 변환기
      const conv = ui.el('<div class="mt8"></div>');
      const g1 = ui.el('<div class="group"><div class="row"><button type="button" class="cur-btn" data-from aria-label="보낼 통화 선택"></button>' +
        '<div class="field"><input type="text" aria-label="금액"/></div></div><div class="field-hint" data-from-name></div></div>');
      const swap = ui.el('<button type="button" class="swap-btn" aria-label="통화 바꾸기">' + LC.icon('swap', { sw: 2 }) + '</button>');
      const g2 = ui.el('<div class="group"><div class="row"><button type="button" class="cur-btn" data-to aria-label="받을 통화 선택"></button>' +
        '<div class="field"><span class="unit" data-to-sym></span><input type="text" aria-label="받을 금액"/></div></div><div class="field-hint" data-to-name></div></div>');
      const basisLine = ui.el('<div class="fx-basis"></div>');
      conv.append(g1, swap, g2, basisLine);
      page.appendChild(conv);
      const amountInput = g1.querySelector('input');
      // 계산되는 쪽은 비워 두고 시작 (환율 자료가 있을 때만 채움)
      ui.bindNumber(amountInput, { decimals: 4, maxDigits: 15, value: st.edited === 'to' ? '' : st.amount, onChange: v => { st.amount = v; st.edited = 'from'; st.save(); calc(); } });
      const toInput = g2.querySelector('input');
      ui.bindNumber(toInput, { decimals: 4, maxDigits: 15, value: st.edited === 'to' ? st.toAmount : '', onChange: v => { st.toAmount = v; st.edited = 'to'; st.save(); calc(); } });
      [amountInput, toInput].forEach(i => { i.style.fontSize = '22px'; i.style.fontWeight = '700'; });
      const btnFrom = g1.querySelector('[data-from]'), btnTo = g2.querySelector('[data-to]');
      function syncBtns() {
        [[btnFrom, st.from], [btnTo, st.to]].forEach(([b, c]) => {
          b.innerHTML = '<span>' + c.toUpperCase() + '</span><span class="cn">' + ui.esc(cur(c).n) + '</span>' + LC.icon('chevron', { sw: 2.6 });
        });
      }
      btnFrom.onclick = () => pickCurrency('보낼 통화 선택', st.from, c => { st.from = c; st.save(); syncBtns(); calc(); });
      btnTo.onclick = () => pickCurrency('받을 통화 선택', st.to, c => { st.to = c; st.save(); syncBtns(); calc(); });
      syncBtns();
      swap.onclick = () => {
        const t = st.from; st.from = st.to; st.to = t;
        const a = st.amount; st.amount = st.toAmount; st.toAmount = a;
        st.edited = st.edited === 'to' ? 'from' : 'to';
        amountInput.setNumber(st.amount === '' ? '' : String(F.fix(+st.amount)));
        toInput.setNumber(st.toAmount === '' ? '' : String(F.fix(+st.toAmount)));
        st.save(); syncBtns(); calc();
      };

      // 통화 · 국가 검색 시트
      function pickCurrency(title, current, onPick) {
        const wrap = ui.el('<div><label class="search-box">' + LC.icon('search', { sw: 2.2 }) +
          '<input type="search" placeholder="국가 또는 통화 검색 (예: 프랑스, 바트, USD)" aria-label="통화 검색"/></label><div data-list></div></div>');
        const input = wrap.querySelector('input'), listEl = wrap.querySelector('[data-list]');
        const sh = ui.sheet({ title: title, content: wrap });
        const norm = t => String(t).toLowerCase().replace(/\s+/g, '');
        function item(x) {
          const has = data ? (x.c === 'usd' || !!data.rates[x.c]) : true;
          const r = ui.el('<div class="row tappable cur-item' + (x.c === current ? ' sel' : '') + '"' + (has ? '' : ' style="opacity:.4"') + '>' +
            '<span class="flag" style="font-size:14px;font-weight:700;color:var(--text-2)">' + x.s + '</span>' +
            '<span class="row-label"><span class="cc">' + x.c.toUpperCase() + '</span>' + ui.esc(x.n) +
            '<small>' + ui.esc(x.k.split(' ').slice(0, 6).join(' · ')) + (x.k.split(' ').length > 6 ? ' 등' : '') + '</small></span>' +
            (x.c === current ? '<span style="color:var(--accent);width:20px">' + LC.icon('check', { sw: 2.6 }) + '</span>' : '') + '</div>');
          const ck = r.querySelector('svg'); if (ck) ck.style.cssText = 'width:20px;height:20px';
          r.onclick = () => { if (!has) { ui.toast('이 통화는 현재 시세가 없어요'); return; } onPick(x.c); sh.close(); };
          return r;
        }
        function render() {
          const q = norm(input.value);
          listEl.innerHTML = '';
          const match = x => !q || norm(x.n).includes(q) || norm(x.k).includes(q) || x.c.includes(q);
          const found = CUR.filter(match);
          if (!found.length) { listEl.innerHTML = '<div class="empty">"' + ui.esc(input.value) + '" 에 해당하는 통화가 없어요</div>'; return; }
          const groups = q ? [['검색 결과 ' + found.length + '개', found]] : [['주요 통화', found.filter(x => x.m)], ['기타 통화 (가나다순)', found.filter(x => !x.m).sort((a, b) => a.n.localeCompare(b.n, 'ko'))]];
          groups.forEach(([t, arr]) => {
            if (!arr.length) return;
            listEl.appendChild(ui.el('<div class="section-title" style="margin-top:6px">' + t + '</div>'));
            const g = ui.el('<div class="group"></div>');
            arr.forEach(x => g.appendChild(item(x)));
            listEl.appendChild(g);
          });
        }
        input.addEventListener('input', render);
        render();
        if (window.matchMedia && matchMedia('(pointer:fine)').matches) setTimeout(() => input.focus(), 350);
      }
      const chips = ui.chips([1, 10, 100, 1000, 10000, 100000].map(v => ({ label: F.fmt(v, 0), value: v })), v => { st.amount = v; st.edited = 'from'; st.save(); amountInput.setNumber(v); calc(); });
      chips.style.padding = '12px 4px 0';
      page.appendChild(chips);

      const listTitle = ui.el('<div class="section-head"><span>주요 통화 · 원화 기준 (전일 대비)</span><button type="button" class="link-btn">국가 검색</button></div>');
      listTitle.querySelector('button').onclick = () => pickCurrency('국가 · 통화 검색', st.from, c => {
        const u = cur(c).u || 1;
        st.from = c; st.to = 'krw'; st.amount = u; st.edited = 'from'; st.save(); syncBtns(); amountInput.setNumber(u); calc();
        document.getElementById('view').scrollTo({ top: 0, behavior: 'smooth' });
      });
      const list = ui.el('<div class="group"></div>');
      page.append(listTitle, list);
      page.appendChild(ui.el('<p class="footnote">국제 외환시장 기준 환율(하루 1회 갱신)로, 은행 고시 매매기준율과 조금 다를 수 있습니다. 실제 환전·송금 시에는 은행 수수료(스프레드)가 더해집니다.</p>'));

      function rate(c) { return c === 'usd' ? 1 : data.rates[c]; }
      function krwPer(c, d) { const r = d || data; return r.rates.krw / (c === 'usd' ? 1 : r.rates[c]); }

      // 통화 이름 + 원화일 때 한글 금액 (예: 13만 3,190원)
      function hints() {
        const h = (code, val) => {
          const n = F.parseNum(val);
          return ui.esc(cur(code).n) + (code === 'krw' && n >= 1 ? ' <span class="kr-amt">' + F.koreanAmount(Math.round(n)) + '</span>' : '');
        };
        g1.querySelector('[data-from-name]').innerHTML = h(st.from, st.amount);
        g2.querySelector('[data-to-name]').innerHTML = h(st.to, st.toAmount);
      }
      function calc() {
        hints();
        g2.querySelector('[data-to-sym]').textContent = cur(st.to).s;
        if (!data || !rate(st.from) || !rate(st.to)) return;
        // 입력한 쪽을 기준으로 반대쪽 금액 계산 (위↔아래 양방향)
        const r = rate(st.to) / rate(st.from);
        const out = (v, code) => { const d = code === 'krw' ? 0 : digitsFor(v); return String(Math.round(v * Math.pow(10, d)) / Math.pow(10, d)); };
        if (st.edited === 'to') {
          const b = F.parseNum(st.toAmount);
          if (!(b >= 0)) { amountInput.value = ''; return; }
          st.amount = b / r; amountInput.setNumber(out(st.amount, st.from)); hints();
        } else {
          const a = F.parseNum(st.amount);
          if (!(a >= 0)) { toInput.value = ''; return; }
          st.toAmount = a * r; toInput.setNumber(out(st.toAmount, st.to)); hints();
        }
        st.save();
      }

      function drawList() {
        list.innerHTML = '';
        CUR.filter(x => x.c !== 'krw' && x.m).forEach(x => {
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
            st.edited = 'from'; syncBtns(); amountInput.setNumber(u); calc();
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
          basisLine.innerHTML = data.date + ' 기준 환율 · 하루 1회 갱신' + (data.stale ? ' · <b class="down">인터넷 연결 없음 — 마지막으로 받은 환율</b>' : '');
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
