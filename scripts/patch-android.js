// Dijalankan setelah `cap add android`: orientasi landscape, fullscreen, ikon, versi.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const A = path.join(root, 'android');
const app = path.join(A, 'app');
const res = path.join(app, 'src', 'main', 'res');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, s) => fs.writeFileSync(f, s);
const log = m => console.log('[patch-android] ' + m);

if (!fs.existsSync(A)) { console.error('Folder android/ belum ada. Jalankan `npx cap add android` dulu.'); process.exit(1); }

// 1) Manifest: landscape penuh
const mf = path.join(app, 'src', 'main', 'AndroidManifest.xml');
let m = read(mf);
if (!/screenOrientation/.test(m)) {
  m = m.replace(/<activity\b/, '<activity\n            android:screenOrientation="sensorLandscape"');
  write(mf, m); log('orientasi sensorLandscape');
}

// 2) Tema: fullscreen, notch, latar gelap saat start (tanpa kilat putih)
const st = path.join(res, 'values', 'styles.xml');
if (fs.existsSync(st)) {
  let s = read(st);
  s = s.replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, `$1
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>`);
  s = s.replace(/@drawable\/splash/g, '#07090E');
  write(st, s); log('tema fullscreen + latar gelap');
}

// 3) MainActivity: sembunyikan bar sistem, layar tetap menyala
const pkgId = JSON.parse(read(path.join(root, 'capacitor.config.json'))).appId;
const javaDir = path.join(app, 'src', 'main', 'java', ...pkgId.split('.'));
fs.mkdirSync(javaDir, { recursive: true });
write(path.join(javaDir, 'MainActivity.java'), `package ${pkgId};

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }
}
`);
log('MainActivity immersive');

// 4) Ikon launcher
const iconsSrc = path.join(root, 'resources', 'icons');
if (fs.existsSync(iconsSrc)) {
  for (const d of fs.readdirSync(iconsSrc)) {
    const from = path.join(iconsSrc, d), to = path.join(res, d);
    if (!fs.statSync(from).isDirectory()) continue;
    fs.mkdirSync(to, { recursive: true });
    for (const f of fs.readdirSync(from)) fs.copyFileSync(path.join(from, f), path.join(to, f));
  }
  fs.rmSync(path.join(res, 'mipmap-anydpi-v26'), { recursive: true, force: true }); // pakai PNG di semua versi
  log('ikon diganti');
}

// 5) Versi dari package.json + nomor build CI
const bg = path.join(app, 'build.gradle');
if (fs.existsSync(bg)) {
  let g = read(bg);
  const code = parseInt(process.env.VERSION_CODE || process.env.GITHUB_RUN_NUMBER || '1', 10);
  g = g.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);
  write(bg, g); log(`versionCode ${code}, versionName ${pkg.version}`);
}
log('selesai');
