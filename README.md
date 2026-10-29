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

- Lantai 1 dan 4 memakai tileset DarkDungeon, lantai 2 dan 5 memakai Mini Dungeon, lantai 3 dan 6 memakai tileset kripta (lihat versi 1.6 dan 1.10). Obor/lampu dinding berwarna menggantikan spanduk.
- Senjata (pedang, tombak, kapak, tongkat api) memakai sprite RPG Items dengan 5 skin per senjata, berganti tiap naik level. Busur tetap digambar sendiri karena tidak ada di pack.
- Orb power memakai sprite orb.
- Kristal di ruangan bisa dipecahkan (pukul, panah, bola api, atau Nova) dan menjatuhkan permata, bijih, koin, kadang ramuan atau orb.
- Buku Kuno (lantai 2-6) memberi satu peningkatan permanen.
- `scripts/build-assets2.py` membuat ulang `www/assets2.js` dari pack asli.

## Fitur gameplay

- **Senjata** (ganti: `Q` / `1`-`5` / roda mouse / tombol GANTI): Pedang, Tombak (jangkauan jauh), Kapak (putar, keras), Busur (panah tembus), Tongkat api (ledakan area). Dapat senjata yang sama lagi atau buka peti tertentu = naik level (maks 5, +15% damage per level). Panah dan bola api menangkis tembakan musuh.
- **Power** (pakai: `E` / `L` / tombol POWER; ganti power: `R` / ketuk panah di sudut tombol POWER / tahan tombol POWER): Nova, Petir, Perisai, Beku. Tombol POWER dan DASH menampilkan cooldown.
- **Atur tombol**: menu utama atau menu jeda, ATUR TOMBOL. Seret untuk memindah, `+`/`-` ukuran, TRANSPARAN, GRID, GESER SEMUA, RAPIKAN, UNDO, RESET, BATAL, SELESAI. Tata letak landscape dan portrait disimpan terpisah, dan menghormati area poni/notch. Ada GRID (snap 8 px), peringatan tombol bertumpuk + RAPIKAN, GESER SEMUA, dan transparansi per tombol (SAMAKAN untuk menyeragamkan). Orientasi yang belum diubah pemain dihitung ulang otomatis dari area aman.
- Karakter memakai sprite sisi (kanan) untuk jalan dan diam (dengan animasi napas), dan sheet idle menghadap depan saat berdiri menghadap ke bawah. Sprite menghadap atas belum ada di aset.

## Yang baru di 1.2

- Arah ayunan senjata melee (pedang, kapak, tombak) sekarang mengikuti arah hadap: saat menghadap kiri, senjata tidak lagi berayun terbalik dari bawah ke atas, dan kilatan serangan (slash) memakai tepi depan yang benar.

## Yang baru di 1.2

- Arah ayunan senjata melee (pedang, kapak, tombak) sekarang mengikuti arah hadap: saat menghadap kiri, senjata tidak lagi berayun terbalik dari bawah ke atas, dan kilatan serangan (slash) memakai tepi depan yang benar.

## Yang baru di 1.3

- Musuh baru dari THE_PACK: Slime (lantai 1), Orc2 dan Pohon penembak (lantai 2-3), dan King Slime yang lebih kuat (lantai 3). Sprite dibuat ulang ke ukuran yang seimbang dengan karakter.
- Efek pukul dari VFX Free Pack muncul setiap musuh kena serangan.
- Ayunan senjata melee tetap mengikuti arah hadap (perbaikan dari 1.2).

## Yang baru di 1.4

- Obor dinding sekarang berapi animasi (dari 16x16 Dungeon tileset), dengan cahaya berwarna per obor seperti sebelumnya.
- Tombol menu utama dan jeda punya ikon kecil (pedang, info, pengaturan, buku, piala, perisai) dari All_Assets.

## Yang baru di 1.5

- Skeleton dasar (Skeleton Crew, Pixel Crawler) ditambahkan sebagai musuh lantai 1.

## Yang baru di 1.6

- Lantai 3 (kripta sarang Raja Orc) memakai tileset kripta dari 16x16 Dungeon tileset untuk lantai dan dinding.
- Musuh elite, boss, dan musuh besar meledak dengan efek ledakan dari VFX Free Pack saat mati.

## Yang baru di 1.7

- Panah yang menancap di dinding sekarang memunculkan efek dentuman dari VFX Free Pack.
- Indikator perisai aktif muncul di HUD dengan ikon perisai dan jumlah serangan yang masih bisa ditahan.

