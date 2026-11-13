# Validasi implementasi

## Gumpalan tetap di tengah dan tepi page turn — 13 November 2026

Rekaman production build sebelum perubahan memperlihatkan intro CSS dimulai lebih dahulu, lalu berubah menjadi WebGL di tengah gerakan (sekitar 245 → 443 ms). Transisi halaman juga menggeser engsel 8–14 vw dari tepi layar, sementara opacity halaman tujuan turun ke 0,72. Kombinasi ini menimbulkan lompatan bentuk dan celah margin yang lebih terang.

Gumpalan kini ditampilkan sebelum hydration memakai WebP transparan 12 KB yang dirender dari mesh intro sendiri. Persiapan memilih CSS atau WebGL sekali, dengan tenggat 400 ms setelah hydration; baru setelah itu urutan 3,6 detik dimulai. Posisi, orientasi, skala global, dan pusat XY setiap morph target tetap terpusat. Page turn hanya berputar pada engsel yang menempel pada tepi viewport; bidang bertumpuk 1 px dan cetakannya memakai lebar scene sebenarnya, termasuk saat scrollbar mengambil ruang. Halaman tujuan tidak lagi dibuat transparan.

- **56 tes browser Chromium desktop/Pixel 7 lulus**, beserta 16 tes unit/database, lint, format, typecheck, dan production build. Empat kasus regresi baru gagal pada build sebelumnya lalu lulus setelah perbaikan: persiapan gumpalan tanpa pergantian renderer, serta engsel/coverage/opacity/lebar cetakan pada kedua arah, termasuk scrollbar desktop 17 px.
- Rekaman desktop dan mobile diperiksa pada awal gumpalan, pembukaan, lembar rata, crossfade, serta kedua arah page turn. Mobile juga direkam dengan WebGL sengaja dinonaktifkan. Sampel mobile selesai tanpa error browser, overflow horizontal, canvas tersisa, atau animasi aktif. Rekaman dan contact sheet lokal berada di `artifacts/paper-fix/` (tidak disertakan dalam Git).
- **14 pemeriksaan tambahan WebKit lulus** pada desktop dan emulasi iPhone 13: intro, cleanup, navigasi cepat/history, fallback, renderer lambat, resize/reduced motion runtime, serta kedua regresi baru. Dua pemeriksaan tambahan gagal pada reload langsung setelah navigasi hash dan perubahan preferensi gerak. Pemeriksaan ulang pada versi live sebelumnya juga gagal di mobile (halaman sebelumnya muncul kembali setelah reload). Navigasi kontak biasa dan reload setelah posisi menetap diperiksa secara visual dan bekerja. Tes existing tetap dipertahankan; pembaruan ini tidak mengubah penanganan hash/history untuk menutupi hasil tersebut. WebKit Playwright dan emulasi bukan pengujian pada iPhone fisik.
- Tiga run production lokal per perangkat, Chrome dan CPU throttling 4× di mobile: median p95 interval RAF intro **16,7 ms desktop / 16,8 ms mobile**, page turn **16,7 / 16,8 ms**. Seluruh run memakai WebGL; satu interval intro >34 ms per run dan tidak ada selama page turn. Data mentah: [paper-continuity-frames.json](paper-continuity-frames.json). Benchmark menunggu intro benar-benar selesai sebelum navigasi. Ini pemeriksaan cadence animasi; benchmark pemuatan/LCP sebelumnya di bawah tidak diulang untuk perbaikan ini.

## Lipatan realistis dan page turn melengkung — 13 November 2026

Intro memakai satu lembar bertepi terbuka dengan tiga morph target posisi/normal: gumpalan tidak beraturan, lembar cekung dengan sudut tertahan, dan lembar berkerut sebelum rata. Crease normals mempertahankan lipatan tajam dengan bidang yang lebih halus. Kamera perspektif, cetakan teks konten aktif, dan pencahayaan terarah memperjelas bentuk. Desktop menambahkan bump map serat 256 px dan satu shadow map 512 px; mobile tidak memakai keduanya dan menggunakan 26 × 34 segmen dibanding 42 × 54 pada desktop. Semua buffer dihitung sekali sebelum render dan dilepas setelah intro.

Page turn memakai empat bagian kertas yang terhubung (tiga di mobile), sisi depan/belakang, dan bayangan bergerak. Cetakan mempertahankan judul halaman yang ditinggalkan. Durasi tetap 900/650 ms, navigasi tidak ditunda, dan tidak ada WebGL untuk pergantian halaman. Frame gumpalan, setengah terbuka, rata, crossfade, serta page turn pada 15/40/65/85% diperiksa di desktop dan Pixel 7.

