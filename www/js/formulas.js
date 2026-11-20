/* 계산 로직 모음 (화면과 분리된 순수 함수)
 * 브라우저에서는 LC.F, Node 테스트에서는 require('./formulas.js') 로 사용합니다.
 */
(function (root, factory) {
  const F = factory();
  if (typeof module === 'object' && module.exports) module.exports = F;
  else { root.LC = root.LC || {}; root.LC.F = F; }
})(typeof self !== 'undefined' ? self : this, function () {

  /* ---------- 숫자 유틸 ---------- */
  // 부동소수점 오차 정리 (0.1 + 0.2 = 0.30000000000000004 → 0.3)
  function fix(x) {
    if (!isFinite(x)) return x;
    return parseFloat(x.toPrecision(14));
  }

  // 천 단위 콤마 + 소수 자릿수 제한
  function fmt(x, maxFrac, minFrac) {
    if (x === null || x === undefined || isNaN(x)) return '-';
    if (!isFinite(x)) return '∞';
    maxFrac = maxFrac === undefined ? 2 : maxFrac;
    const abs = Math.abs(x);
    if (abs >= 1e15) {
      return x.toExponential(6).replace(/\.?0+e/, 'e');
    }
    return x.toLocaleString('en-US', { maximumFractionDigits: maxFrac, minimumFractionDigits: minFrac || 0 });
  }

  // 유효숫자 기준 표시 (단위 변환 결과용)
  function fmtSig(x, sig) {
    if (x === null || x === undefined || isNaN(x)) return '-';
    if (x === 0) return '0';
    sig = sig || 10;
    const abs = Math.abs(x);
    if (abs >= 1e15 || abs < 1e-9) return x.toExponential(5).replace(/\.?0+e/, 'e');
    const v = parseFloat(x.toPrecision(sig));
    const intDigits = Math.max(1, Math.floor(Math.log10(abs)) + 1);
    const frac = Math.min(10, Math.max(0, sig - intDigits));
    return v.toLocaleString('en-US', { maximumFractionDigits: frac });
  }

  function won(x) { return fmt(Math.round(x), 0) + '원'; }

  // 금액 한글 읽기: 123456789 → 1억 2,345만 6,789원
  function koreanAmount(n) {
    n = Math.floor(Math.abs(n));
    if (!n) return '';
    const units = ['', '만', '억', '조', '경'];
    const parts = [];
    let i = 0;
    while (n > 0 && i < units.length) {
      const chunk = n % 10000;
      if (chunk) parts.unshift(chunk.toLocaleString('en-US') + units[i]);
      n = Math.floor(n / 10000); i++;
    }
    return parts.join(' ') + '원';
  }

  function parseNum(s) {
    if (typeof s === 'number') return s;
    if (s === null || s === undefined) return NaN;
    const t = String(s).replace(/,/g, '').trim();
    if (t === '' || t === '-' || t === '.') return NaN;
    return Number(t);
  }

  /* ---------- 기본 계산기 ----------
   * tokens: [{t:'n', s:'12.5', p:false}, {t:'o', v:'+'}, ...]
   * 우선순위: ×, ÷ > +, −
   * 퍼센트 규칙(일반 계산기 방식):
   *   A + B%  → A + A×B/100      A − B% → A − A×B/100
   *   A × B%  → A × B/100        A ÷ B% → A ÷ (B/100)
   */
  function evaluate(tokens) {
    const list = tokens.slice();
    while (list.length && list[list.length - 1].t === 'o') list.pop();
    if (!list.length) return 0;

    let i = 0;
    function num(tok) {
      const v = parseNum(tok.s);
      return isNaN(v) ? 0 : v;
    }
    function factor() {
      const tok = list[i++];
      const v = num(tok);
      return { v: tok.p ? fix(v / 100) : v, pct: tok.p, raw: v };
    }
    function term() {
      let left = factor();
      let single = true;
      while (i < list.length && (list[i].v === '×' || list[i].v === '÷')) {
        const op = list[i++].v;
        const right = factor();
        left = { v: op === '×' ? fix(left.v * right.v) : fix(left.v / right.v), pct: false };
        single = false;
      }
      left.single = single;
      return left;
    }
    let acc = term().v;
    while (i < list.length) {
      const op = list[i++].v;
      const right = term();
      let rv = right.v;
      if (right.single && right.pct) rv = fix(acc * right.raw / 100);
      acc = op === '+' ? fix(acc + rv) : fix(acc - rv);
    }
    return acc;
  }

  /* ---------- 단위 변환 ---------- */
  const PYEONG = 400 / 121; // 1평 = 3.305785…㎡
  const AREA_UNITS = [
    { id: 'm2', name: '제곱미터', sym: '㎡', f: 1 },
    { id: 'py', name: '평', sym: '평', f: PYEONG },
    { id: 'ha', name: '헥타르', sym: 'ha', f: 10000 },
    { id: 'ac', name: '에이커', sym: 'ac', f: 4046.8564224 },
    { id: 'km2', name: '제곱킬로미터', sym: '㎢', f: 1e6 },
    { id: 'ft2', name: '제곱피트', sym: 'ft²', f: 0.09290304 }
  ];
  const LENGTH_UNITS = [
    { id: 'm', name: '미터', sym: 'm', f: 1 },
    { id: 'km', name: '킬로미터', sym: 'km', f: 1000 },
    { id: 'cm', name: '센티미터', sym: 'cm', f: 0.01 },
    { id: 'in', name: '인치', sym: 'in', f: 0.0254 },
    { id: 'ft', name: '피트', sym: 'ft', f: 0.3048 },
    { id: 'mi', name: '마일', sym: 'mi', f: 1609.344 },
    { id: 'nmi', name: '해리', sym: 'NM', f: 1852 }
  ];
  const MACH_KMH = 340.29 * 3.6; // 해수면 15℃ 기준 음속
  const SPEED_UNITS = [
    { id: 'kmh', name: '시속', sym: 'km/h', f: 1 },
    { id: 'mph', name: '마일', sym: 'mph', f: 1.609344 },
    { id: 'kn', name: '노트', sym: 'kn', f: 1.852 },
    { id: 'mach', name: '마하', sym: 'Mach', f: MACH_KMH },
    { id: 'ms', name: '초속', sym: 'm/s', f: 3.6 }
  ];
  function convert(value, from, units) {
    const base = value * from.f;
    return units.map(u => ({ unit: u, value: base / u.f }));
  }

  // 화면 대각선(인치) → 가로/세로(cm)
  function screenSize(inch, rw, rh) {
    const d = inch * 2.54;
    const k = d / Math.sqrt(rw * rw + rh * rh);
    return { diagonal: d, width: k * rw, height: k * rh };
  }

  /* ---------- 할인 ---------- */
  function discount(price, rate, extraRate) {
    const r1 = (rate || 0) / 100, r2 = (extraRate || 0) / 100;
    const after1 = price * (1 - r1);
    const final = after1 * (1 - r2);
    return {
      first: after1,
      final: final,
      saved: price - final,
      totalRate: price ? (1 - final / price) * 100 : 0
    };
  }
  function discountRate(price, sale) {
    return { saved: price - sale, rate: price ? (price - sale) / price * 100 : 0 };
  }

  /* ---------- 날짜 ---------- */
  const DAY = 86400000;
  function dayNum(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / DAY); }
  function parseYMD(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  function fromDayNum(n) {
    const dt = new Date(n * DAY);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), w: dt.getUTCDay() };
  }
  function ymdStr(o) { return o.y + '-' + String(o.m).padStart(2, '0') + '-' + String(o.d).padStart(2, '0'); }
  function todayYMD(now) {
    now = now || new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), w: now.getDay() };
  }
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  function weekday(o) { return WEEK[fromDayNum(dayNum(o.y, o.m, o.d)).w]; }
  function dateLabel(o, withWeek) {
    const s = o.y + '년 ' + o.m + '월 ' + o.d + '일';
    return withWeek === false ? s : s + ' (' + weekday(o) + ')';
  }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  // 기념일/디데이 계산
  // item: { date:'YYYY-MM-DD', includeStart:true, repeat:'none'|'yearly' }
  function dday(item, today) {
    const base = parseYMD(item.date);
    if (!base) return null;
    const t = today || todayYMD();
    const tn = dayNum(t.y, t.m, t.d);
    if (item.repeat === 'yearly') {
      let y = t.y;
      const occ = yy => dayNum(yy, base.m, Math.min(base.d, daysInMonth(yy, base.m)));
      if (occ(y) < tn) y++;
      const left = occ(y) - tn;
      return { mode: 'yearly', left: left, next: fromDayNum(occ(y)), years: y - base.y,
               label: left === 0 ? 'D-Day' : 'D-' + left };
    }
    const bn = dayNum(base.y, base.m, base.d);
    const diff = tn - bn; // 양수 = 지난 날
    if (diff >= 0) {
      const nth = diff + (item.includeStart !== false ? 1 : 0);
      return { mode: 'since', diff: diff, nth: nth, label: diff === 0 ? 'D-Day' : 'D+' + diff };
    }
    return { mode: 'until', diff: diff, left: -diff, label: 'D-' + (-diff) };
  }
  // 기준일로부터 N일째 되는 날
  function nthDay(baseStr, n, includeStart) {
    const b = parseYMD(baseStr);
    const off = includeStart ? n - 1 : n;
    return fromDayNum(dayNum(b.y, b.m, b.d) + off);
  }
  function daysBetween(aStr, bStr) {
    const a = parseYMD(aStr), b = parseYMD(bStr);
    return dayNum(b.y, b.m, b.d) - dayNum(a.y, a.m, a.d);
  }
  // 두 날짜 사이 "X년 Y개월 Z일"
  function ymdDiff(aStr, bStr) {
    let a = parseYMD(aStr), b = parseYMD(bStr);
    if (dayNum(a.y, a.m, a.d) > dayNum(b.y, b.m, b.d)) { const t = a; a = b; b = t; }
    const bn = dayNum(b.y, b.m, b.d);
    const addMonths = k => {
      const y = a.y + Math.floor((a.m - 1 + k) / 12), m = (a.m - 1 + k) % 12 + 1;
      return dayNum(y, m, Math.min(a.d, daysInMonth(y, m)));
    };
    let k = (b.y - a.y) * 12 + (b.m - a.m);
    while (k > 0 && addMonths(k) > bn) k--;
    return { y: Math.floor(k / 12), m: k % 12, d: bn - addMonths(k) };
  }

  /* ---------- 나이 ----------
   * 만 나이: 생일이 지날 때마다 1살 (2023.6.28 '만 나이 통일법' 이후 법적 기준)
   * 연 나이: 올해 연도 − 출생 연도 (병역법·청소년보호법 등)
   * 세는 나이: 연 나이 + 1 (한국식 나이)
   */
  const GAN = '갑을병정무기경신임계', JI = '자축인묘진사오미신유술해';
  const ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  function yearGanji(y) {
    const g = ((y - 4) % 10 + 10) % 10, j = ((y - 4) % 12 + 12) % 12;
    return { name: GAN[g] + JI[j] + '년', animal: ANIMAL[j] };
  }
  // by: 출생연도, bm/bd: 월·일(없으면 null), t: 기준일 {y,m,d}
  function age(by, bm, bd, t) {
    t = t || todayYMD();
    const yearAge = t.y - by;
    const r = { yearAge: yearAge, koreanAge: yearAge + 1, exact: !!(bm && bd) };
    if (r.exact) {
      const passed = t.m > bm || (t.m === bm && t.d >= bd);
      r.manAge = yearAge - (passed ? 0 : 1);
      r.birthdayPassed = passed;
      const tn = dayNum(t.y, t.m, t.d);
      const occ = yy => dayNum(yy, bm, Math.min(bd, daysInMonth(yy, bm)));
      let ny = t.y; if (occ(ny) < tn) ny++;
      r.nextBirthday = fromDayNum(occ(ny));
      r.daysToBirthday = occ(ny) - tn;
      r.nextAge = ny - by;
      r.daysLived = tn - dayNum(by, bm, bd);
    } else {
      r.manAgeMin = yearAge - 1;   // 생일 전
      r.manAgeMax = yearAge;       // 생일 후
    }
    return r;
  }
  // 나이 → 출생연도. kind: 'man' | 'korean' | 'year'
  function birthYearFromAge(n, kind, t) {
    t = t || todayYMD();
    if (kind === 'korean') return { years: [t.y - n + 1] };
    if (kind === 'year') return { years: [t.y - n] };
    // 만 나이 n: 생일이 지났으면 (올해-n)년생, 안 지났으면 (올해-n-1)년생
    const tn = dayNum(t.y, t.m, t.d);
    const latest = fromDayNum(tn);                       // 오늘이 생일이면 만 n세
    const earliestY = t.y - n - 1;
    const earliest = fromDayNum(dayNum(earliestY, t.m, Math.min(t.d, daysInMonth(earliestY, t.m))) + 1);
    latest.y = t.y - n; latest.d = Math.min(t.d, daysInMonth(latest.y, t.m));
    return { years: [t.y - n, t.y - n - 1], from: earliest, to: latest };
  }

  /* ---------- 대출 ----------
   * method: 'equal'(원리금균등) | 'principal'(원금균등) | 'bullet'(만기일시)
   * months: 전체 대출기간(개월, 거치기간 포함), grace: 거치기간(개월)
   */
  function loan(o) {
    const P = o.principal, i = o.rate / 100 / 12, n = Math.round(o.months);
    const g = o.method === 'bullet' ? 0 : Math.max(0, Math.min(Math.round(o.grace || 0), n - 1));
    const m = n - g;
    const rows = [];
    let bal = P, totI = 0, totP = 0;
    for (let k = 1; k <= n; k++) {
      let interest = bal * i, princ = 0, phase = 'repay';
      if (o.method === 'bullet') {
        princ = k === n ? bal : 0;
      } else if (k <= g) {
        phase = 'grace';
      } else if (o.method === 'equal') {
        const A = i === 0 ? P / m : P * i * Math.pow(1 + i, m) / (Math.pow(1 + i, m) - 1);
        princ = k === n ? bal : A - interest;
      } else {
        princ = k === n ? bal : P / m;
      }
      bal = Math.max(0, bal - princ);
      totI += interest; totP += princ;
      rows.push({ n: k, payment: princ + interest, principal: princ, interest: interest, balance: bal, phase: phase });
    }
    const repayRows = rows.filter(r => r.phase === 'repay');
    return {
      rows: rows,
      graceMonths: g,
      graceInterest: g ? rows[0].interest : 0,
      firstPayment: repayRows.length ? repayRows[0].payment : 0,
      lastPayment: repayRows.length ? repayRows[repayRows.length - 1].payment : 0,
      firstInterest: repayRows.length ? repayRows[0].interest : 0,
      totalInterest: totI,
      totalPayment: totP + totI,
      avgPayment: (totP + totI) / n
    };
  }

  /* ---------- 예·적금 ----------
   * type: 'deposit'(예금, 목돈 예치) | 'installment'(적금, 매월 납입)
   * compound: 'simple'(단리) | 'monthly'(월복리)
   */
  function savings(o) {
    const A = o.amount, n = Math.round(o.months), r = o.rate / 100, i = r / 12;
    let principal, interest;
    if (o.type === 'deposit') {
      principal = A;
      interest = o.compound === 'monthly' ? A * (Math.pow(1 + i, n) - 1) : A * r * n / 12;
    } else {
      principal = A * n;
      interest = o.compound === 'monthly'
        ? (i === 0 ? 0 : A * (1 + i) * (Math.pow(1 + i, n) - 1) / i - A * n)
        : A * i * n * (n + 1) / 2;
    }
    interest = Math.floor(interest);
    const tax = Math.floor(interest * (o.taxRate || 0) / 100);
    return { principal: principal, interest: interest, tax: tax, net: interest - tax, total: principal + interest - tax };
  }

  /* ---------- 속도 / 페이스 ---------- */
  function paceFromKmh(kmh) { // 1km 이동 시간(초)
    return kmh > 0 ? 3600 / kmh : NaN;
  }
  function kmhFromPace(sec) { return sec > 0 ? 3600 / sec : NaN; }
  function mmss(sec) {
    if (!isFinite(sec)) return '-';
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (h) return h + '시간 ' + m + '분 ' + s + '초';
    return (m ? m + '분 ' : '') + s + '초';
  }

  /* ---------- BMI (대한비만학회 2022 기준) ---------- */
  const BMI_LEVELS = [
    { max: 18.5, name: '저체중', color: '#5AC8FA' },
    { max: 23, name: '정상', color: '#34C759' },
    { max: 25, name: '비만 전단계', color: '#FFCC00' },
    { max: 30, name: '1단계 비만', color: '#FF9500' },
    { max: 35, name: '2단계 비만', color: '#FF6B3D' },
    { max: Infinity, name: '3단계 비만', color: '#FF3B30' }
  ];
  function bmi(heightCm, weightKg) {
    const h = heightCm / 100;
    const v = weightKg / (h * h);
    const idx = BMI_LEVELS.findIndex(l => v < l.max);
    return {
      bmi: v, level: BMI_LEVELS[idx], levelIndex: idx,
      normalMin: 18.5 * h * h, normalMax: 22.9 * h * h, standard: 22 * h * h
    };
  }

  /* ---------- 체지방률 ---------- */
  // BMI 기반 추정 (Deurenberg 1991)
  function bodyFatBmi(sex, age, heightCm, weightKg) {
    const b = bmi(heightCm, weightKg).bmi;
    const adult = 1.2 * b + 0.23 * age - 10.8 * (sex === 'm' ? 1 : 0) - 5.4;
    const child = 1.51 * b - 0.70 * age - 3.6 * (sex === 'm' ? 1 : 0) + 1.4;
    return age < 18 ? child : adult;
  }
  // 미 해군(US Navy) 둘레 측정법 (cm)
  function bodyFatNavy(sex, heightCm, neck, waist, hip) {
    if (sex === 'm') {
      if (waist - neck <= 0) return NaN;
      return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
    }
    if (waist + hip - neck <= 0) return NaN;
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(heightCm)) - 450;
  }
  // 미국운동협회(ACE) 분류
  const FAT_LEVELS = {
    m: [{ max: 6, name: '필수 지방' }, { max: 14, name: '운동선수' }, { max: 18, name: '건강(피트니스)' }, { max: 25, name: '평균' }, { max: Infinity, name: '비만' }],
    f: [{ max: 14, name: '필수 지방' }, { max: 21, name: '운동선수' }, { max: 25, name: '건강(피트니스)' }, { max: 32, name: '평균' }, { max: Infinity, name: '비만' }]
  };
  function fatLevel(sex, pct) {
    const L = FAT_LEVELS[sex];
    const idx = L.findIndex(l => pct < l.max);
    return { index: idx, name: L[idx].name, levels: L };
  }

  return {
    fix, fmt, fmtSig, won, koreanAmount, parseNum, evaluate,
    PYEONG, AREA_UNITS, LENGTH_UNITS, SPEED_UNITS, MACH_KMH, convert, screenSize,
    discount, discountRate,
    dayNum, parseYMD, fromDayNum, ymdStr, todayYMD, weekday, dateLabel, daysInMonth, dday, nthDay, daysBetween, ymdDiff, WEEK,
    yearGanji, age, birthYearFromAge,
    loan, savings, paceFromKmh, kmhFromPace, mmss,
    BMI_LEVELS, bmi, bodyFatBmi, bodyFatNavy, FAT_LEVELS, fatLevel
  };
});
