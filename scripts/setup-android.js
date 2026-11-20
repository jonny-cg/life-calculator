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

let m = fs.readFileSync(manifest, 'utf8');
if (!m.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  m = m.replace(/<application([^>]*)>/, match =>
    match + '\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />');
  fs.writeFileSync(manifest, m);
  console.log('✔ AndroidManifest.xml 에 AdMob 메타데이터 추가');
}

let s = fs.readFileSync(strings, 'utf8');
if (s.includes('name="admob_app_id"')) {
  s = s.replace(/<string name="admob_app_id">[^<]*<\/string>/, `<string name="admob_app_id">${ADMOB_APP_ID}</string>`);
} else {
  s = s.replace('</resources>', `    <string name="admob_app_id">${ADMOB_APP_ID}</string>\n</resources>`);
}
fs.writeFileSync(strings, s);
console.log('✔ strings.xml admob_app_id =', ADMOB_APP_ID);

// 앱 아이콘 교체 (resources/android/*.png → mipmap 폴더)
const iconSrc = path.join(__dirname, '..', 'resources', 'android');
['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].forEach(d => {
  const dir = path.join(base, 'res', 'mipmap-' + d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(iconSrc, 'ic_launcher-' + d + '.png'), path.join(dir, 'ic_launcher.png'));
  fs.copyFileSync(path.join(iconSrc, 'ic_launcher_round-' + d + '.png'), path.join(dir, 'ic_launcher_round.png'));
  const fg = path.join(dir, 'ic_launcher_foreground.png');
  if (fs.existsSync(fg)) fs.unlinkSync(fg);
});
// 적응형 아이콘 설정 제거 (위 PNG 아이콘이 그대로 쓰이도록)
const anydpi = path.join(base, 'res', 'mipmap-anydpi-v26');
if (fs.existsSync(anydpi)) fs.rmSync(anydpi, { recursive: true, force: true });
console.log('✔ 앱 아이콘 적용');
