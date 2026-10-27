# Naci Crypt

Dungeon crawler pixel art dari **NaciTwo games**.
Founder & developer: Muhammad Ikhsan (Universitas Pamulang, Teknik Informatika), ican3192@gmail.com.

Game ditulis dengan HTML5 Canvas (HTML + beberapa file JS/CSS di `www/`) dan dibungkus jadi aplikasi Android memakai Capacitor. APK dibuat otomatis oleh GitHub Actions.

## Build APK lewat GitHub

1. Buat repo baru di GitHub, lalu push isi folder ini:
   ```bash
   git init
   git add .
   git commit -m "Naci Crypt"
   git branch -M main
   git remote add origin https://github.com/<username>/naci-crypt.git
   git push -u origin main
   ```
2. Buka tab **Actions** di repo. Workflow **Build Android** jalan otomatis setiap push ke `main` (atau klik **Run workflow**).
3. Setelah hijau, buka run tersebut dan unduh **NaciCrypt-debug-apk** di bagian *Artifacts*. Ekstrak zip-nya, kirim `app-debug.apk` ke HP, lalu install (izinkan "install dari sumber tidak dikenal").

## Rilis untuk Google Play (APK/AAB bertanda tangan)

1. Buat keystore sekali saja dan simpan baik-baik (kalau hilang, update app tidak bisa diterbitkan):
   ```bash
   keytool -genkey -v -keystore nacicrypt.keystore -alias nacicrypt -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 nacicrypt.keystore    # di macOS: base64 -i nacicrypt.keystore
   ```
2. Di repo: **Settings > Secrets and variables > Actions**, tambahkan:
   - `KEYSTORE_BASE64` (hasil base64 di atas)
   - `KEY_ALIAS` (misal `nacicrypt`)
   - `KEYSTORE_PASSWORD`
   - `KEY_PASSWORD`
3. Push lagi. Workflow akan ikut membuat APK dan **AAB** bertanda tangan (artifact **NaciCrypt-release**). Upload file `.aab` ke Play Console.

Nomor versi: `version` di `package.json` jadi `versionName`; nomor run GitHub Actions jadi `versionCode` (naik otomatis).

## Menjalankan di komputer

- Coba di browser: `npm run serve` lalu buka http://localhost:8080 — font pixel sudah di-embed langsung di `style.css` (base64), jadi langsung jalan tanpa langkah tambahan. `npm run prepare:www` masih ada untuk kompatibilitas tapi tidak lagi wajib.
- Build lokal Android (perlu Android Studio dan JDK 21): `npm install && npm run android:setup && npm run android:open`.

## Struktur

| Path | Isi |
|---|---|
| `www/index.html` | Kerangka HTML (layar dan tombol) |
| `www/style.css` | Seluruh gaya |
| `www/assets.js` | Sprite yang di-embed (base64) |
| `www/layout.js` | Tata letak tombol sentuh (fungsi murni, ada tesnya) |
| `www/pose.js` | Aturan pose depan/samping musuh (fungsi murni, ada tesnya) |
| `www/game.js` | Logika game, input, dan editor tombol |
| `test/` | Tes otomatis: `npm test` (Node 22, tanpa dependensi tambahan) |
| `capacitor.config.json` | ID app `com.nacitwo.nacicrypt`, nama, folder web |
| `scripts/patch-android.js` | Landscape, fullscreen, ikon, versi (dijalankan setelah `cap add android`) |
| `resources/icons/` | Ikon launcher untuk semua kepadatan layar |
| `store/icon-512.png` | Ikon 512 px untuk Play Console |
| `.github/workflows/android.yml` | Pipeline build |

Folder `android/` dibuat ulang oleh workflow setiap build, jadi tidak ikut di-commit. Kalau nanti butuh mengubah kode native, jalankan `npm run android:setup` sekali, lalu hapus `android/` dari `.gitignore`.

## Lisensi & dukungan

