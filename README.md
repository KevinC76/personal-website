# Kevin Chiputra Newspaper

Portfolio Next.js 16 dengan CMS privat, Supabase Auth/Database/Storage, dan deployment Vercel. Halaman publik dirender di server dan di-cache; browser pengunjung tidak memuat SDK Supabase.

## Menjalankan lokal

```sh
npm ci
npm run dev
```

Tanpa konfigurasi Supabase, mode development menampilkan seed portfolio dan CMS terkunci. Salin variabel dari `.env.example` ke `.env.local` **tanpa menimpa kredensial Gmail yang sudah ada**. Production build memerlukan Supabase yang sudah di-seed, atau `PORTFOLIO_DEMO=true` yang sengaja digunakan untuk validasi lokal/CI.

```sh
PORTFOLIO_DEMO=true SITE_URL=http://localhost:3000 npm run build
PORTFOLIO_DEMO=true SITE_URL=http://localhost:3000 npm start
```

## Supabase Cloud Free

1. Buat proyek khusus di region Singapore. Aktifkan Data API dan RLS; matikan pemberian akses tabel otomatis.
2. Jalankan semua berkas `supabase/migrations/*.sql` sesuai urutan nama menggunakan SQL Editor, lalu `supabase/seed.sql`. Migrasi kedua memperbaiki konflik revisi agar mengembalikan HTTP 409 tanpa loop retry PostgREST. Seed dapat dijalankan ulang tanpa mengubah konten yang sudah diedit. Jika seed di repository diperbarui, jalankan `npm run seed:generate` untuk menghasilkan SQL yang sama.
3. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Aplikasi **tidak memerlukan service-role/secret key**. Jangan memasukkan password database atau OAuth Client Secret ke repository.
4. Di Google Cloud, siapkan OAuth client **Web application**. Authorized redirect URI adalah `https://<project-ref>.supabase.co/auth/v1/callback`. Jika consent screen masih Testing, tambahkan `chiputrakevin@gmail.com` sebagai test user.
5. Aktifkan provider Google di Supabase dengan Client ID/Secret tersebut. Nonaktifkan provider Email jika hanya Google yang digunakan. Jangan menonaktifkan pembuatan user baru sebelum login pertama, karena Google OAuth perlu membuat identitas owner.
6. Supabase Auth URL Configuration: Site URL adalah domain produksi; Redirect URLs berisi `http://localhost:3000/auth/callback` dan URL callback produksi. Tambahkan URL preview spesifik saat menguji login di deployment preview; hindari wildcard untuk domain yang tidak Anda kuasai.
7. Login di `/admin/login` menggunakan `chiputrakevin@gmail.com`. Login pertama akan ditolak CMS sampai owner di-bootstrap, tetapi identitas Google sudah tercatat di Supabase Auth.
8. Jalankan `supabase/bootstrap-admin.sql` dengan SQL Editor. Pastikan hasilnya **satu UUID** milik akun Google yang terverifikasi. Login kembali untuk masuk CMS. Tidak ada aturan “user pertama menjadi admin”.

Proyek yang disiapkan untuk implementasi ini: `aydhevhswbxivnccnmpg`, organisasi `qhrczbunjeynlqhwhwtn`.

## Vercel

Proyek `kevin-chiputra-newspaper` pada workspace `xckevinxc67gmailcoms-projects` menggunakan alamat produksi `https://kevin-chiputra-newspaper.vercel.app`. Hubungkan repository `KevinC76/personal-website` sebagai Next.js application. Gunakan Node.js 22 dan default build command `npm run build`; output directory tidak perlu diatur.

Environment Production:

| Variabel                               | Isi                                             |
| -------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL proyek Supabase                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key, bukan secret key               |
| `SITE_URL`                             | Origin HTTPS `.vercel.app` produksi, tanpa path |
| `GMAIL_USER`                           | Akun SMTP Gmail pengirim                        |
| `GMAIL_APP_PASSWORD`                   | App password Gmail, tandai sebagai sensitive    |

Jangan aktifkan `PORTFOLIO_DEMO` di produksi. Jika `SITE_URL` belum diberikan, metadata memakai `VERCEL_PROJECT_PRODUCTION_URL`; tetap isi nilai eksplisit setelah URL produksi tersedia. Preview Vercel diberi `noindex`. Batasi akses deployment preview melalui pengaturan Vercel jika diperlukan; preview menggunakan database yang sama sehingga **jangan menguji publish dengan data dummy di database produksi**.

Setelah deployment produksi lolos smoke test, jalankan workflow **Redirect legacy GitHub Pages** dengan `site_url` produksi. Workflow ini mempertahankan pengalihan `/`, `/about`, dan `/projects` dari alamat lama. GitHub Pages tidak menyediakan HTTP 301 khusus; halaman memakai canonical, meta refresh, dan tautan langsung. Deploy GitHub Pages otomatis yang lama sudah diganti dengan pemeriksaan CI.

