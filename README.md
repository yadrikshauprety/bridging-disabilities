# 🌉 Udaan: Bridging the Accessibility Gap

### *India's First Integrated Ecosystem for PwD Employment, Welfare, and Advocacy*

Udaan is not just a portal; it is a holistic infrastructure designed to empower the 2.68 crore Persons with Disabilities in India. By integrating AI, Blockchain, and real-time accessibility tools, we solve the fragmentation of information and the lack of verified inclusive opportunities.

---

## 🌟 The Udaan Advantage: 12 Unique Features
*No single Indian platform currently offers this comprehensive suite of accessibility tools.*

### 🛠️ For Candidates (PwDs)

**F1: Crowdsourced Accessibility Map — India's First**
- Community-rated reviews of restaurants, hospitals, and transit hubs on 5 parameters (Ramp/Lift, Accessible Toilet, Braille Signage, Audio Announcements, and Parking).
- Integrated with Google Maps API for wheelchair-accessible routing.

**F4: UDID Application Navigator with Status Tracker**
- A 12-language guided wizard that pre-fills forms using Aadhaar data and identifies the exact medical authority for your district.
- Real-time status tracking via automated portal polling.

**F5: Scheme Entitlement Engine — "What am I owed?"**
- AI-driven matching based on UDID band (White/Yellow/Red), state, and disability type. 
- Aggregates benefits from DEPwD, MSJE, and all 28 state departments in one place.

**F8: Emergency SOS — Location Broadcast**
- One-tap GPS broadcast to 3 pre-saved contacts and the nearest DDRC (District Disability Rehabilitation Centre).
- Automatically generates timestamped incident reports for RPwD Act grievances.

**F9: Voice-First Interface (Multilingual)**
- 100% operable by voice in Hindi, Kannada, Tamil, Telugu, Bengali, and Marathi.
- Meets WCAG 2.1 AA and IS 17802 standards, making the platform legally compliant by design.

**F10: Disability Card Digital Wallet**
- Secure, DigiLocker-style digital storage of UDID and railway concession cards.
- Future-ready for NFC-tap verification at government counters.

**F11: Community Forum — Peer-to-Peer Knowledge**
- A moderated network for sharing local "accessibility hacks" and job tips.
- Expert moderation by certified social workers from NGOs like Enable India.

---

### 🏢 For Employers & HR Teams

**F2: RPwD Compliance Checker for Employers**
- A 20-question data-driven checklist that generates an instant compliance score and gap report.
- Passing companies earn the **"DisabilityBridge Verified"** badge for their job listings.

**F6: Accessible Job Portal with Verified Filters**
- Job listings include real accessibility scores: wheelchair access, ISL interpreter availability, and WFH flexibility.
- Candidates filter by their specific disability type to find *genuinely* accessible roles.

**F7: Real-Time Auto-Captioning for Video Interviews**
- A browser-based tool that deaf candidates use during live calls (Google Meet/Zoom).
- transcribes speech to text in real-time with zero app downloads required.

**F12: Employer DEI Dashboard — B2B Analytics**
- HR-facing SaaS dashboard to track PwD hiring % against the 3% mandate.
- Benchmark your company’s inclusion progress against industry peers.

---

### 🌐 For the Ecosystem

**F3: AI-Powered ISL Translation Widget**
- A floating web widget that converts page text into an **ISL Avatar** performing signs in real-time.
- Bridges the gap for 18 million deaf Indians served by only 250 certified interpreters.

---

## 🏗️ Technical Architecture

- **Frontend**: React (Vite), TanStack Router, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (Express), SQLite (Local State), Supabase (Real-time Bridge).
- **Blockchain**: Solidity, Hardhat, Ethers.js (UDID Ledger).
- **AI/ML**: MediaPipe (Gesture Recognition), Groq Llama 3 (RAG & NLP).
- **Voice**: Web Speech API (Multilingual Recognition).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MetaMask Extension** (Connected to `Localhost 8545`)
- **Supabase Account** (For Real-time Bridge features)
- **Twilio Sandbox** (For WhatsApp SOS & Notifications)

### 2. Installation
```bash
git clone https://github.com/YOUR_USERNAME/bridging-disabilities.git
cd bridging-disabilities && npm install
```

### 3. Blockchain Setup
```bash
# Terminal 1
cd blockchain && npx hardhat node

# Terminal 2
cd blockchain && npx hardhat run scripts/deploy.js --network localhost
```

### 4. Run the Platform
```bash
npm run dev
```

---

## ⚖ License
MIT © 2026 Udaan Team
