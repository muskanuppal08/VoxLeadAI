# VoxLeadAI – Autonomous AI Sales Voice Agent

> An enterprise-grade, full-duplex autonomous AI voice agent engineered for high-velocity inside sales, real-time BANT lead qualification, and automated demo scheduling.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18/19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Nova--2-13EF93?logo=deepgram&logoColor=black)](https://deepgram.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Turbo_v2.5-000000?logo=elevenlabs&logoColor=white)](https://elevenlabs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Project Overview

**VoxLeadAI** solves the critical speed-to-lead and SDR qualification bottleneck in B2B sales. In modern sales environments, inbound leads left unattended for even 30 minutes experience a 21x drop in qualification likelihood. VoxLeadAI acts as a 24/7 autonomous sales development executive ("Alex") that immediately initiates or receives calls with prospects.

### Core Capabilities:
- **Ultra-Low Latency Conversational Voice:** Sub-900ms round-trip speech interaction using streaming STT, sentence-boundary LLM token pipelining, and streaming TTS.
- **Bilingual & Code-Switching Agility:** Fluent, natural conversation in English, Hindi, and colloquial Hinglish.
- **Intelligent BANT Qualification:** Dynamically evaluates Budget, Authority, Need, and Timeline (0–100 BANT score) without sounding like a rigid survey.
- **Hallucination-Free RAG Knowledge Grounding:** Uses vector embeddings (Pinecone) to answer technical specifications, pricing tiers, and objection queries grounded strictly in company documentation.
- **Automated Demo Booking via Tool Calling:** Directly inspects sales team availability using the Google Calendar API and books confirmed slots with Google Meet invites.
- **Zero-Friction Barge-In / Interruption:** Real-time speech onset detection immediately aborts agent speech and flushes audio buffers when the prospect interrupts.
- **Executive Post-Call Summaries & Analytics:** Automatically generates call summaries, objection tags, customer sentiment polarity, and CRM sync.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Web Audio API | Live audio visualizer waveform, bidirectional streaming audio capture, and CRM dashboard |
| **Backend** | Node.js, Express.js, WebSockets (`ws`) | High-concurrency event-driven voice gateway and REST API |
| **Speech-to-Text (STT)** | Deepgram Nova-2 (WebSocket Streaming) | 16kHz Linear PCM live transcription with interim captions and endpointing |
| **Reasoning & Tool Calling** | OpenAI GPT-4o-mini | Low-latency TTFT (< 300ms) with JSON tool calling |
| **Text-to-Speech (TTS)** | ElevenLabs (Turbo v2.5 / WebSocket) | Natural conversational prosody with streaming sentence chunking |
| **Vector DB (RAG)** | Pinecone Serverless | Company sales doc embeddings (`text-embedding-3-small`) |
| **Calendar Integration** | Google Calendar API | Programmatic availability lookup and meeting booking |
| **Database & Queue** | MongoDB Atlas, Redis & BullMQ | Persistent CRM data, turn transcripts, and async post-call processing |

---

## 📂 Implementation Roadmap & Progress

- [x] **Phase 1: Project Architecture & Environment Scaffolding**
  - Modular project structure, environment configuration, and logging infrastructure.
- [x] **Phase 2 (Completed): Real-Time Voice Streaming Gateway (Module 1)**
  - [x] Node.js WebSocket gateway (`/ws/call`) with session connection lifecycle.
  - [x] Interactive browser-based Web Audio visualizer and test console (`/test-voice`).
  - [x] Voice agent persona and conversational guardrail prompt engineering.
  - [x] Deepgram Nova-2 STT streaming, ElevenLabs TTS streaming, and sentence-boundary chunking.
  - [x] Barge-in speech onset detection and instant audio buffer cancellation.
- [ ] **Phase 3: RAG Knowledge Base & Google Calendar Tool Calling**
- [ ] **Phase 4: Full React Dashboard, Lead CRM & Analytics**
- [ ] **Phase 5: BullMQ Async Summaries & Enterprise Hardening**

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/muskanuppal08/VoxLeadAI.git
   cd VoxLeadAI
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Add your API keys: OPENAI_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open the Interactive Voice Test Console in your browser:
   ```
   http://localhost:5001/test-voice
   ```

---

## 📄 License
This project is licensed under the MIT License.
