# Validasi implementasi — 9 November 2026

Produksi: https://kevin-chiputra-newspaper.vercel.app

## Pembaruan animasi koran

Setelah benchmark awal di bawah, ditambahkan opening lipatan koran satu kali per sesi tab serta page turn pada setiap perubahan rute publik, termasuk back/forward. Efek memakai CSS pada lapisan dekoratif sebesar viewport, tanpa library animasi atau duplikasi pohon halaman. Desktop menggunakan 700/340 ms; mobile 240/160 ms tanpa perspektif 3D. Reduced motion menonaktifkan animasi. Lapisan tidak menerima pointer/fokus, dibersihkan setelah selesai, dan dihentikan ketika tab disembunyikan atau preferensi gerak berubah.

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
