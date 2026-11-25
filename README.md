# Dijital Showroom & Yönetim Paneli (Render / Netlify Statik Site)

## 1. Logo Ekleme (`logo.png`)
Kendi logonuzu `lalila-site/public/images/logo.png` konumuna koyun.
- Navbar ve footer'daki "Lalila" yazısı kaldırıldı, doğrudan `logo.png` gösterilir.
- Tarayıcı sekmesindeki (favicon) dünya ikonu yerine de otomatik olarak `logo.png` gelir.

## 2. Render Üzerinde Yayınlama (Static Site)
Render'da **New + → Static Site** seçin:
- **Root Directory:** `lalila-site` (veya zip içeriğini doğrudan kök dizine koyduysanız boş bırakın)
- **Build Command:** boş bırakın
- **Publish Directory:** `public`
- **Redirects/Rewrites** sekmesine şu kuralları ekleyin:
  - `/product/*` → `/product.html` (Rewrite)
  - `/catalog` → `/catalog.html` (Rewrite)
  - `/admin/dashboard` → `/admin/dashboard.html` (Rewrite)

## 3. Firebase Ayarları (Admin Paneli & Veritabanı)
1. Firebase Console'da **Authentication > Settings > Authorized domains** kısmına Render alan adınızı (`*.onrender.com`) ekleyin.
2. **Firestore Database** oluşturun ve kurallarda (Rules) giriş yapmış yöneticinin yazmasına izin verin:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
3. Admin paneline `/admin/` adresinden giriş yapabilirsiniz.
