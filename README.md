# PKG App SPA - Penilaian Kinerja Guru

Aplikasi web Penilaian Kinerja Guru (PKG) madrasah berbasis instrumen resmi Kemenag (407 indikator, 9 peran). Single-page app yang berjalan langsung di browser dengan localStorage sebagai database.

🔗 **Live**: https://subariyanto.github.io/pkg-app/

## Fitur

- **Beranda** — statistik & daftar peran
- **Data Guru** — CRUD lengkap dengan identitas Kemenag
- **Penilaian** — form per peran (Sumatif/Formatif), auto-save, nilai akhir real-time
- **Kehadiran** — input bulanan
- **PKB** — 3 prioritas pengembangan
- **Rekap** — tabel semua guru + Export CSV
- **Import** — parse Master PKG (.xlsm/.xlsx), single & batch
- **Backup/Restore** — Export/Import JSON
- **Cetak** — laporan A4 ready (window.print)
- **Instrumen** — viewer 407 indikator
- **PWA** — install ke HP, offline-ready

## Peran (9)
GMP, BK, TIK (skor 0-2), WKKUR, WKSIS, WKSAR, WKHUM (skor 0-4), LAB, PUS (skor 0-2)

## Stack
- Vanilla JS + hash routing
- Bootstrap 5 + Bootstrap Icons via CDN
- ExcelJS via CDN (parse xlsm)
- localStorage (key prefix `pkg_v1_`)
- Service Worker (offline cache)

## File Struktur
```
index.html       Entry point (loads CSS + JS)
style.css        Tema hijau Kemenag
instrumen.js     407 indikator embedded (auto-generated)
db.js            Data layer + business logic (hitungNilai, dst)
importer.js      Parser Master PKG xlsm
app.js           Router + 10 views
manifest.json    PWA manifest
sw.js            Service worker (offline)
icon-192.png     PWA icon
icon-512.png     PWA icon
generate-icons.js Generator icon (run sekali)
```

## Cara Pakai

1. Buka https://subariyanto.github.io/pkg-app/
2. (Opsional) Install sebagai PWA: di Chrome HP, menu → "Add to Home screen"
3. Tambah guru manual atau Import xlsm dari menu Import
4. Klik nama guru → pilih peran → mulai penilaian (auto-save)
5. **Backup berkala**: menu Backup → Download JSON

## ⚠️ Penting

- **Data per device**: localStorage hanya di browser ini. Pindah HP/laptop = data kosong.
- **Clear browser data = data hilang**. Backup dulu.
- **Import xlsm pertama kali butuh internet** (load library ExcelJS dari CDN). Setelah itu cached untuk offline.

## Development Lokal

```bash
# Serve folder ini lewat HTTP server apa saja
python -m http.server 8000
# atau
npx serve .
```

Buka http://localhost:8000

## Versi Server (Express + SQLite)
Repo: https://github.com/Subariyanto/pkg-app
Pakai versi server kalau:
- Mau database multi-user (bukan per-device)
- Mau deploy ke VPS/Railway dgn data terpusat

## Lisensi
Internal Kemenag Jember - bebas pakai untuk keperluan supervisi.
