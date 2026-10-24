<div align="center">

# Web Applications Showcase
### Curated Frontend & Full-Stack Projects Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-0F172A?style=flat-square)](LICENSE)

<br/>

**A collection of responsive, production-oriented web applications developed by [Raşit Tekin](https://github.com/Rasittekin18).**

</div>

---

## Genel Bakış (Overview)

Bu depo; tarayıcı tabanlı istemci araçlarından, reaktif dil öğrenme platformlarına ve bulut senkronizasyonlu alışkanlık/hedef planlama sistemlerine kadar farklı mimarilerde geliştirilmiş modern web uygulamalarını bir araya getirir.

Her proje kendi alt klasöründe tüm kaynak kodları, bileşenleri ve stil dosyalarıyla bağımsız olarak barındırılmaktadır.

---

## Uygulamalar ve Modüller

| # | Proje Adı | Açıklama | Teknoloji Yığını | Klasör Linki |
| :-: | :--- | :--- | :--- | :-: |
| 01 | **LearnLanguage App** | İnteraktif alıştırmalar, kelime kartları, günlük tutma ve ilerleme takip modülleri sunan modern dil öğrenme platformu. | React 18, TypeScript, Vite, Firebase Auth/Firestore | [`/learnlanguage`](./learnlanguage) |
| 02 | **Photo to PDF Converter** | Kullanıcı fotoğraflarını hiçbir sunucuya göndermeden, tamamen istemci tarafında (tarayıcıda) yüksek çözünürlüklü PDF dokümanlarına dönüştüren yerel araç. | Vanilla JavaScript, HTML5 Canvas, jsPDF, CSS3 | [`/photo-to-pdf`](./photo-to-pdf) |
| 03 | **Planner & Habit Tracker** | Günlük, haftalık ve yıllık hedeflerin takip edildiği, grafiksel analiz panelleri ve kullanıcı kimlik doğrulama sistemini içeren kişisel gelişim planlayıcısı. | HTML5, CSS3, JavaScript, Firebase Auth / Firestore | [`/planner-app`](./planner-app) |

---

## Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/Rasittekin18/web-applications-showcase.git
cd web-applications-showcase
```

### 2. İlgili Projeyi Çalıştırın

#### LearnLanguage (React & TypeScript)
```bash
cd learnlanguage
npm install
npm run dev
```

#### Photo to PDF & Planner App (Statik Web)
Herhangi bir yerel HTTP sunucusu ile anında çalıştırılabilir:
```bash
cd photo-to-pdf
python -m http.server 8000
# Tarayıcıda açın: http://localhost:8000
```

---

## Kullanılan Teknolojiler

- **Frontend Kütüphaneleri & Diller:** React 18, TypeScript, JavaScript (ES6+), HTML5, CSS3
- **Derleme Araçları:** Vite
- **Bulut & Kimlik Doğrulama:** Firebase (Authentication, Firestore)
- **Doküman & Medya:** jsPDF, HTML Canvas API

---

## Yazar

**Raşit Tekin**  
AI & Machine Learning Engineer | Electronics Background  
- Web: [rasittekin.com](https://www.rasittekin.com/)  
- LinkedIn: [linkedin.com/in/rasittekin](https://linkedin.com/in/rasittekin)  
- GitHub: [@Rasittekin18](https://github.com/Rasittekin18)  
- E-posta: [info@rasittekin.com](mailto:info@rasittekin.com)  

---

## Lisans

Bu repo kapsamındaki tüm projeler **MIT Lisansı** ile lisanslanmıştır.