Pengukuran menggunakan production server lokal, Chrome, tiga run per perangkat, dan CPU throttling 4× pada mobile. Data mentah disimpan di [tactile-performance.json](tactile-performance.json); cadence frame diukur melalui RAF menggunakan `scripts/measure-paper-frames.mjs`, pemuatan/idle melalui `scripts/measure-motion.mjs`. Ini bukan pengukuran GPU pada ponsel fisik atau Safari. LCP mengukur HTML di bawah dekorasi, bukan durasi intro 3,6 detik. Angka kunjungan ulang dapat berubah karena variasi pengukuran walaupun renderer intro tidak dimuat.

| Pengukuran median | Sebelum → sesudah |
| --- | ---: |
| Desktop LCP pertama / ulang | 76 → 100 ms / 48 → 48 ms |
| Mobile CPU 4× LCP pertama / ulang | 232 → 248 ms / 60 → 60 ms |
| Desktop long task di atas 50 ms, kunjungan pertama | 0 → 14 ms |
| Mobile CPU 4× long task di atas 50 ms, kunjungan pertama | 75 → 125 ms |
| JS encoded pertama / ulang | 282.1 → 284.0 KB / 148.3 → 148.4 KB |
| Mobile p95 interval RAF saat intro | 16.8 → 16.8 ms |
| Mobile p95 interval RAF saat page turn | 16.8 → 16.7 ms |

Ketiga run mobile memakai WebGL untuk intro. Tidak ada interval frame >34 ms selama page turn; intro masih memiliki 2–4 interval >34 ms saat pemuatan/persiapan. Biaya persiapan kunjungan pertama bertambah, sementara cadence selama animasi tetap terjaga. Tidak ada long task pada kunjungan ulang; seluruh sampel selesai dengan 0 animasi berjalan. CLS median tetap 0.002 pada kunjungan pertama desktop dan 0 pada sampel lainnya. Pemeriksaan ukuran desktop/mobile tidak menemukan overflow horizontal atau hydration error.

Lint, pemeriksaan format, pemeriksaan tipe, production build, 16 tes unit/database, dan **52 tes browser desktop/mobile lulus**. Tes tambahan memeriksa cetakan edisi sebelumnya, kelengkungan antarbagiannya, jumlah lipatan mobile, arah balik, dan cleanup. Tes existing tetap mencakup skip, reload, back/forward, navigasi cepat, renderer gagal/lambat, storage diblokir, resize, tab tersembunyi, reduced motion, dan JavaScript nonaktif.

## Interaksi magis dan formulir surat — 13 November 2026

- Fokus input tidak lagi menampilkan kotak; garis tinta dan ornamen bintang mempertahankan penanda fokus keyboard. Screenshot kontak diperiksa pada desktop dan emulasi Pixel 7, termasuk fokus nama, email, dan isi surat.
- Debu emas singkat ditambahkan pada interaksi serta reveal bagian; foto mendapat kilau saat hover. Partikel dibatasi 24, dibersihkan setelah maksimal 680 ms, dan dihentikan saat reduced motion aktif, tab tersembunyi, atau navigasi. Sampel desktop/mobile menunjukkan 0 partikel dan 0 animasi berjalan setelah efek selesai, tanpa overflow horizontal atau error browser.
- **50 pengujian browser lulus** pada production build lokal, termasuk delapan pemeriksaan baru untuk input tanpa kotak, keyboard, batas dan cleanup partikel, reduced motion, pengiriman sukses, serta kegagalan yang mempertahankan isi surat. API pengiriman dimock; tidak ada email sungguhan dikirim.
- Lint, pemeriksaan format, pemeriksaan tipe, production build, dan 16 pengujian unit/database lulus. Benchmark pada bagian berikut adalah baseline pembaruan intro; tidak diulang untuk tambahan interaksi ini.

## Koran magis — 13 November 2026

Diverifikasi pada production build lokal dengan konten published, lalu dideploy melalui PR #4 (merge `157574d`). Tema sepia, masthead, bingkai foto, edisi bertinta gelap, dan tampilan Home/About/Projects diperiksa pada desktop 1440 × 1000 dan emulasi Pixel 7. Frame WebGL pada tahap gumpalan, lembar berkerut, dan lembar rata diperiksa; judul menggunakan posisi baris halaman sebenarnya. Gambar proyek yang lazy-load diverifikasi setelah digulir ke viewport. Deployment Vercel, navigasi tiga halaman, kontak, dan cleanup renderer telah diverifikasi pada produksi.

