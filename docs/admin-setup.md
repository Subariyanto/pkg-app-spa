# Setup Admin Sistem Aktivasi PKG

## Prasyarat

- Supabase project sudah dibuat
- SQL migration Tahap 1-4 sudah di-apply di urutan:
  1. `sql/pkg_activation_v2.sql`
  2. `sql/pkg_activation_v2_tahap2.sql`
  3. `sql/pkg_activation_v2_tahap3.sql`
  4. `sql/pkg_activation_v2_tahap4.sql`

## Langkah 1: Buat Akun Admin di Supabase Auth

1. Buka **Supabase Dashboard** → **Authentication** → **Users**
2. Klik **Add user** → **Create new user**
3. Isi:
   - Email: `admin@pokjawas.com` (atau email admin lain)
   - Password: password kuat (min 12 karakter)
   - **Auto Confirm User**: ✅ centang
4. Klik **Create user**

## Langkah 2: Daftarkan ke tabel pkg_admins

Buka **SQL Editor** di Supabase, jalankan:

```sql
INSERT INTO public.pkg_admins (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'admin@pokjawas.com';
```

Ganti `admin@pokjawas.com` dengan email admin yang sebenarnya.

## Langkah 3: Verifikasi

Jalankan query berikut untuk verifikasi:

```sql
SELECT
  pa.email,
  pa.role,
  au.email AS auth_email,
  au.created_at
FROM public.pkg_admins pa
JOIN auth.users au ON au.id = pa.user_id;
```

Pastikan muncul 1 row dengan email admin.

## Langkah 4: Test Login

1. Buka aplikasi PKG
2. Menu **Kelola Kode Aktivasi**
3. Login dengan email & password admin
4. Jika berhasil, akan muncul Dashboard dengan 8 stat cards

## Menambah Admin Lain

Ulangi Langkah 1-2 untuk setiap admin baru. Beberapa admin bisa ditambahkan dengan role berbeda:

```sql
INSERT INTO public.pkg_admins (user_id, email, role)
VALUES
  ('uuid-admin-2', 'admin2@pokjawas.com', 'admin'),
  ('uuid-admin-3', 'admin3@pokjawas.com', 'admin');
```

## Keamanan Akun Admin

- **Password kuat**: min 12 karakter, campuran huruf/angka/simbol
- **Jangan share password**: setiap admin punya akun sendiri
- **Audit log**: semua aksi admin tercatat dengan `admin_email`
- **Session expiry**: JWT expiry otomatis, auto-logout jika 401/403
- **MFA (opsional)**: bisa diaktifkan di Supabase Dashboard → Authentication → MFA

## Reset Password Admin

Jika lupa password:
1. Supabase Dashboard → Authentication → Users
2. Klik user admin → **Send password reset**
3. Admin akan terima email reset password
4. Atau langsung set password baru di dashboard

## Hapus Admin

```sql
DELETE FROM public.pkg_admins WHERE email = 'admin@pokjawas.com';
```

**Catatan**: akun di `auth.users` tetap ada, hanya akses admin yang dicabut.
