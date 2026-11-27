/* 이전 날씨 — 오늘 기준 ±3일 날씨와 1~3년 전 같은 기간, 4년 전~작년 같은 달 날씨 비교
 * 데이터: Open-Meteo (예보 + ERA5 재분석 과거 자료), 무료·인증키 불필요
 */
(function () {
  const F = LC.F, ui = LC.ui;

  // WMO 날씨 코드 → 한글 · 이모지 · 분류
  function wx(code) {
    const c = code;
    if (c === 0) return { e: '☀️', t: '맑음', g: '맑음' };
    if (c === 1) return { e: '🌤️', t: '대체로 맑음', g: '맑음' };
    if (c === 2) return { e: '⛅', t: '구름 조금', g: '구름' };
    if (c === 3) return { e: '☁️', t: '흐림', g: '흐림' };
    if (c === 45 || c === 48) return { e: '🌫️', t: '안개', g: '흐림' };
    if (c >= 51 && c <= 57) return { e: '🌦️', t: '이슬비', g: '비' };
    if (c >= 61 && c <= 67) return { e: '🌧️', t: c >= 66 ? '어는 비' : (c >= 65 ? '강한 비' : '비'), g: '비' };
    if (c >= 71 && c <= 77) return { e: '🌨️', t: c >= 75 ? '많은 눈' : '눈', g: '눈' };
    if (c >= 80 && c <= 82) return { e: '🌦️', t: '소나기', g: '비' };
    if (c === 85 || c === 86) return { e: '🌨️', t: '소낙눈', g: '눈' };
    if (c >= 95) return { e: '⛈️', t: '뇌우', g: '비' };
    return { e: '·', t: '-', g: '-' };
  }
  const deg = v => (v === null || v === undefined || isNaN(v)) ? '-' : F.fmt(v, 1) + '°';
  const pct = v => (v === null || v === undefined || isNaN(v)) ? '-' : Math.round(v) + '%';
  const avg = arr => { const v = arr.filter(x => x !== null && x !== undefined && !isNaN(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
  const ds = (y, m, d) => F.ymdStr({ y, m, d });
  function shiftDate(str, n) { const p = F.parseYMD(str); return F.ymdStr(F.fromDayNum(F.dayNum(p.y, p.m, p.d) + n)); }
  function sameDay(y, t) { return ds(y, t.m, Math.min(t.d, F.daysInMonth(y, t.m))); }
  function md(str) { const p = F.parseYMD(str); return p.m + '/' + p.d + ' (' + F.weekday(p) + ')'; }
  function nearestCity(lat, lon) {
    let best = null, bd = Infinity;
    LC.KR_CITIES.forEach(c => { const d = (c.lat - lat) ** 2 + ((c.lon - lon) * Math.cos(lat * Math.PI / 180)) ** 2; if (d < bd) { bd = d; best = c; } });
    return best;
  }
  function diffText(v, unit) {
    if (!isFinite(v)) return '<span class="muted">-</span>';
    const a = Math.abs(v);
    if (a < 0.5) return '<span class="muted">비슷</span>';
    return '<b class="' + (v > 0 ? 'up' : 'down') + '">' + F.fmt(a, 1) + (unit || '°') + ' ' + (v > 0 ? '높음' : '낮음') + '</b>';
  }

  function info() {
    ui.sheet({
      title: '이전 날씨 안내', content:
        '<div class="group">' +
        '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px;min-width:76px">최근 · 예보</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">오늘 기준 3일 전 ~ 3일 후. 지난 날은 모델 분석값, 앞으로의 날은 예보값입니다.</span></div>' +
        '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px;min-width:76px">과거 날씨</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">유럽중기예보센터(ECMWF) ERA5 재분석 자료입니다. 약 10~25km 격자 평균값이라 기상청 관측소 기록과 1~2° 정도 다를 수 있습니다.</span></div>' +
        '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px;min-width:76px">습도</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">하루 평균 상대습도입니다.</span></div>' +
        '<div class="row" style="align-items:flex-start;padding:12px 16px"><span class="row-label" style="font-weight:600;font-size:15px;min-width:76px">비 온 날</span><span class="row-value" style="text-align:left;font-size:14px;line-height:1.45">하루 강수량(비·눈) 1mm 이상인 날입니다.</span></div>' +
        '</div><p class="footnote">날씨 데이터: Open-Meteo.com (CC BY 4.0) · 무료 이용 조건: 비상업적 이용, 기기당 하루 10,000회</p>'
    });
  }

  LC.registerTool({
    id: 'pastweather', title: '이전 날씨', short: '이전 날씨', icon: 'sun', color: ['#64D2FF', '#0A84FF'], refreshable: true,
    info: info,
    render(page) {
      const seoul = LC.KR_CITIES[0];
      const st = ui.toolState('pastweather', { loc: { name: seoul.name, region: seoul.region, lat: seoul.lat, lon: seoul.lon, gps: false }, tab: 0 }, ['tab']);
      const t = F.todayYMD();
      const todayStr = F.ymdStr(t);

      // 위치
      const locCard = ui.el('<div class="group"><div class="row"><span class="row-label" style="flex:1" data-loc></span>' +
        '<button type="button" class="chip" data-gps>📍 현재 위치</button><button type="button" class="chip" data-pick>지역 선택</button></div></div>');
      page.appendChild(locCard);
      const status = ui.el('<div class="status-line" style="margin-top:6px"></div>');
      page.appendChild(status);
      const box = ui.el('<div></div>');
      page.appendChild(box);
      page.appendChild(ui.el('<p class="est-note">과거 날씨는 재분석 자료(격자 평균값)로 기상청 관측소 기록과 다를 수 있으며, 앞으로의 날씨는 예보값입니다. 날씨 데이터: Open-Meteo.com (CC BY 4.0)</p>'));
      page.appendChild(ui.infoBanner('데이터 출처 · 계산 기준 안내', info));

      function syncLoc() {
        const l = st.loc;
        locCard.querySelector('[data-loc]').innerHTML = '<b>' + ui.esc(l.gps ? '현재 위치' : l.name) + '</b><small>' + ui.esc(l.gps ? l.name + ' 부근' : l.region) + '</small>';
      }
      syncLoc();
      locCard.querySelector('[data-gps]').onclick = () => {
        if (!navigator.geolocation) { ui.toast('이 기기에서는 위치를 사용할 수 없어요'); return; }
        ui.toast('현재 위치를 확인하는 중…');
        navigator.geolocation.getCurrentPosition(p => {
          const lat = p.coords.latitude, lon = p.coords.longitude;
          const c = nearestCity(lat, lon);
          st.loc = { name: c ? c.name : '현재 위치', region: c ? c.region : '', lat, lon, gps: true }; st.save(); syncLoc(); load(false);
        }, err => {
          ui.toast(err && err.code === 1 ? '위치 권한이 없어요. 지역을 직접 선택해 주세요' : '위치를 찾지 못했어요. 지역을 직접 선택해 주세요');
        }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 });
      };
      locCard.querySelector('[data-pick]').onclick = pickCity;

      function pickCity() {
        const wrap = ui.el('<div><label class="search-box">' + LC.icon('search', { sw: 2.2 }) + '<input type="search" placeholder="시 이름 검색 (예: 수원, 제주)" aria-label="지역 검색"/></label><div data-list></div></div>');
        const input = wrap.querySelector('input'), list = wrap.querySelector('[data-list]');
        const sh = ui.sheet({ title: '지역 선택', content: wrap });
        function render() {
          const q = input.value.replace(/\s/g, '');
          list.innerHTML = '';
          const found = LC.KR_CITIES.filter(c => !q || (c.region + c.name).includes(q));
          if (!found.length) { list.innerHTML = '<div class="empty">검색 결과가 없어요</div>'; return; }
          const groups = {};
          found.forEach(c => { (groups[c.region] = groups[c.region] || []).push(c); });
          Object.keys(groups).forEach(r => {
            list.appendChild(ui.el('<div class="section-title" style="margin-top:6px">' + r + '</div>'));
            const g = ui.el('<div class="group"></div>');
            groups[r].forEach(c => {
              const sel = !st.loc.gps && st.loc.name === c.name && st.loc.region === c.region;
              const row = ui.el('<div class="row tappable"><span class="row-label" style="flex:1' + (sel ? ';color:var(--accent);font-weight:600' : '') + '">' + c.name + '</span></div>');
              row.onclick = () => { st.loc = { name: c.name, region: c.region, lat: c.lat, lon: c.lon, gps: false }; st.save(); syncLoc(); sh.close(); load(false); };
              g.appendChild(row);
            });
            list.appendChild(g);
          });
        }
        input.addEventListener('input', render);
        render();
      }

      async function load(force) {
        const rb = page.nav.querySelector('[data-refresh]');
        rb.classList.add('spin');
        status.innerHTML = '<span>날씨 불러오는 중…</span>';
        box.innerHTML = '<div class="result-card"><div class="skeleton" style="height:120px"></div></div>';
        const { lat, lon } = st.loc;
        // 과거 자료: 4년 전 같은 달 1일 ~ 작년 같은 날+3일(또는 같은 달 말일) 한 번에 조회
        const aStart = ds(t.y - 4, t.m, 1);
        const lastMonthEnd = ds(t.y - 1, t.m, F.daysInMonth(t.y - 1, t.m));
        const winEnd = shiftDate(sameDay(t.y - 1, t), 3);
        const aEnd = winEnd > lastMonthEnd ? winEnd : lastMonthEnd;
        const [rec, arc] = await Promise.allSettled([LC.weather.recent(lat, lon, force), LC.weather.archive(lat, lon, aStart, aEnd)]);
        rb.classList.remove('spin');
        if (rec.status !== 'fulfilled' && arc.status !== 'fulfilled') {
          status.innerHTML = '<span class="down">날씨를 불러오지 못했어요 · 인터넷 연결을 확인해 주세요</span><button class="link-btn" data-retry>다시 시도</button>';
          status.querySelector('[data-retry]').onclick = () => load(true);
          box.innerHTML = '';
          return;
        }
        const recent = rec.status === 'fulfilled' ? rec.value : null;
        const past = arc.status === 'fulfilled' ? arc.value.days : [];
        status.innerHTML = '<span>' + t.y + '년 ' + t.m + '월 ' + t.d + '일 기준' + (recent && recent.stale ? ' · <b class="down">인터넷 연결 없음 — 마지막으로 받은 자료</b>' : '') + '</span><span>' + (recent ? LC.ago(recent.cachedAt) + ' 확인' : '') + '</span>';
        draw(recent ? recent.days : [], past);
      }

      function windowOf(days, center) {
        const map = {}; days.forEach(d => { map[d.date] = d; });
        const out = [];
        for (let i = -3; i <= 3; i++) { const k = shiftDate(center, i); out.push(map[k] || { date: k }); }
        return out;
      }

      function draw(recentDays, past) {
        box.innerHTML = '';
        const sets = [{ label: '올해', y: t.y, days: windowOf(recentDays, todayStr) }];
        for (let k = 1; k <= 3; k++) sets.push({ label: k + '년 전', y: t.y - k, days: windowOf(past, sameDay(t.y - k, t)) });
        const todayW = sets[0].days[3];
        const pastSame = sets.slice(1).map(s => s.days[3]);
        const pMax = avg(pastSame.map(d => d.max)), pMin = avg(pastSame.map(d => d.min));

        // 1) 오늘 요약 + 비교
        const w = wx(todayW.code);
        const cmp = isFinite(pMax) && todayW.max !== undefined
          ? '최근 3년 같은 날 평균(최고 ' + deg(pMax) + ' / 최저 ' + deg(pMin) + ')보다<br/>최고기온 ' + diffText(todayW.max - pMax) + ', 최저기온 ' + diffText(todayW.min - pMin)
          : '과거 자료를 불러오지 못했어요';
        box.appendChild(ui.el('<div class="result-card">' +
          '<div class="result-label">오늘 · ' + md(todayStr) + '</div>' +
          '<div style="display:flex;align-items:center;gap:14px;margin-top:6px"><span style="font-size:46px;line-height:1">' + w.e + '</span>' +
          '<div><div class="result-main" style="margin:0;font-size:30px">' + deg(todayW.max) + ' <span style="font-size:20px;color:var(--text-2)">/ ' + deg(todayW.min) + '</span></div>' +
          '<div class="result-sub" style="margin-top:2px">' + w.t + ' · 습도 ' + pct(todayW.hum) + '</div></div></div>' +
          '<div class="result-sub" style="margin-top:14px;line-height:1.6;color:var(--text)">' + cmp + '</div></div>'));

        // 2) 같은 기간(±3일) 연도별 평균 비교
        const yrRows = sets.map((s, i) => {
          const mx = avg(s.days.map(d => d.max)), mn = avg(s.days.map(d => d.min));
          return { s, mx, mn, i };
        });
        const now = yrRows[0];
        box.appendChild(ui.el('<div class="section-title">같은 기간 비교 (' + md(shiftDate(todayStr, -3)).split(' ')[0] + ' ~ ' + md(shiftDate(todayStr, 3)).split(' ')[0] + ', 7일 평균)</div>'));
        box.appendChild(ui.el('<div class="table-wrap"><table class="table"><thead><tr><th>연도</th><th>평균 최고</th><th>평균 최저</th><th>올해가</th></tr></thead><tbody>' +
          yrRows.map(r => '<tr' + (r.i === 0 ? ' class="hl"' : '') + '><td class="em">' + r.s.label + ' <small class="muted">' + r.s.y + '</small></td><td>' + deg(r.mx) + '</td><td>' + deg(r.mn) + '</td>' +
            '<td>' + (r.i === 0 ? '-' : diffText(((now.mx - r.mx) + (now.mn - r.mn)) / 2)) + '</td></tr>').join('') +
          '</tbody></table></div>'));
        box.appendChild(ui.el('<p class="est-note">"올해가" = 올해 7일 평균기온(최고·최저 평균)이 그해보다 높은지 낮은지</p>'));

        // 3) 연도별 일별 날씨
        box.appendChild(ui.el('<div class="section-title big">일별 날씨 (오늘 기준 ±3일)</div>'));
        const seg = ui.segmented(sets.map((s, i) => ({ value: String(i), label: s.label })), String(st.tab || 0), v => { st.tab = +v; st.save(); list(); }, 'wide');
        box.appendChild(seg);
        const listBox = ui.el('<div class="group"></div>');
        box.appendChild(listBox);
        function list() {
          const s = sets[st.tab || 0];
          listBox.innerHTML = '';
          s.days.forEach((d, i) => {
            const ww = wx(d.code);
            const isToday = i === 3;
            const future = s.y === t.y && d.date > todayStr;
            listBox.appendChild(ui.el('<div class="row wx-row' + (isToday ? ' today' : '') + '">' +
              '<span class="wx-date">' + md(d.date) + (isToday ? '<small>' + (s.y === t.y ? '오늘' : '같은 날') + '</small>' : future ? '<small>예보</small>' : '') + '</span>' +
              '<span class="wx-icon">' + ww.e + '</span><span class="wx-text">' + ww.t + '</span>' +
              '<span class="wx-temp"><b class="up">' + deg(d.max) + '</b> <b class="down">' + deg(d.min) + '</b></span>' +
              '<span class="wx-hum">💧' + pct(d.hum) + '</span></div>'));
          });
        }
        list();

        // 4) 같은 달 날씨 (4년 전 ~ 작년)
        const months = [];
        for (let y = t.y - 4; y <= t.y - 1; y++) {
          const pre = y + '-' + String(t.m).padStart(2, '0') + '-';
          const ds2 = past.filter(d => d.date.startsWith(pre));
          if (!ds2.length) { months.push({ y, none: true }); continue; }
          const cnt = {}; ds2.forEach(d => { const g = wx(d.code).g; cnt[g] = (cnt[g] || 0) + 1; });
          const main = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
          months.push({
            y, mx: avg(ds2.map(d => d.max)), mn: avg(ds2.map(d => d.min)), hum: avg(ds2.map(d => d.hum)),
            rainy: ds2.filter(d => d.rain >= 1).length, n: ds2.length, main,
            hot: Math.max.apply(null, ds2.map(d => d.max).filter(v => v !== null)),
            cold: Math.min.apply(null, ds2.map(d => d.min).filter(v => v !== null))
          });
        }
        const ok = months.filter(m => !m.none);
        const gIcon = { '맑음': '☀️', '구름': '⛅', '흐림': '☁️', '비': '🌧️', '눈': '🌨️' };
        box.appendChild(ui.el('<div class="section-title big">' + t.m + '월 날씨 (4년 전 ~ 작년)</div>'));
        box.appendChild(ui.el('<div class="table-wrap"><table class="table"><thead><tr><th>연도</th><th>평균 최고/최저</th><th>비·눈 온 날</th><th>주된 날씨</th></tr></thead><tbody>' +
          months.map(m => m.none ? '<tr><td class="em">' + m.y + '</td><td colspan="3" class="muted">자료 없음</td></tr>' :
            '<tr><td class="em">' + m.y + '</td><td>' + deg(m.mx) + ' / ' + deg(m.mn) + '</td><td>' + m.rainy + '일</td><td>' + (gIcon[m.main] || '') + ' ' + m.main + '</td></tr>').join('') +
          (ok.length ? '<tr class="hl"><td class="em">평균</td><td>' + deg(avg(ok.map(m => m.mx))) + ' / ' + deg(avg(ok.map(m => m.mn))) + '</td><td>' + F.fmt(avg(ok.map(m => m.rainy)), 1) + '일</td><td>-</td></tr>' : '') +
          '</tbody></table></div>'));
        if (ok.length) {
          const hot = ok.reduce((a, b) => b.hot > a.hot ? b : a), cold = ok.reduce((a, b) => b.cold < a.cold ? b : a);
          box.appendChild(ui.el('<p class="footnote">' + t.m + '월 평균 습도 ' + pct(avg(ok.map(m => m.hum))) + ' · 가장 더웠던 날 ' + deg(hot.hot) + '(' + hot.y + '년) · 가장 추웠던 날 ' + deg(cold.cold) + '(' + cold.y + '년)</p>'));
        }
      }

      page.nav.querySelector('[data-refresh]').onclick = () => load(true);
      load(false);
    }
  });
})();
