// 실행: node tests/formulas.test.js
const F = require('../www/js/formulas.js');
let fail = 0, pass = 0;
function eq(name, got, exp, tol = 1e-6) {
  const ok = typeof exp === 'number' ? Math.abs(got - exp) <= tol * Math.max(1, Math.abs(exp)) : JSON.stringify(got) === JSON.stringify(exp);
  ok ? pass++ : (fail++, console.log('FAIL', name, 'got', got, 'expected', exp));
}
const n = (s, p) => ({ t: 'n', s: String(s), p: !!p }), o = v => ({ t: 'o', v });
// 계산기
eq('0.1+0.2', F.evaluate([n(0.1), o('+'), n(0.2)]), 0.3, 0);
eq('precedence', F.evaluate([n(2), o('+'), n(3), o('×'), n(4)]), 14);
eq('div', F.evaluate([n(10), o('÷'), n(4)]), 2.5);
eq('pct add', F.evaluate([n(1000), o('+'), n(10, 1)]), 1100);
eq('pct sub', F.evaluate([n(50000), o('−'), n(20, 1)]), 40000);
eq('pct mul', F.evaluate([n(200), o('×'), n(15, 1)]), 30);
eq('pct alone', F.evaluate([n(50, 1)]), 0.5);
eq('trailing op', F.evaluate([n(7), o('×')]), 7);
eq('div0', isFinite(F.evaluate([n(1), o('÷'), n(0)])), false);
eq('neg', F.evaluate([n(-5), o('×'), n(3)]), -15);
// 단위
const py = F.AREA_UNITS[1];
eq('84m2 -> 평', F.convert(84, F.AREA_UNITS[0], F.AREA_UNITS)[1].value, 25.41, 1e-3);
eq('1평 m2', F.convert(1, py, F.AREA_UNITS)[0].value, 3.305785, 1e-6);
eq('1ac m2', F.convert(1, F.AREA_UNITS[3], F.AREA_UNITS)[0].value, 4046.8564224);
eq('1mi km', F.convert(1, F.LENGTH_UNITS[5], F.LENGTH_UNITS)[1].value, 1.609344);
eq('1nmi m', F.convert(1, F.LENGTH_UNITS[6], F.LENGTH_UNITS)[0].value, 1852);
eq('55in diag cm', F.screenSize(55, 16, 9).diagonal, 139.7);
eq('55in width', F.screenSize(55, 16, 9).width, 121.76, 1e-3);
eq('100kn kmh', F.convert(100, F.SPEED_UNITS[2], F.SPEED_UNITS)[0].value, 185.2);
eq('pace 10kmh', F.paceFromKmh(10), 360);
eq('mmss', F.mmss(361), '6분 1초');
// 할인
eq('discount 20+10', F.discount(10000, 20, 10).totalRate, 28);
eq('discount final', F.discount(10000, 20, 10).final, 7200);
eq('rate', F.discountRate(50000, 35000).rate, 30);
// 날짜
const today = { y: 2026, m: 11, d: 20 };
eq('since nth', F.dday({ date: '2026-11-11', includeStart: true }, today).nth, 10);
eq('since D+', F.dday({ date: '2026-11-11', includeStart: false }, today).label, 'D+9');
eq('until', F.dday({ date: '2026-12-25' }, today).label, 'D-35');
eq('yearly', F.dday({ date: '1990-11-21', repeat: 'yearly' }, today).left, 1);
eq('yearly passed', F.dday({ date: '1990-11-19', repeat: 'yearly' }, today).left, 364);
eq('nthDay 100', F.ymdStr(F.nthDay('2026-01-01', 100, true)), '2026-04-10');
eq('between', F.daysBetween('2026-01-01', '2026-12-31'), 364);
eq('ymdDiff2', F.ymdDiff('2026-01-15', '2026-03-10'), { y: 0, m: 1, d: 23 });
eq('ymdDiff', F.ymdDiff('2024-01-31', '2026-03-01'), { y: 2, m: 1, d: 1 });
eq('leap feb29 yearly', F.dday({ date: '2024-02-29', repeat: 'yearly' }, { y: 2026, m: 3, d: 1 }).left, 364);
// 대출: 1억, 연 4.5%, 30년 원리금균등 → 월 506,685원 (일반 금융계산기 값)
let L = F.loan({ principal: 1e8, rate: 4.5, months: 360, grace: 0, method: 'equal' });
eq('annuity payment', Math.round(L.firstPayment), 506685);
eq('annuity total interest', Math.round(L.totalInterest), 82406513, 1e-5);
eq('annuity end balance', L.rows[359].balance, 0);
L = F.loan({ principal: 1.2e7, rate: 6, months: 12, grace: 0, method: 'principal' });
eq('principal first', L.firstPayment, 1060000);
eq('principal total interest', L.totalInterest, 390000);
L = F.loan({ principal: 1e7, rate: 12, months: 12, method: 'bullet' });
eq('bullet interest', L.totalInterest, 1200000);
L = F.loan({ principal: 1.2e7, rate: 6, months: 24, grace: 12, method: 'principal' });
eq('grace interest', L.graceInterest, 60000);
eq('grace months', L.rows.filter(r => r.phase === 'grace').length, 12);
eq('grace payoff', L.rows[23].balance, 0);
eq('zero rate', F.loan({ principal: 1200, rate: 0, months: 12, method: 'equal' }).firstPayment, 100);
// 예적금
let S = F.savings({ type: 'installment', compound: 'simple', amount: 1e6, rate: 4, months: 12, taxRate: 15.4 });
eq('installment simple interest', S.interest, 260000);
eq('installment tax', S.tax, 40040);
eq('installment total', S.total, 12219960);
S = F.savings({ type: 'deposit', compound: 'simple', amount: 1e7, rate: 3, months: 12, taxRate: 15.4 });
eq('deposit simple', S.interest, 300000);
eq('deposit net', S.net, 253800);
S = F.savings({ type: 'deposit', compound: 'monthly', amount: 1e7, rate: 3, months: 12, taxRate: 0 });
eq('deposit monthly', S.interest, 304159);
S = F.savings({ type: 'installment', compound: 'monthly', amount: 1e6, rate: 4, months: 12, taxRate: 0 });
eq('installment monthly', S.interest, 263204);
// BMI / 체지방
eq('bmi', F.bmi(170, 65).bmi, 22.491, 1e-4);
eq('bmi level', F.bmi(170, 72).level.name, '비만 전단계');
eq('bmi level obese', F.bmi(170, 80).level.name, '1단계 비만');
eq('navy male', F.bodyFatNavy('m', 178, 38, 86), 16.5, 0.05);
eq('deurenberg', F.bodyFatBmi('m', 35, 170, 65), 1.2 * 22.4913 + 0.23 * 35 - 10.8 - 5.4, 1e-3);
eq('fat level', F.fatLevel('f', 26).name, '평균');
// 나이
let A = F.age(1990, 5, 15, { y: 2026, m: 11, d: 20 });
eq('man age passed', A.manAge, 36); eq('korean age', A.koreanAge, 37); eq('year age', A.yearAge, 36);
A = F.age(1990, 12, 25, { y: 2026, m: 11, d: 20 });
eq('man age not passed', A.manAge, 35); eq('days to bday', A.daysToBirthday, 35); eq('next age', A.nextAge, 36);
A = F.age(2000, 11, 20, { y: 2026, m: 11, d: 20 });
eq('birthday today', A.manAge, 26); eq('bday dday 0', A.daysToBirthday, 0);
A = F.age(1990, null, null, { y: 2026, m: 11, d: 20 });
eq('year only min', A.manAgeMin, 35); eq('year only max', A.manAgeMax, 36);
eq('ganji 2026', F.yearGanji(2026).name, '병오년'); eq('animal 2020', F.yearGanji(2020).animal, '쥐'); eq('animal 1990', F.yearGanji(1990).animal, '말');
let B = F.birthYearFromAge(36, 'man', { y: 2026, m: 11, d: 20 });
eq('by man', B.years, [1990, 1989]); eq('by from', F.ymdStr(B.from), '1989-11-21'); eq('by to', F.ymdStr(B.to), '1990-11-20');
eq('by korean', F.birthYearFromAge(37, 'korean', { y: 2026, m: 11, d: 20 }).years, [1990]);
eq('by year', F.birthYearFromAge(36, 'year', { y: 2026, m: 11, d: 20 }).years, [1990]);
// 포맷
eq('koreanAmount', F.koreanAmount(123456789), '1억 2,345만 6,789원');
eq('fmt', F.fmt(1234567.891, 2), '1,234,567.89');
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
