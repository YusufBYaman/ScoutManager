# ScoutManager — EA Sports FC 26 Kariyer Analizi & Oyuncu Arama

ScoutManager, **EA Sports FC 26** Kariyer Modu save dosyalarınızı (`CmMgrC...` veya `Career...`) tarayıcınızda doğrudan çözen, kadronuzu analiz eden ve 20.000+ oyuncuyu SoFIFA derinliğinde aramanızı sağlayan modern bir web uygulamasıdır.

![ScoutManager Banner](web/public/favicon.svg)

---

## 🚀 Özellikler

- **🗂️ 5 Adet Save Dosyası Hafızası (Slot Sistemi):** 5 farklı kariyerinizi kaydedebilir, isim, sezon ve tarih bilgileriyle anında tek tıkla aralarında geçiş yapabilirsiniz.
- **⚡ %100 İstemci Taraflı & Gizli:** Tüm Frostbite ve ZSTD decompress işlemleri tarayıcı içi Web Worker ile çalışır. Save dosyalarınız hiçbir harici sunucuya yüklenmez.
- **👥 Kadro & Taktik Görünümü:** Kulübünüzün as 11'i ve yedek kadrosu, sözleşme süreleri, güncel maaş ve piyasa değerleri.
- **🌟 Wonderkids (Genç Yetenekler):** 21 yaş altı ve potansiyeli 80+ olan tüm oyuncular, gelişim farkı (`+DIFF`) sıralamasıyla.
- **🔍 Gelişmiş Oyuncu Arama (SoFIFA Stili):** 
  - 41.190 gerçek oyuncu ismi desteği
  - 6 Temel Kart İstatistiği: **HIZ (PAC), ŞUT (SHO), PAS (PAS), DRİ (DRI), DEF (DEF), FİZ (PHY)**
  - Mevki filtreleri (GK, DEF, MID, ATT ve detaylı pozisyonlar)
  - Yaş, Reyting, Potansiyel, Maaş ve Değer filtreleri
- **📊 Tüm Tablolarda Çift Yönlü Sıralama:** Tüm sütunlara tıklayarak artan/azalan sıralama yapabilme.
- **🏆 Takım İncelemeleri:** Tüm dünya takımlarının hücum, orta saha, savunma ve genel reytingleri.

---

## 🛠️ Kurulum & Yerel Çalıştırma

### Kolay Başlatma (Windows)
Klasör içindeki **`baslat.bat`** dosyasına çift tıklayarak tek adımda web uygulamasını başlatabilirsiniz.

### Manuel Başlatma

1. Web arayüzü dizinine gidin:
   ```bash
   cd web
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Geliştirici sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda `http://localhost:5173` adresini açın.

---

## 🌐 Canlıya Alma (Firebase Hosting)

Proje Firebase Hosting (`scoutmanager-c5a03`) için hazır yapılandırılmıştır.

```bash
# 1. Web projesini derleyin
cd web
npm run build
cd ..

# 2. Firebase'e deploy edin
npx firebase-tools deploy --only hosting --project scoutmanager-c5a03
```

---

## 📁 Save Dosyası Nerede Bulunur?

EA Sports FC 26 kariyer save dosyalarınız genellikle şu konumda yer alır:
```text
C:\Kullanıcılar\<KullanıcıAdınız>\Belgeler\FC 26\settings\CmMgrC...
```

---

## 📄 Lisans
MIT License.