- Lint, pemeriksaan tipe, pemeriksaan format, production build, serta 16 pengujian unit/database lulus.
- **42 pengujian browser lulus** pada desktop dan Pixel 7. Termasuk intro sekali per sesi, skip/Escape/scroll/fokus, navigasi cepat, arah dan durasi page turn, history, hash contact, storage diblokir, WebGL tidak tersedia, renderer lambat, context loss, resize, tab tersembunyi, reduced motion yang berubah saat runtime, pemuatan rute lambat, hydration gagal, dan JavaScript nonaktif.
- Pemeriksaan existing untuk metadata, proteksi admin/Server Action, fallback gambar, dan validasi kontak tetap lulus. Tidak ada email yang dikirim atau konten CMS yang diubah. Pengujian login pemilik/preview privat tidak diulang; preview menggunakan komponen portfolio yang sama.
- Seluruh sampel menunjukkan **0 animasi aktif setelah selesai**. Resource GPU dan canvas dilepas; scroll menjadwalkan RAF hanya saat diperlukan. Ketiga halaman tidak mengalami overflow horizontal pada ukuran yang diperiksa. Pengujian mobile berupa emulasi Chromium, bukan perangkat fisik atau Safari.

### Perbandingan performa lokal

Median tiga run per perangkat, context baru untuk kunjungan pertama dan reload dalam tab sama untuk kunjungan ulang. Kedua versi memakai production server lokal, Chrome yang sama, tanpa pembatasan jaringan; mobile menggunakan CPU throttling 4×. Pengujian browser/build lain tidak dijalankan bersamaan. Angka ini bukan skor Lighthouse dan tidak dapat dibandingkan langsung dengan pengukuran Vercel pada peluncuran awal di bawah.

| Perangkat / kunjungan | LCP sebelum → sesudah | CLS sebelum → sesudah | Waktu long task di atas 50 ms | JS encoded sebelum → sesudah |
| --- | ---: | ---: | ---: | ---: |
| Desktop, pertama | 52 → 76 ms | 0.000 → 0.002 | 0 → 0 ms | 144.7 → 281.0 KB |
| Desktop, ulang | 48 → 44 ms | 0.000 → 0.000 | 0 → 0 ms | 144.7 → 147.2 KB |
| Mobile CPU 4×, pertama | 72 → 240 ms | 0.000 → 0.000 | 1 → 72 ms | 144.7 → 281.0 KB |
| Mobile CPU 4×, ulang | 64 → 60 ms | 0.000 → 0.000 | 0 → 0 ms | 144.7 → 147.2 KB |

Modul intro Three.js beserta renderer menambah sekitar 133,8 KB encoded hanya pada kunjungan pertama. Kunjungan ulang menambah sekitar 2,4 KB dibanding baseline. Beban tambahan pertama terlihat pada long task di emulasi CPU 4×; animasi memiliki batas kesiapan renderer 400 ms dan fallback CSS. LCP di atas menghitung HTML di bawah dekorasi, **bukan waktu pembukaan visual**: intro tetap berlangsung 3,6 detik kecuali dilewati. Attribution layout-shift mengidentifikasi pergeseran font awal pada headline, label, statistik, dan lebar tombol skip; animasi memakai transform/opacity pada lapisan fixed dan tidak mengubah alokasi layout konten.

