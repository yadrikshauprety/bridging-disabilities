# 🌉 DisabilityBridge

### An Accessibility-First Job Interview Platform for Persons with Disabilities in India

*Voice on hover · Sign Language interviews · AI Government Schemes · SOS Alerts*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Twilio](https://img.shields.io/badge/Twilio-WhatsApp-red.svg)](https://twilio.com)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.9 or higher)
- **Twilio Account** (for SOS WhatsApp alerts)
- **Groq API Key** (for real-time transcription and AI cleanup)
- **Tavily API Key** (for AI-powered government scheme searches)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/bridging-disabilities.git
cd bridging-disabilities

# Install all Node.js dependencies
npm run install:all
```

### 2. Python Environment Setup

The backend relies on Python for sign language recognition and gesture analysis.

```bash
cd backend
pip install -r requirements.txt
```

### 3. Environment Configuration

Create `.env` files in both `frontend` and `backend` directories.

#### **Backend (`backend/.env`)**
```env
# AI & Search
GROQ_API_KEY=your_groq_key_here
TAVILY_API_KEY=your_tavily_key_here

# SOS Notifications (Twilio)
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 # Twilio Sandbox Number
```

#### **Frontend (`frontend/.env`)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Platform

From the **root directory**, run:

```bash
npm run dev
```

This starts:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:5000](http://localhost:5000)

---

## 🚨 SOS Setup (WhatsApp)

DisabilityBridge includes an emergency SOS feature. To receive alerts on your phone during testing:

1. **Join the Twilio Sandbox**: Open WhatsApp on your phone and send `join glass-cow` (or your specific sandbox keyword) to **+1 415 523 8886**.
2. **Configure Profile**: Sign in as a PWD user, go to **KYC Profile**, and set your phone number as the **Trusted Contact** (include country code, e.g., `+919019320048`).
3. **Trigger**: Click the red SOS button. Your location and a plea for help will be sent to your contact instantly.

---

## 🛠 Tech Stack & Architecture

### Frontend
- **React 19 + Vite**: Ultra-fast performance and modern UI.
- **TanStack Router**: Type-safe navigation.
- **Web Speech API**: Powers the voice-on-hover accessibility engine.
- **MediaPipe Hands**: In-browser hand tracking for interviews.

### Backend
- **Express.js + SQLite**: Lightweight, file-based database for jobs and KYC.
- **Python Bridge**: Executes `ml_service.py` for advanced gesture recognition.
- **Twilio API**: Handles emergency communication via WhatsApp.
- **Groq Llama 3**: AI-driven transcription cleanup and interview processing.

### Directory Structure
```
bridging-disabilities/
├── frontend/               # React Application
│   └── src/
│       ├── routes/         # Page components (Jobs, Interview, Profile)
│       ├── components/     # A11y components (SOS Button, Voice Assistant)
│       └── lib/            # Accessibility Context & Voice Router
└── backend/                # Express Server
    ├── routes/             # API Endpoints (Auth, SOS, ML, Schemes)
    ├── ml_service.py       # Python bridge for gesture recognition
    └── database.sqlite     # Local data storage
```

---

## ♿ Accessibility Features

- **Voice-on-Hover**: Every interactive element is read aloud automatically for visually impaired users.
- **Sign Language Interviews**: Candidates can answer questions using hand gestures.
- **Guided Onboarding**: A step-by-step voice-guided setup for PWD preferences.
- **Smart Captions**: Real-time cleanup of interview transcripts using AI.

---

## ⚖ License

[MIT](LICENSE) © 2026 DisabilityBridge Team
