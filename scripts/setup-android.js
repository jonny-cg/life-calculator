/* `npx cap add android` 직후 한 번 실행: AdMob 앱 ID를 AndroidManifest.xml 에 등록합니다.
 * 실제 출시 전에는 ADMOB_APP_ID 를 AdMob 콘솔에서 받은 앱 ID로 바꾸고 다시 실행하세요.
 *   node scripts/setup-android.js ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
 */
const fs = require('fs');
const path = require('path');

const ADMOB_APP_ID = process.argv[2] || 'ca-app-pub-3940256099942544~3347511713'; // Google 테스트 앱 ID
const base = path.join(__dirname, '..', 'android', 'app', 'src', 'main');
const manifest = path.join(base, 'AndroidManifest.xml');
const strings = path.join(base, 'res', 'values', 'strings.xml');

if (!fs.existsSync(manifest)) {
  console.error('android 폴더가 없습니다. 먼저 `npx cap add android` 를 실행하세요.');
  process.exit(1);
}

// 위치 권한 (이전 날씨 메뉴의 '현재 위치' 기능)
{
  let mf = fs.readFileSync(manifest, 'utf8');
  ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'].forEach(p => {
    if (!mf.includes(p)) mf = mf.replace('</manifest>', '    <uses-permission android:name="' + p + '" />\n</manifest>');
  });
  fs.writeFileSync(manifest, mf);
  console.log('✔ 위치 권한 추가');
}

// 광고 플러그인(@capacitor-community/admob)이 설치된 경우에만 AdMob 앱 ID 등록
const adsInstalled = fs.existsSync(path.join(__dirname, '..', 'node_modules', '@capacitor-community', 'admob'));
let m = fs.readFileSync(manifest, 'utf8');
if (adsInstalled && !m.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  m = m.replace(/<application([^>]*)>/, match =>
    match + '\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />');
  fs.writeFileSync(manifest, m);
  console.log('✔ AndroidManifest.xml 에 AdMob 메타데이터 추가');
}

let s = fs.readFileSync(strings, 'utf8');
if (!adsInstalled) {
  console.log('· 광고 없는 버전: AdMob 설정 건너뜀');
} else if (s.includes('name="admob_app_id"')) {
  s = s.replace(/<string name="admob_app_id">[^<]*<\/string>/, `<string name="admob_app_id">${ADMOB_APP_ID}</string>`);
} else {
  s = s.replace('</resources>', `    <string name="admob_app_id">${ADMOB_APP_ID}</string>\n</resources>`);
}
if (adsInstalled) {
  fs.writeFileSync(strings, s);
  console.log('✔ strings.xml admob_app_id =', ADMOB_APP_ID);
}

// 앱 아이콘 교체 (resources/android/*.png → mipmap 폴더)
const iconSrc = path.join(__dirname, '..', 'resources', 'android');
['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].forEach(d => {
  const dir = path.join(base, 'res', 'mipmap-' + d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(iconSrc, 'ic_launcher-' + d + '.png'), path.join(dir, 'ic_launcher.png'));
  fs.copyFileSync(path.join(iconSrc, 'ic_launcher_round-' + d + '.png'), path.join(dir, 'ic_launcher_round.png'));
  // 적응형 아이콘(Android 8+) 레이어
  fs.copyFileSync(path.join(iconSrc, 'ic_launcher_foreground-' + d + '.png'), path.join(dir, 'ic_launcher_foreground.png'));
  fs.copyFileSync(path.join(iconSrc, 'ic_launcher_background-' + d + '.png'), path.join(dir, 'ic_launcher_background.png'));
});
const anydpi = path.join(base, 'res', 'mipmap-anydpi-v26');
fs.mkdirSync(anydpi, { recursive: true });
const adaptive = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
  '    <background android:drawable="@mipmap/ic_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n';
fs.writeFileSync(path.join(anydpi, 'ic_launcher.xml'), adaptive);
fs.writeFileSync(path.join(anydpi, 'ic_launcher_round.xml'), adaptive);
// 기존 템플릿의 drawable 전경(벡터) 제거 — mipmap 전경과 이름이 겹치지 않게
['drawable-v24', 'drawable'].forEach(dd => {
  const f = path.join(base, 'res', dd, 'ic_launcher_foreground.xml');
  if (fs.existsSync(f)) fs.unlinkSync(f);
});
console.log('✔ 앱 아이콘 적용 (적응형 아이콘 포함)');