## Mengelola konten

- **Save draft** memperbarui snapshot draft dengan pemeriksaan nomor revisi. Tab yang memakai revisi lama harus dimuat ulang sebelum menyimpan.
- **Preview saved draft** membuka preview privat. Pilih Home, About, atau Projects pada toolbar preview. Navigasi biasa menuju versi publik. Pengiriman email dinonaktifkan dalam preview.
- **Publish edition** menerbitkan keseluruhan draft yang tersimpan. Gambar yang digunakan disalin ke bucket publik terlebih dahulu, lalu snapshot diterbitkan dalam satu transaksi database. Kegagalan tidak mengganti snapshot publik. Berkas yang sudah disalin saat percobaan publish dapat tetap berada di bucket publik sampai dibersihkan; jangan gunakan CMS sebagai penyimpanan rahasia.
- Setelah commit publish, cache konten, metadata, sitemap dan gambar OG diinvalidasi. Revalidasi berkala setiap satu jam menjadi cadangan. Cache yang ada dapat tetap melayani konten saat revalidasi gagal; cold cache dan proyek Supabase yang dijeda tidak dijamin tersedia.
- Sitemap dijalankan melalui runtime agar tidak tertahan sebagai artefak statis deployment, dengan sumber data published yang tetap di-cache satu jam. Muat ulang editor setelah deployment aplikasi baru.
- Unggahan JPEG/PNG/WebP maksimal 5 MB masuk langsung ke bucket privat. Server memeriksa isi, menghapus metadata, membatasi dimensi, dan menghasilkan WebP maksimal lebar 1.600 px. SVG dan gambar animasi ditolak.
- Hapus referensi media dari draft, simpan dan publish, lalu gunakan **Delete file**. Database menolak penghapusan aset yang masih direferensikan draft atau published. File bersifat immutable; mengganti gambar membuat ID baru.
- SMTP mengirim pesan ke alamat owner yang tetap, bukan penerima yang dapat diberikan oleh pengirim formulir. Konten email di-escape dan panjang input dibatasi. Honeypot bukan pengganti proteksi spam; gunakan aturan firewall Vercel jika trafik spam muncul.

## Pemeriksaan

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm start
# Terminal lain:
npm run test:e2e
```

E2E lokal/CI menggunakan demo **tanpa** env Supabase dan `SITE_URL=http://localhost:3000`. Untuk E2E anonim dengan Supabase yang sudah dikonfigurasi, gunakan `TEST_CONNECTED=true npm run test:e2e`. Pengujian live login memerlukan akun Google owner dan dilakukan terpisah. Pada macOS, Chrome yang sudah terpasang dapat digunakan melalui `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.

Unit test memakai PostgreSQL PGlite dengan role dan RLS nyata untuk memeriksa kebijakan SQL, isolasi draft, publikasi, konflik revisi, dan referensi media. Ini tidak menggantikan pengujian integrasi Supabase Auth/Storage cloud. Playwright memeriksa desktop/mobile, metadata, keyboard, navigasi, reduced motion, kegagalan gambar, proteksi CMS, serta validasi kontak tanpa mengirim email sungguhan.

## Pemulihan dan pemeliharaan

- Supabase Free menyediakan database 500 MB dan Storage 1 GB; proyek bisa dijeda setelah seminggu tidak aktif ([ketentuan Free](https://supabase.com/pricing)). Resume melalui dashboard sebelum mengakses CMS atau melakukan deploy baru. Tidak ada keep-alive buatan.
- Sebelum perubahan database, ekspor snapshot dan simpan media melalui dashboard/CLI di lokasi backup privat. Seed tidak berfungsi sebagai backup konten hasil edit.
- Rollback UI melalui deployment Vercel sebelumnya yang kompatibel dengan `schemaVersion: 1`. Mengembalikan konten dilakukan dengan backup snapshot melalui SQL Editor oleh owner, lalu invalidasi cache dengan publish ulang.
- Untuk mencabut akses CMS, hapus baris owner dari `portfolio_admins` melalui SQL Editor dan cabut sesi Auth. RLS akan menolak akses walaupun browser masih menyimpan token. Jangan menghapus user aktif sebelum menyimpan backup.
- Cache publik tidak pernah membaca cookies; area admin memakai `getUser()` dan pemeriksaan admin di dekat setiap operasi privat. Proxy menyegarkan sesi hanya pada `/admin/*` dan `/auth/*`.
- `docs/VALIDATION.md` mencatat hasil pengujian dan batas pengukuran performa.
