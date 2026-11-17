<div align="center">
  <h1>Gelişim Takibi &amp; Kişisel Planlayıcı 🚀</h1>
  <p><strong>Hayatınızı organize edin, alışkanlıklarınızı takip edin ve hedeflerinize ulaşın.</strong></p>

  <br/>

  <a href="https://planner-app-chi-three.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀_Uygulamayı_Canlı_Olarak_Dene-Buraya_Tıklayın-2ea44f?style=for-the-badge&logo=vercel" alt="Canlı Demo İçin Tıklayın" height="45" />
  </a>
  <br/>
  <p><i>👉 Hemen denemek için yukarıdaki butona tıklayabilirsiniz. 👈</i></p>

  <br/>
</div>

---

## 📖 Proje Hakkında

**Gelişim Takibi**, kişisel gelişiminizi veri odaklı ve görsel olarak takip edebileceğiniz modern bir web uygulamasıdır. Günlerinizi nasıl geçirdiğinizi puanlayabilir, günlük görevlerinizi ve haftalık/yıllık hedeflerinizi belirleyip ilerlemenizi yüzdelik dilimlerle takip edebilir, ruh halinize göre kişisel günlük tutabilir ve verilerinizi JSON olarak yedekleyebilirsiniz.

Uygulama hem **Firebase Authentication + Firestore** ile cihazlar arası bulut senkronizasyonunu hem de hesap açmadan tarayıcı üzerinde anında çalışabilen **Misafir / Yerel Modu** destekler.

---

## 🛠️ Özellikler ve Kullanım Rehberi

### 1. Kayıt, Şifre Kurtarma &amp; Misafir Modu 🔒
- **Bulut Hesabı:** E-posta ve şifre ile kayıt olarak verilerinizi Firestore üzerinde güvenle senkronize edebilirsiniz; şifre sıfırlama bağlantısı ve Ayarlar üzerinden şifre değiştirme desteği mevcuttur.
- **Misafir / Yerel Mod:** Hesap oluşturmadan tüm planlama, grafik ve günlük araçlarını tarayıcınızın yerel deposunda (`localStorage`) anında deneyebilirsiniz.

### 2. Takvim Görünümü ve Gün Puanlama (`index.html`) 📅
- **Günü Puanlama:** Her günü `＋ İyi Gün`, `○ Normal` veya `− Kötü Gün` olarak değerlendirin ve kesintisiz **İyi Gün Serisi (Streak)** takibi yapın.
- **Takvim &amp; Ay Filtresi:** Geçmiş, bugün ve gelecek tarihlere serbestçe görev ve not ekleyin; yıl/ay filtreleri ve tek tıkla **"Bugünü Yönet"** kısayolu ile hızlıca kayıt oluşturun.

### 3. Günlük Planlama (`planner.html`) ✅
- **3 Durumlu Görev Takibi:** Görevleri `Bekliyor (○) → Tamamlandı (✓) → Yapılamadı (✕)` arasında değiştirin, satır içi düzenleyin ve duruma göre filtreleyin.
- **Ertesi Güne Aktarma:** Tamamlanmayan görevleri tek tıkla (**Yarına Aktar**) ertesi güne kopyalayın.
- **Entegre Gün Puanı &amp; Notu:** Takvim modülüyle senkronize çalışan gün puanlama butonları ve otomatik kaydedilen gün notu alanı.

### 4. Haftalık ve Yıllık Hedefler (`weekly.html`, `yearly.html`) 🎯
- **Haftalık Hedefler:** Haftanın günlerine göre doğrudan Günlük Planlayıcı'ya geçiş yapın, hedefleri durumuna göre filtreleyin ve tamamlanmayan hedefleri tek tıkla gelecek haftaya aktarın.
- **Yıllık Hedefler:** Özel simge ve renklerle kategoriler oluşturun (veya tek tıkla örnek kategorilerle başlayın), öncelik seviyesi belirleyin; başlık, etiket ve notlarda anlık arama yapın.

### 5. Kişisel Günlük (`journal.html`) 📖
- Çizgili defter görünümünde günlük sayfaları oluşturun, 5 kademeli ruh hali (`Harika`, `İyi`, `Orta`, `Zor`, `Çok Zor`) ve etiket ekleyin.
- Geçmiş sayfalarda **arama + ruh hali filtresi** uygulayın, yazma serinizi (Streak) takip edin ve `Ctrl+S` ile hızlıca kaydedin.

### 6. İnteraktif Grafik Analizi (`chart.html`) 📈
- `1 Hafta`, `1 Ay`, `3 Ay`, `6 Ay`, `1 Yıl` ve `Tümü` dönem filtreleriyle kümülatif gelişim eğrinizi, en iyi serinizi ve görev tamamlama oranlarınızı inceleyin.
- Günlük kayıt kartlarına tıklayarak doğrudan o günün planlayıcısına geçin.

### 7. Tema Özelleştirme &amp; Yedekleme (`settings.html`) ⚙️
- **Çoklu Tema &amp; Aydınlık Mod:** *Karanlık, Aydınlık, Gece Yarısı, Okyanus, Orman* hazır temaları veya **Özel Tema Oluşturucu** + yazı boyutu (`Küçük / Orta / Büyük`) ayarları.
- **JSON Dışa &amp; İçe Aktarma:** Tüm verilerinizi JSON formatında yedekleyin ve istediğiniz zaman tek tıkla geri yükleyin.

---

## 💻 Teknolojik Altyapı

- **Frontend:** Saf HTML5, CSS3 (Responsive, Dark/Light &amp; Custom Themes, Glassmorphism) ve Vanilla JavaScript (`app_common.js` ortak çekirdek).
- **Backend &amp; Veritabanı:** Firebase Firestore (anlık senkronizasyon + sayfa geçişlerinde otomatik flush) ve Firebase Authentication.
- **Yerel Çalışma:** Firebase yapılandırması olmayan ortamlarda otomatik Misafir / Yerel Mod desteği.
- **Hosting &amp; Güvenlik:** Vercel / Firebase Hosting uyumlu, XSS korumalı (`escHtml`) ve responsive mobil arayüz.

---

## ▶️ Yerelde Çalıştırma

```bash
cd planner-app
python -m http.server 8000
# Tarayıcıda açın: http://localhost:8000
```

> **Not:** Bulut senkronizasyonunu etkinleştirmek için [`planner-app/firebase_sync.js`](../planner-app/firebase_sync.js) içindeki `firebaseConfig.apiKey` değerini kendi Firebase projenizin anahtarıyla güncelleyebilir veya doğrudan **Misafir / Yerel Mod** ile kullanabilirsiniz.

---

## 📸 Uygulama İçi Görseller

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Ana Menü ve Skor Takibi</b><br><br><img src="https://github.com/user-attachments/assets/6bc00ec4-2a22-4b16-9251-7fc78703cbdf" width="300" alt="Ana Menü"/></td>
      <td align="center"><b>Giriş Yap / Kayıt Ol</b><br><br><img src="https://github.com/user-attachments/assets/8a6bba9e-ac98-477d-a0fc-f287395a9deb" width="300" alt="Giriş Ekranı"/></td>
    </tr>
  </table>

  <br>

  <b>Takvim ve Gelişim Görünümü</b><br><br>
  <img src="https://github.com/user-attachments/assets/ceb41066-1bea-4780-a2d0-881162ad2dc9" width="800" alt="Takvim Görünümü"/>
</div>
