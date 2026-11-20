/* 네트워크 · 시세 데이터 (무료 공개 API, 인증키 불필요)
 *
 *  환율 · 금/은 시세 : fawazahmed0/exchange-api (jsDelivr CDN, CC0, 호출 제한 없음, 하루 1회 갱신)
 *                     예비: 같은 데이터의 Cloudflare 미러(currency-api.pages.dev) → Frankfurter (쿼터 없음)
 *  코스피 · 코스닥    : 네이버 증권 모바일 API (공개된 호출 제한 없음, 비공식)
 *                     ※ 호출 제한이 있는 Yahoo Finance(429 차단)는 제거했습니다.
 *  서버 없이 각 기기가 직접 조회하므로, 호출량은 사용자 1명 단위로만 발생합니다.
 *
 *  브라우저 보안정책(CORS) 대응
 *   - 안드로이드 앱(Capacitor): capacitor.config.json 의 CapacitorHttp 가 네이티브로 요청
 *   - 윈도우 실행 파일: 내장 서버의 중계 주소(LC_ENV.proxy)로 자동 재시도
 */
(function () {
  const store = LC.store;

  function timeoutFetch(url, ms) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), ms);
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined, cache: 'no-store' })
      .finally(() => clearTimeout(timer));
  }

  async function getJSON(url, opts) {
    opts = opts || {};
    const ms = opts.timeout || 9000;
    const tries = [url];
    const proxy = window.LC_ENV && window.LC_ENV.proxy;
    if (proxy) tries.push(proxy + encodeURIComponent(url));
    let lastErr;
    for (const u of tries) {
      try {
        const res = await timeoutFetch(u, ms);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('network');
  }

  async function firstOk(loaders) {
    let lastErr;
    for (const fn of loaders) {
      try { const v = await fn(); if (v) return v; } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('no data');
  }

  // 캐시: 유효시간 안이면 저장값, 실패 시 오래된 값이라도 반환(stale 표시)
  async function cached(key, maxAgeMs, loader, force) {
    const c = store.get('cache.' + key, null);
    if (!force && c && Date.now() - c.t < maxAgeMs) return Object.assign({ cachedAt: c.t }, c.data);
    try {
      const data = await loader();
      store.set('cache.' + key, { t: Date.now(), data: data });
      return Object.assign({ cachedAt: Date.now() }, data);
    } catch (e) {
      if (c) return Object.assign({ cachedAt: c.t, stale: true }, c.data);
      throw e;
    }
  }

  /* ---------- 환율 (USD 기준, 통화코드 소문자) ---------- */
  function fawaz(tag) {
    return [
      () => getJSON('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@' + tag + '/v1/currencies/usd.json'),
      () => getJSON('https://' + tag + '.currency-api.pages.dev/v1/currencies/usd.json')
    ];
  }
  function normFawaz(j) {
    if (!j || !j.usd || !j.usd.krw) throw new Error('bad');
    return { date: j.date, rates: j.usd, source: 'fawazahmed0/exchange-api' };
  }
  async function fxLatest(force) {
    return cached('fx.latest', 60 * 60 * 1000, () => firstOk(
      fawaz('latest').map(fn => async () => normFawaz(await fn())).concat([frankfurter])
    ), force);
  }
  // Frankfurter (frankfurter.dev) — 일/월 쿼터 없음, 남용 방지용 속도 제한만 있음
  const FX_CODES = 'krw,jpy,eur,cny,gbp,hkd,twd,aud,cad,chf,sgd,nzd,thb,vnd,php,idr,myr,inr,aed,mnt,xau,xag';
  async function frankfurter() {
    const j = await getJSON('https://api.frankfurter.dev/v2/rates?base=usd&quotes=' + FX_CODES);
    const rates = { usd: 1 };
    let date = '';
    const put = (code, v, d) => { if (code && isFinite(v)) rates[String(code).toLowerCase()] = +v; if (d && !date) date = d; };
    if (Array.isArray(j)) j.forEach(r => put(r.quote || r.currency || r.symbol, r.rate, r.date));
    else if (j && j.rates) {
      if (Array.isArray(j.rates)) j.rates.forEach(r => put(r.quote || r.currency, r.rate, r.date));
      else Object.keys(j.rates).forEach(k => put(k, j.rates[k]));
      date = j.date || date;
    }
    if (!rates.krw) throw new Error('bad');
    return { date: (date || new Date().toISOString()).slice(0, 10), rates: rates, source: 'Frankfurter' };
  }
  // 특정 날짜(YYYY-MM-DD) 환율 — 과거 데이터는 바뀌지 않으므로 영구 캐시
  async function fxOn(date) {
    return cached('fx.' + date, 365 * 864e5, () => firstOk(fawaz(date).map(fn => async () => normFawaz(await fn()))));
  }

  /* ---------- 주가 지수 ---------- */
  const num = v => {
    if (typeof v === 'number') return v;
    if (v === null || v === undefined) return NaN;
    return parseFloat(String(v).replace(/,/g, ''));
  };

  async function naverQuote(code) {
    const j = await getJSON('https://m.stock.naver.com/api/index/' + code + '/basic');
    const price = num(j.closePrice);
    if (!isFinite(price)) throw new Error('bad');
    let change = num(j.compareToPreviousClosePrice);
    let rate = num(j.fluctuationsRatio);
    const dir = j.compareToPreviousPrice && (j.compareToPreviousPrice.name || j.compareToPreviousPrice.code);
    if (dir && /FALL|LOWER|5|4/.test(String(dir)) && change > 0) { change = -change; rate = -Math.abs(rate); }
    return {
      price, change, rate,
      open: j.marketStatus === 'OPEN',
      time: j.localTradedAt || '',
      source: '네이버 증권'
    };
  }
  async function naverHistory(code, count) {
    const out = [];
    for (let page = 1; out.length < count && page <= 5; page++) {
      const arr = await getJSON('https://m.stock.naver.com/api/index/' + code + '/price?pageSize=60&page=' + page);
      if (!Array.isArray(arr) || !arr.length) break;
      arr.forEach(r => out.push({ t: Date.parse(String(r.localTradedAt).slice(0, 10) + 'T15:30:00+09:00'), v: num(r.closePrice) }));
    }
    if (!out.length) throw new Error('bad');
    return { points: out.filter(p => isFinite(p.v)).slice(0, count).reverse(), source: '네이버 증권' };
  }

  // 장중에는 짧게, 장 마감 후에는 길게 저장해 불필요한 호출을 줄임
  function marketOpenNow() {
    const k = new Date(Date.now() + (9 * 60 + new Date().getTimezoneOffset()) * 60000);
    const m = k.getHours() * 60 + k.getMinutes(), d = k.getDay();
    return d >= 1 && d <= 5 && m >= 8 * 60 + 50 && m <= 15 * 60 + 40;
  }
  async function indexQuote(code, force) {
    return cached('idx.q.' + code, marketOpenNow() ? 60 * 1000 : 15 * 60 * 1000, () => naverQuote(code), force);
  }
  const RANGE_DAYS = { '1mo': 22, '3mo': 64, '1y': 248 };
  async function indexChart(code, range, force) {
    return cached('idx.c.' + code + '.' + range, marketOpenNow() ? 15 * 60 * 1000 : 6 * 3600 * 1000,
      () => naverHistory(code, RANGE_DAYS[range] || 22), force);
  }

  LC.net = { getJSON, cached };
  LC.market = { fxLatest, fxOn, indexQuote, indexChart };

  /* ---------- 공통: 미니 차트(SVG) ---------- */
  LC.sparkline = function (points, color) {
    if (!points || points.length < 2) return '';
    const W = 300, H = 90, P = 4;
    const vs = points.map(p => p.v);
    let min = Math.min.apply(null, vs), max = Math.max.apply(null, vs);
    if (max === min) { max += 1; min -= 1; }
    const x = i => P + i * (W - P * 2) / (points.length - 1);
    const y = v => P + (max - v) * (H - P * 2) / (max - min);
    const line = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".25"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + line + ' L' + x(points.length - 1).toFixed(1) + ' ' + H + ' L' + x(0) + ' ' + H + ' Z" fill="url(#' + id + ')"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  };

  // "3분 전" 같은 상대 시간
  LC.ago = function (t) {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return '방금';
    if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    return Math.floor(s / 86400) + '일 전';
  };
})();