## Yang baru di 1.8

- Ledakan kedua dari VFX Free Pack muncul saat serangan tongkat api meledak.
- Ikon tas koin di HUD menggantikan sprite koin, dan ikon peta muncul di samping minimap.

## Yang baru di 1.9

- Efek pengisian dari VFX Free Pack muncul saat power digunakan.
- Debu bintang muncul saat peti dibuka dan saat ramuan merah diminum.
- Perisai listrik berkedip di sekeliling karakter selama perisai aktif.

## Yang baru di 1.10

- Permainan sekarang 6 lantai. Lantai 4 dan 5 adalah lantai biasa dengan musuh yang lebih banyak.
- Lantai 3 tetap dengan Raja Orc. Mengalahkannya membuka portal ke lantai 4, bukan mengakhiri permainan.
- Lantai 6 adalah lantai terakhir dengan bos baru: Raja Slime (King Slime). Mengalahkannya memenangkan permainan.

## Kredit aset tambahan (versi 1.10)

- **THE_PACK** oleh pixel_ankousse: boleh dipakai di proyek komersial, kredit tidak wajib tapi dihargai.
- **16x16 Dungeon Tileset** oleh Rowan Luff: wajib dicantumkan kreditnya.
- **VFX Free Pack** dan **All_Assets**: belum ada file lisensi di dalam zip. Nama pembuat dan syarat pemakaian perlu dicek sebelum rilis publik.

## Yang baru di 1.11

- Kredit THE_PACK dan 16x16 Dungeon Tileset ditambahkan di layar kredit. Nama pembuat VFX Free Pack dan All_Assets masih menunggu.
- Raja Slime memecah diri menjadi dua slime kecil saat darahnya tinggal setengah.

## Yang baru di 1.12

- Perbaikan crash saat masuk lantai 4: senjata tidak lagi dicari dari daftar lantai 1 sampai 3, sehingga lantai 4 sampai 6 bisa dimuat.
- Label bos dan pesan kemunculan sekarang sesuai jenis bos (Raja Orc atau Raja Slime).
- Hasil uji otomatis di browser: semua 6 lantai dimuat, bos lantai 3 membuka portal, dan bos lantai 6 memicu kemenangan.

## Yang baru di 1.13

- Raja Slime punya serangan khusus: semburan lendir melingkar (6 proyektil, atau 10 saat murka) yang didahului getaran sebagai tanda.

## Yang baru di 1.14

- Perbaikan konsistensi: teks tujuan di layar cara bermain dan pengantar menyebut lantai 1 sampai 6 dengan benar (Raja Orc di lantai 3, Raja Slime di lantai 6).
- Penjaga kunci dinamai sama di semua lantai ("berbingkai emas").
- Daftar tema lantai di README dan komentar kode disesuaikan dengan enam lantai.

## Yang baru di 1.15

- Teks Buku Kuno di layar cara bermain dan README disesuaikan (lantai 2 sampai 6).
- Baris placeholder "nama pembuat menyusul" dihapus dari layar kredit. Catatan lisensi tetap ada di README.

## Yang baru di 1.16

- Perbaikan utama cara senjata dipegang: sprite pedang, kapak, tombak, dan tongkat ternyata membentang dari ujung kiri-atas ke gagang kanan-bawah. Titik pegang dan rotasi sebelumnya dihitung untuk arah sebaliknya, sehingga senjata tampak melayang di atas kepala atau terbalik. Sekarang gagang berada di tangan dan bilah mengarah ke depan.
- Ayunan senjata melee tetap mengikuti arah hadap (ke kanan dan ke kiri).

## Yang baru di 1.17

- Perbaikan game berhenti tiba-tiba: saat perisai aktif lalu pemain terkena serangan, game sempat error karena parameter fungsi menimpa daftar efek. Sekarang sudah diperbaiki.
- Game loop diberi pengaman, sehingga satu error tidak lagi menghentikan seluruh permainan.

## Yang baru di 1.18

- Bar darah bos pindah ke atas tengah layar. Di layar HP, bar turun ke bawah minimap supaya tidak menutupi.
- Senjata dan power dipindah ke bawah tengah layar seperti hotbar Minecraft. Power ditampilkan di atas baris senjata.

## Yang baru di 1.19

