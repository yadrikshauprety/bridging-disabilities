# 🌉 DisabilityBridge

### An Accessibility-First Job Interview Platform for Persons with Disabilities in India

*Voice on hover · Sign Language interviews · AI Government Schemes · SOS Alerts · **Blockchain UDID Ledger***

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Solidity](https://img.shields.io/badge/Solidity-0.8-363636.svg)](https://soliditylang.org)
[![MetaMask](https://img.shields.io/badge/MetaMask-Wallet-f6851b.svg)](https://metamask.io)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MetaMask Extension** (for blockchain registration)
- **Twilio Account** (for SOS WhatsApp alerts)
- **Groq API Key** (for AI-powered OCR and transcription)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/bridging-disabilities.git
cd bridging-disabilities

# Install all Node.js dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../blockchain && npm install
```

### 2. Blockchain Setup (Hardhat)

The project uses a local Ethereum blockchain for UDID verification.

```bash
# 1. Start the local node (Terminal 1)
cd blockchain
npx hardhat node

# 2. Deploy the smart contract (Terminal 2)
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**MetaMask Configuration:**
- Network: `Localhost 8545`
- Chain ID: `31337`
- Currency: `ETH`
- Import Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` (First Hardhat account)

### 3. Environment Configuration

Create `.env` files in both `frontend` and `backend` directories.

#### **Backend (`backend/.env`)**
```env
GROQ_API_KEY=your_groq_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Run the Platform

From the **root directory**, run:

```bash
npm run dev
```

---

## ⛓️ Blockchain UDID Ecosystem

DisabilityBridge ensures immutable verification of disability certificates.

1.  **PwD Portal**: Users upload their Aadhaar/UDID card. AI (Groq Vision) extracts identity data automatically.
2.  **Agency Portal (`/agency`)**: Government evaluators review applications. Clicking **"Generate Card"** records a unique Aadhaar-to-UDID mapping on the Ethereum blockchain via MetaMask.
3.  **Verification Portal (`/verify`)**: A public-facing ledger explorer where employers or hospitals can verify a UDID's authenticity instantly.

---

## ♿ Key Features

- **Voice-on-Hover**: Interactive accessibility engine for visually impaired users.
- **Sign Language interviews**: MediaPipe-powered gesture recognition.
- **AI Scheme Search**: Intelligent government scheme discovery.
- **Blockchain Ledger**: Anti-fraud UDID certificate verification.

---

## ⚖ License

[MIT](LICENSE) © 2026 DisabilityBridge Team