Data per run disimpan di [motion-performance.json](motion-performance.json). Untuk mengulang, jalankan production server terlebih dahulu, kemudian:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  node scripts/measure-motion.mjs artifacts/magic-paper/measurement.json
```

Hilangkan `CHROME_PATH` jika menggunakan Chromium bawaan Playwright. Jangan menjalankan benchmark bersamaan dengan build atau pengujian lain.

## Arsip validasi — 9 November 2026

Bagian berikut mencatat peluncuran dan animasi sebelum pembaruan koran magis. Hasil produksi serta skor Lighthouse historis tidak mewakili perubahan lokal terbaru.

Produksi: https://kevin-chiputra-newspaper.vercel.app

## Pembaruan animasi koran

Setelah benchmark awal di bawah, ditambahkan opening lipatan koran satu kali per sesi tab serta page turn pada setiap perubahan rute publik, termasuk back/forward. Efek memakai CSS pada lapisan dekoratif sebesar viewport, tanpa library animasi atau duplikasi pohon halaman. Opening desktop menggunakan 700 ms dan mobile 240 ms tanpa perspektif 3D. Sesuai penyesuaian berikutnya, setiap page turn menggunakan 3 detik di desktop dan mobile; cleanup menunggu animationend dengan fallback 3,4 detik. Reduced motion menonaktifkan animasi. Lapisan tidak menerima pointer/fokus, dibersihkan setelah selesai, dan dihentikan ketika tab disembunyikan atau preferensi gerak berubah.

Lint, TypeScript, dan production build berhasil. Pengujian browser bertambah menjadi 14 dan berhasil pada desktop/Pixel 7, mencakup intro sekali per sesi, reload, perpindahan rute, history, reduced motion, dan tidak adanya animasi aktif setelah page turn selesai. Frame opening dan page turn juga diperiksa secara visual. Angka Lighthouse di bagian berikut merupakan benchmark peluncuran awal sebelum pembaruan animasi ini.

## Pemeriksaan aplikasi

- `npm run lint`, `npm run typecheck`, `npm test`, dan production build berhasil.
- 16 pengujian unit/database berhasil. PGlite menjalankan migration, role PostgreSQL, RLS, RPC, seed idempotent, isolasi snapshot, konflik revisi, publikasi atomik, dan perlindungan referensi media.
- 10 pengujian browser lokal berhasil pada desktop dan Pixel 7. Termasuk pemanggilan langsung empat Server Action privat tanpa sesi; semuanya mengembalikan penolakan.
- 8 pengujian browser pada domain produksi berhasil. Dua pemeriksaan ID Server Action memakai manifest build lokal sehingga sengaja tidak dijalankan terhadap deployment remote.
- Canonical produksi, metadata sosial, JSON-LD Person/WebSite/ProfilePage, sitemap, robots, navigasi keyboard, back/forward, reduced motion, dan fallback gambar diperiksa.
- `npm audit --omit=dev` melaporkan 0 kerentanan. Audit seluruh dependency masih mencatat 8 moderate pada dependency tooling; tidak dipaksakan downgrade major untuk menghilangkannya.

## Supabase dan CMS cloud

| Pemeriksaan | Hasil |
| --- | --- |
| Login Google pemilik | Berhasil di localhost, preview Vercel, dan produksi |
| Login akun Google lain | Ditolak dengan `error=access` pada produksi |
| Bootstrap | UUID dipilih dari email pemilik terkonfirmasi dan identitas provider Google; login sebelum bootstrap ditolak |
| Logout | Kembali ke halaman login |
| Simpan draft | Revisi bertambah tanpa mengubah snapshot published |
| Preview | Teks draft hanya terlihat di preview privat; menggunakan komponen publik yang sama |
| Konflik antartab | Tab revisi lama ditolak; reload memuat revisi terbaru tanpa menimpa perubahan |
| Unggah | Foto portfolio JPEG berhasil diunggah privat, dikonversi WebP 1600 × 2400, diberi alt text, lalu dipilih di profil |
| Publish | Foto dipromosikan ke Storage publik; snapshot published berubah atomik |
| Akses API anonim | Draft menghasilkan `[]`; media privat ditolak; publish RPC dan insert admin menghasilkan HTTP 401 |
| Akses media publik | HTTP 200 setelah publish |
| Cache produksi | Setelah publish, `/`, `/about`, dan `/projects` menampilkan `data-content-revision="7"`; sitemap berubah ke waktu snapshot yang sama, `2026-11-09T04:19:43.404Z` |

Uji konflik cloud menemukan loop retry PostgREST saat exception memakai SQLSTATE `40001`. Migration `202611090002_revision_conflicts.sql` menggantinya dengan `PT409`, dan pengujian antartab setelah perbaikan berhasil. Lihat [penjelasan resmi Supabase](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

Sitemap semula disajikan sebagai artefak metadata statis oleh deployment, sehingga tanggalnya tidak ikut berubah setelah publish. `connection()` memastikan handler sitemap dijalankan pada runtime; pengambilan snapshot tetap memakai fetch dengan tag dan cache satu jam. Invalidasi root layout juga memastikan seluruh rute publik tercakup. Tidak ada pemeriksaan sesi pada sitemap atau halaman publik.

Kegagalan publikasi karena media belum tersedia, larangan hapus media published, input gambar rusak/terlalu besar, daftar proyek kosong, serta referensi yang tidak valid diuji secara otomatis. Penghapusan media produksi tidak dilakukan untuk menghindari penghapusan berkas yang masih berguna. Siklus refresh token setelah masa berlaku alami belum diamati secara penuh; logout, penolakan sesi anonim, verifikasi `getUser`, dan pemeriksaan izin per operasi telah diperiksa.

## Kontak

Validasi input, penolakan origin lain, dan respons honeypot diuji pada runtime produksi. Autentikasi SMTP Gmail diverifikasi menggunakan `transport.verify()`. Tidak ada email uji yang dikirim; pengantaran sampai inbox belum menjadi bukti pengujian ini.

## Lighthouse mobile

Lighthouse 13.6.0, Chrome headless, konfigurasi mobile dan simulated throttling bawaan. Setiap kelompok berisi tiga navigasi dengan profil browser baru. Cache server/CDN dapat menghangat antar-run. Pengukuran lokal membandingkan static production build lama di port 4173 dengan `next start` baru di port 3000 pada komputer yang sama; pengukuran produksi Vercel dilaporkan terpisah karena kondisi jaringan berbeda.

| Produksi Vercel | Performance | SEO | Accessibility | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Run 1 | 97 | 100 | 100 | 2,515 dtk | 0 | 18 ms |
| Run 2 | 100 | 100 | 100 | 1,685 dtk | 0 | 7,5 ms |
| Run 3 | 100 | 100 | 100 | 1,384 dtk | 0,057 | 12 ms |
| **Median** | **100** | **100** | **100** | **1,685 dtk** | **0** | **12 ms** |

Median produksi memenuhi target Performance ≥90, SEO ≥95, LCP ≤2,5 detik, dan CLS ≤0,1. Run pertama sendiri sedikit melampaui target LCP. Skor ini merupakan hasil laboratorium, bukan jaminan untuk semua perangkat atau kondisi jaringan.

Baseline lokal: Performance 75/75/75, SEO 100/100/100, LCP 14,631/14,330/14,330 detik, CLS 0. Setelah optimasi, Performance lokal 94/94/94 dan LCP 3,074/3,088/3,067 detik (median 3,074 detik). LCP lokal belum mencapai 2,5 detik; pengukuran deployment produksi memenuhi target. Perbedaan HTTP, CDN, dan jaringan membuat kedua kelompok tidak bisa dipertukarkan.

Angka lengkap tersimpan dalam [performance.json](performance.json). Laporan Lighthouse mentah tersedia lokal di `artifacts/performance/` (tidak dikirim ke repository).

## Interaksi, bundle, dan halaman diam

Pengukuran terpisah pada produksi menggunakan Pixel 7 emulation:

- Tidak ada animasi yang masih berjalan saat halaman diam.
- Task duration bertambah 0,73 ms selama jendela idle 3 detik.
- Event Timing pada input keyboard dan perpindahan fokus mencatat 64 ms dan 56 ms. Angka ini bukan INP lapangan; belum ada data CrUX/RUM yang cukup untuk menilai INP pengguna nyata.
- Sembilan script halaman publik diperiksa dan tidak berisi CMS atau Supabase SDK; tidak ada permintaan Auth Supabase dari halaman publik.
- Interaksi yang diperlukan menggunakan CSS dan observer scroll satu kali. Library animasi dihapus dari bundle publik karena tidak ada interaksi saat ini yang memerlukan simulasi spring.
- Animasi masuk hanya berjalan pada navigasi antarrute; konten navigasi pertama langsung terlihat. Gambar LCP mendapat eager/high priority, sedangkan gambar lain lazy.

## Reproduksi

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
# Terminal kedua, dengan Supabase terkonfigurasi:
TEST_CONNECTED=true npm run test:e2e
# Smoke test remote; tindakan privat langsung diuji pada build lokal:
TEST_CONNECTED=true TEST_BASE_URL=https://kevin-chiputra-newspaper.vercel.app npm run test:e2e
npx lighthouse https://kevin-chiputra-newspaper.vercel.app/ \
  --chrome-flags='--headless=new' --only-categories=performance,accessibility,seo \
  --output=json --output-path=artifacts/lighthouse.json
```

Pada macOS, set `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'` bila memakai Chrome yang sudah terpasang. Jalankan Lighthouse satu per satu dan hindari build atau pengujian browser lain bersamaan.