- Lantai 4 sekarang didominasi skeleton (Skeleton Warrior, Mage, Rogue, dan Base) dengan orc dan Raja Orc.
- Lantai 5 memakai Slime 2 dari THE_PACK sebagai musuh utama, bersama orc, tree, dan skeleton.
- Orc yang kena pukul mengeluarkan efek darah dari VFX Free Pack.
- Skeleton Mage memiliki aura roh yang berkedip di sekelilingnya.

## Yang baru di 1.20

- Lantai 4 memakai ubin batu bata dan dinding batu abu-abu dari Pixel Crawler.
- Lantai 5 memakai ubin tanah gua dan dinding batu coklat dari Pixel Crawler, dengan nuansa hijau lendir.
- Potret karakter dengan bingkai emas dari All_Assets ditampilkan di pojok kiri atas. HP bar pindah ke kanannya.

## Yang baru di 1.21

- Permainan sekarang 9 lantai. Lantai 3, 6 punya bos yang membuka portal. Lantai 9 adalah lantai terakhir dengan Penjaga Pohon sebagai bos akhir.
- Lantai 7 (kawah api) dan 8 (aula tulang) ditambahkan dengan musuh dan tema sendiri.
- Penjaga Pohon punya semburan getah hijau seperti Raja Slime.

## Yang baru di 1.22

- Pemuatan aset dibatasi 12 detik. Kalau ada aset yang lambat, permainan tetap mulai.
- Error yang tidak tertangani dicatat di konsol, tidak diam-diam.
- Tata letak menu menyesuaikan ukuran layar: tombol, jarak, dan kartu mengecil atau membesar mengikuti layar. Tombol muncul berurutan. Area aman di HP dihormati.
- Animasi dikurangi otomatis untuk pengguna yang mengaktifkan pengurangan gerak di sistem.

## Yang baru di 1.23

- Ruang istirahat: setelah lantai 2, 5, dan 8, pintu portal membawa ke ruang istirahat. Di sana bisa menyembuhkan (10 koin), mengasah senjata (25 koin per level, sampai LV5), atau mengisi ulang power (20 koin).
- Kombo: setiap musuh yang mati menambah kombo. Kombo hangus setelah 3 detik tanpa kill, dan skor bertambah lebih banyak saat kombo tinggi.

## Yang baru di 1.24

- Ruang istirahat punya tampilan dunia sendiri: lantai dan dinding batu, obor menyala, lentera (Bonfire) dari Pixel Crawler, landasan (Anvil), dan knight yang berdiri di tengah.
- Menu ruang istirahat sekarang ada di bagian bawah layar, sehingga ruangannya tetap terlihat di belakangnya.

## Yang baru di 1.25

- Ruang istirahat punya lantai papan kayu, meja kayu dari Pixel Crawler, lentera dan anvil yang bisa diklik langsung di ruangan.
- Klik lentera untuk menyembuhkan, klik anvil untuk mengasah senjata. Keduanya memakai aturan dan biaya yang sama dengan tombol di menu.

## Yang baru di 1.26

- Karakter kedua, Pengembara (dari Body_A Pixel Crawler), bisa dipilih di menu utama lewat tombol KARAKTER. Sprite-nya diperkecil ke 32 px supaya ukurannya sama dengan knight.
- Penempa berdiri di dekat anvil di ruang istirahat sebagai karakter kedua.
- Papan lantai kayu di ruang istirahat punya panjang bervariasi.

## Yang baru di 1.27

- Pengembara lebih cepat (84 dari 68), HP maksimal 80 (dari 100), dan damage sedikit lebih rendah (1.7 dari 2).
- Di ruang istirahat, pemain bisa berjalan dengan A/D atau panah, atau klik lantai untuk berjalan ke sana.
- Tekan E (atau Spasi) saat dekat lentera, anvil, atau penempa untuk berinteraksi. Klik objek juga berfungsi.
- Penempa bisa diajak bicara. Setiap interaksi memberi saran singkat tentang asah senjata atau isi ulang power.

## Yang baru di 1.28

- Penempa punya kotak dialog dengan wajah dan nama. Teksnya diketik perlahan, dan kotak tertutup dengan klik atau Escape.
- Di ruang istirahat, pemain bisa melompat dengan W atau panah atas.

## Yang baru di 1.29

