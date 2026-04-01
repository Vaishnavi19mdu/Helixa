# 🏥 Helixa — Offline-First Healthcare Platform

> Connecting patients and doctors, even without internet.

---

## 📌 About

**Helixa** is a healthcare platform designed to improve access to medical support, especially in areas with limited or unreliable internet connectivity. It combines offline-first communication, AI-assisted symptom analysis, and real-time doctor interaction into a single platform.

---

## 🚨 The Problem

In many regions, patients face two major challenges:

- Limited access to doctors
- Unreliable or no internet connection

Most healthcare applications stop working completely when the connection is lost — Helixa doesn't.

---

## ✅ Key Features

### 👤 Patient Side
- **AI Symptom Checker** — Preliminary guidance based on user-reported symptoms
- **Appointment Management** — View and track upcoming consultations
- **Offline Messaging** — Messages are saved locally when offline and automatically synced once the connection is restored
- **Voice Messages** — Send voice notes to doctors even in low-connectivity situations

### 🧑‍⚕️ Doctor Side
- **AI-Generated Case Summaries** — Quickly understand patient cases at a glance
- **Priority Alerts** — Identify and respond to urgent cases efficiently
- **Chat & Voice Replies** — Flexible communication with patients
- **Video Consultations** — Instant video calls powered by **Jitsi**

### 🛠️ Admin Panel
- View and manage all users
- Approve or reject doctor registrations
- Monitor appointments across the platform
- Send notifications and live announcements to all users
- **Admin Assistant Bot** — Monitors system activity and provides quick insights

### 🌐 Additional Features
- **Multilingual Interface** — Supports multiple languages
- **Voice-First Interaction** — Accessible for users who prefer voice input
- **Low-Data Mode** — Optimized performance on slow or weak networks

---

## 🔌 Offline-First Architecture

Helixa's standout feature is its **offline-first design**:

1. User sends a message or voice note with no internet
2. The message is **queued and saved locally**
3. Once the connection is restored, the system **automatically syncs and delivers** all pending messages
4. The doctor receives everything — no data is ever lost

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Vite |
| Auth & Database | Firebase |
| AI Processing | Groq API |
| Video Calls | Jitsi |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/helixa.git

# Install dependencies
cd helixa
npm install

# Start the development server
npm run dev
```

> ⚠️ Make sure to add your Firebase and Groq API credentials in a `.env` file before running.

---

## 📁 Project Structure

```
helixa/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── patient/
│   │   ├── doctor/
│   │   └── admin/
│   ├── hooks/
│   └── utils/
├── public/
└── README.md
```

---

## 🎯 Project Goal

Helixa ensures that patients can access healthcare and communicate with doctors **even without reliable internet** — making it a practical solution for real-world healthcare challenges in underserved regions.

---