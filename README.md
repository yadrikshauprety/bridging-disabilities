<div align="center">

# 🌉 DisabilityBridge

### An Accessibility-First Job Interview Platform for Persons with Disabilities in India

*Voice on hover · Sign Language interviews · Employer job portal · PDF transcripts*

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands_Lite-FF6F00.svg)](https://mediapipe.dev)

</div>

---

## What is DisabilityBridge?

DisabilityBridge is a two-sided platform that connects **Persons with Disabilities (PWDs)** with **inclusive employers** through an accessible, sign-language-powered interview experience.

| PWD Side | Employer Side |
|---|---|
| Voice reads every element on hover | Clean, standard dashboard — no accessibility noise |
| Browse accessible job listings | Post jobs with custom interview questions |
| Answer interview questions via hand signs | View structured transcripts for every candidate |
| Real-time MediaPipe gesture recognition | Download transcripts as PDF with one click |
| Captions panel + ISL support | No sign-up for demo — log in as Employer |

---

## Architecture

```
bridging-disabilities/
├── frontend/          # React 19 + Vite + TanStack Router
│   └── src/
│       ├── routes/
│       │   ├── employer.tsx        ← Standalone Employer Portal (no PWD features)
│       │   ├── app.interview.tsx   ← MediaPipe sign-language interview
│       │   ├── app.jobs.tsx        ← PWD job listings
│       │   ├── auth.sign-in.tsx    ← Role-based login
│       │   └── onboarding.tsx      ← Voice-guided accessibility setup
│       ├── components/
│       │   ├── hover-speak.tsx     ← Global voice-on-hover engine
│       │   └── portal-layout.tsx   ← PWD sidebar + captions + SOS
│       └── lib/
│           └── accessibility-context.tsx
└── backend/           # Node.js + Express + SQLite
    ├── server.js
    ├── db.js                       ← SQLite schema (jobs + interviews)
    └── routes/
        ├── jobs.js                 ← CRUD for job listings
        ├── interviews.js           ← Submit & fetch transcripts
        └── ml.js                   ← LiST model pipeline endpoint
```

---

## How the Sign Language Interview Works

1. **Employer** logs in → creates a job with custom interview questions
2. **PWD Candidate** browses jobs → clicks *Start Interview* for a job
3. Camera opens + **MediaPipe Hands Lite** loads in-browser (no server round-trip)
4. Candidate holds a hand sign for ~1 second
5. A **25-frame rolling majority vote** classifies the gesture (60% threshold to lock)
6. The answer is spoken aloud, captioned, and added to the live transcript
7. Candidate clicks **Submit Interview** → transcript saved to SQLite
8. Employer opens **Applications** tab → reads transcript → clicks **⬇ Download PDF**

### Supported Gestures

| Sign | Meaning |
|------|---------|
| 🖐 Open palm | Yes |
| ✊ Fist | No |
| 👍 Thumbs up | Yes — Confident |
| ✌️ Peace / Two fingers | Yes — Two years of experience |
| ☝️ Pointing | Let me explain |
| 🤟 I-Love-You | Thank you for the opportunity |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18 or higher**
- A modern browser (Chrome recommended for MediaPipe)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/bridging-disabilities.git
cd bridging-disabilities
```

### 2. Install all dependencies

```bash
# Install root + frontend + backend in one go
npm run install:all
```

> Or manually: `npm install` in root, `frontend/`, and `backend/` folders.

### 3. Run the app

```bash
npm run dev
```

This starts both servers concurrently:

| Service | URL |
|---------|-----|
| **Frontend** (Vite) | http://localhost:5173 |
| **Backend** (Express) | http://localhost:5000 |

---

## Usage Guide

### As an Employer

1. Open the app → click **Sign In**
2. Select **🏢 Employer** tab → enter any credentials → click **Sign in**
3. You land on the **Employer Portal** (separate from PWD experience)
4. **Create Job** tab: enter job details, add interview questions → Post
5. **Applications** tab: see candidate transcripts → Download PDF

### As a PWD Candidate

1. Open the app → click **Sign In**
2. Select **👤 Person with Disability** → Sign in
3. Complete the **voice-guided onboarding** (disability type, language, location)
4. Browse **Jobs** → click **Start Interview** on a listing
5. Allow camera access → click **▶ Start Camera** → **🤟 Start Detecting**
6. Answer each question using the hand signs shown
7. Click **✓ Submit Interview to Employer** when done

> **Tip:** Hover over any button or text to hear it read aloud — the voice assistant is on by default.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 + Vite |
| Routing | TanStack Router (file-based) |
| Sign language detection | MediaPipe Hands Lite (CDN) |
| Gesture classification | Pure JS — 25-frame rolling buffer majority vote |
| Accessibility | Web Speech API (TTS + STT) |
| Backend | Node.js + Express |
| Database | SQLite via `sqlite3` + `sqlite` |
| Process management | `concurrently` |

---

## ML Model — LiST Architecture (Ready for Integration)

The backend endpoint `/api/ml/recognize-sign` is structured as the **LiST (Lightweight ISL Translation)** pipeline:

- **Input:** Full video frame buffer (WebM)
- **Stage 1:** InceptionV3 feature extraction
- **Stage 2:** Two-layer LSTM sequence decoder
- **Output:** Full natural-language sentence

Currently running a **mock decoder** for demo purposes. To plug in real weights:

1. Place your INCLUDE-dataset `.tflite` or `.h5` model in `backend/models/`
2. Replace the mock in `backend/routes/ml.js` with `@tensorflow/tfjs-node` inference

---

## Environment Variables

No environment variables are required to run the demo. For production:

```env
# backend/.env
PORT=5000
NODE_ENV=production
```

---

## Contributing

Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE) © DisabilityBridge Team