- Di HP, ruang istirahat punya tombol sentuh: kiri dan kanan (ditahan untuk berjalan), LOMPAT, dan INTERAKSI.
- Lentera dan anvil juga punya kotak dialog dengan potret dan nama, sama seperti penempa.
- Menu ruang istirahat di HP naik supaya tidak tertutup tombol sentuh.

## Yang baru di 1.30

- Guncangan layar diperkecil dan dibatasi, supaya tidak terlalu keras.
- Pengembara dihapus dari pilihan karakter. Sprite-nya tetap dipakai untuk penempa, dengan warna bengkel.
- Ruang istirahat diperbagus: balok kayu di atas dinding, karpet merah, bara api yang naik dari lentera, debu melayang, dan cahaya hangat yang lebih luas.

## Yang baru di 1.31

- Ruang istirahat sekarang dua ruangan: ruang utama (lentera, anvil, meja kerja, penempa) dan ruang ramuan di sebelah kanan (meja alkimia dan rak botol).
- Kamera mengikuti karakter saat berjalan melewati pembatas.
- Di meja alkimia, tekan E atau klik meja untuk mengisi ulang power (20 koin).
- Petunjuk arah antar ruangan muncul di bagian atas layar.

## Yang baru di 1.32

- Rak botol sekarang bisa diperiksa (E atau klik), dengan catatan singkat.
- Pembatas antar ruangan diganti pintu kayu lengkung.
- Petunjuk arah antar ruangan lebih besar dan berlatar gelap, supaya terbaca di HP.

## Yang baru di 1.33

- Rak botol di ruang ramuan bisa dinaiki lewat tangga kayu di sisi kirinya. Tekan W (atau tombol LOMPAT di HP saat dekat tangga) untuk naik, S (atau tahan tombol kiri di HP saat di tangga) untuk turun.
- Di atas rak, karakter berdiri dan bisa berjalan. Keluar dari ujung rak akan jatuh ke lantai.
- Dari bawah rak tidak bisa melompat ke atasnya. Harus lewat tangga.

## Yang baru di 1.34

- Karakter memanjat dengan animasi berlari di tangga, bukan berdiri diam.
- Ada loteng kedua di ruang utama, di sebelah kiri lentera, dengan tangga sendiri.
- Karakter tidak lagi terbang ke atas rak saat berjalan ke kaki tangga.

## Yang baru di 1.35

- Loteng di ruang utama sekarang berisi dua peti bertumpuk dan satu tong.
- Tekan E atau klik peti di loteng untuk mengambil 12 koin. Peti hanya bisa dibuka sekali setiap kunjungan ke ruang istirahat.

## Yang baru di 1.36

- Tong di loteng bisa diperiksa (E atau klik), dan berisi koin acak. Peti dan tong masing-masing hanya memberi koin sekali per kunjungan.
- Jumlah koin dari peti dan tong dibuat acak, dan makin besar di lantai yang lebih dalam.

## Yang baru di 1.37

- Kekuatan musuh disesuaikan dengan tampilannya. Musuh kecil (slime, skeleton dasar, skeleton rogue) lemah. Musuh standar (skeleton warrior dan mage, orc rogue, orc shaman) sedang. Musuh sangar (orc besar, orc bertombak, pohon, King Slime) tebal dan keras.
- Pool per lantai: lantai awal hanya musuh kecil dan standar, lantai dalam makin banyak musuh sangar.
- Kerusakan musuh naik 5 persen per lantai (HP sudah naik 12 persen per lantai sebelumnya).
- Bos diseimbangkan ulang: Raja Orc, Raja Slime, dan Penjaga Pohon sekarang lebih tebal dan lebih keras.

## Yang baru di 1.38

- Lantai 10 ditambahkan sebagai lantai terakhir. Bosnya Jenderal Orc, memakai sprite ORC2 (bertombak) dengan HP 220 dan damage 30.
- Penjaga Pohon di lantai 9 sekarang bos penengah yang membuka portal, bukan lagi bos akhir.

## Yang baru di 1.39

- Jenderal Orc (lantai 10) sekarang memakai animasi serang ORC2 saat bersiap menyerang.
- Bos tidak lagi ikut kenaikan HP dan damage per lantai. Angkanya diatur per bos: Raja Orc HP 110 damage 18, Raja Slime HP 150 damage 16, Penjaga Pohon HP 190 damage 14, Jenderal Orc HP 230 damage 14.
- Semburan lendir bos (Raja Slime dan Penjaga Pohon) memberi setengah damage per getah.