Hak cipta © 2026 **Muhammad Ikhsan (NaciTwo Games)**. Kode, desain game, teks, dan antarmuka dilindungi hak cipta; baca file [`LICENSE`](LICENSE) untuk yang boleh dan tidak boleh dilakukan. Singkatnya: boleh dimainkan dan dibaca untuk belajar, **tidak boleh** disalin, dijual, disebarkan ulang, dimodifikasi lalu diterbitkan, atau diunggah ke toko aplikasi tanpa izin tertulis.

Suka game ini? Dukung pembuatnya: https://sociabuzz.com/nacitwo/tribe (juga ada tombol **DUKUNG SAYA** di menu).

## Lisensi aset

Seni pixel memakai **Pixel Crawler (Free Pack)** oleh Anokolisa. Menurut `Terms.txt` pack tersebut, aset boleh dipakai untuk produk komersial dan boleh diubah, tetapi tidak boleh dijual atau didistribusikan sebagai aset itu sendiri. Karena sprite sudah tertanam di `www/index.html`, sebaiknya repo ini **private**, atau pastikan tidak ada orang yang bisa mengambilnya sebagai paket aset. Kredit ke Anokolisa tidak wajib, tapi sudah ada di menu Kredit.

Aset tambahan (versi 1.1): **DarkDungeon.png**, **Mini Dungeon Tileset** (Atomic Realm Assets; lisensinya sama: boleh dipakai dan diubah, tidak boleh dipaketkan ulang/dijual), **RPG Items 16x16 Pack 1** dan **Crystals and Ore 24x24**. Untuk dua pack terakhir belum ada file lisensi di dalam zip, jadi cek ketentuan di halaman asalnya. Semua tertanam di `www/assets2.js`, jadi repo tetap sebaiknya **private**.

## Yang baru di 1.1

- Lantai 1 dan 3 memakai tileset DarkDungeon, lantai 2 memakai Mini Dungeon. Obor/lampu dinding berwarna menggantikan spanduk.
- Senjata (pedang, tombak, kapak, tongkat api) memakai sprite RPG Items dengan 5 skin per senjata, berganti tiap naik level. Busur tetap digambar sendiri karena tidak ada di pack.
- Orb power memakai sprite orb.
- Kristal di ruangan bisa dipecahkan (pukul, panah, bola api, atau Nova) dan menjatuhkan permata, bijih, koin, kadang ramuan atau orb.
- Buku Kuno (lantai 2-3) memberi satu peningkatan permanen.
- `scripts/build-assets2.py` membuat ulang `www/assets2.js` dari pack asli.

## Fitur gameplay

- **Senjata** (ganti: `Q` / `1`-`5` / roda mouse / tombol GANTI): Pedang, Tombak (jangkauan jauh), Kapak (putar, keras), Busur (panah tembus), Tongkat api (ledakan area). Dapat senjata yang sama lagi atau buka peti tertentu = naik level (maks 5, +15% damage per level). Panah dan bola api menangkis tembakan musuh.
- **Power** (pakai: `E` / `L` / tombol POWER; ganti power: `R` / ketuk panah di sudut tombol POWER / tahan tombol POWER): Nova, Petir, Perisai, Beku. Tombol POWER dan DASH menampilkan cooldown.
- **Atur tombol**: menu utama atau menu jeda, ATUR TOMBOL. Seret untuk memindah, `+`/`-` ukuran, TRANSPARAN, GRID, GESER SEMUA, RAPIKAN, UNDO, RESET, BATAL, SELESAI. Tata letak landscape dan portrait disimpan terpisah, dan menghormati area poni/notch. Ada GRID (snap 8 px), peringatan tombol bertumpuk + RAPIKAN, GESER SEMUA, dan transparansi per tombol (SAMAKAN untuk menyeragamkan). Orientasi yang belum diubah pemain dihitung ulang otomatis dari area aman.
- Karakter memakai sprite sisi (kanan) untuk jalan dan diam (dengan animasi napas), dan sheet idle menghadap depan saat berdiri menghadap ke bawah. Sprite menghadap atas belum ada di aset.
