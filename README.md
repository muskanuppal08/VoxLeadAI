# VoxLeadAI – Autonomous AI Sales Voice Agent

> An enterprise-grade, full-duplex autonomous AI voice agent engineered for high-velocity inside sales, real-time BANT lead qualification, and automated demo scheduling.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18/19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Nova--2-13EF93?logo=deepgram&logoColor=black)](https://deepgram.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Turbo_v2.5-000000?logo=elevenlabs&logoColor=white)](https://elevenlabs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Technical Report](https://img.shields.io/badge/Report-1--Page%20Executive%20Evaluation-blue?logo=read-the-docs&logoColor=white)](PROJECT_REPORT.md)

> 📄 **Technical Reviewers:** Please see the formal **[1-Page Executive Project Report (PROJECT_REPORT.md)](PROJECT_REPORT.md)** for commercial feasibility, operating economics (\$0.02/min), security compliance, and 100,000-user scalability analysis.

---

## 🌟 Project Overview

**VoxLeadAI** solves the critical speed-to-lead and SDR qualification bottleneck in B2B sales. In modern sales environments, inbound leads left unattended for even 30 minutes experience a 21x drop in qualification likelihood. VoxLeadAI acts as a 24/7 autonomous sales development executive ("Arohi") that immediately initiates or receives calls with prospects.

### Core Capabilities:
- **Ultra-Low Latency Conversational Voice:** Sub-900ms round-trip speech interaction using streaming STT, sentence-boundary LLM token pipelining, and streaming TTS.
- **Bilingual & Code-Switching Agility:** Fluent, natural conversation in English, Hindi, and colloquial Hinglish.
- **Intelligent BANT Qualification:** Dynamically evaluates Budget, Authority, Need, and Timeline (0–100 BANT score) without sounding like a rigid survey.
- **Hallucination-Free RAG Knowledge Grounding:** Uses vector embeddings (Pinecone) to answer technical specifications, pricing tiers, and objection queries grounded strictly in company documentation.
- **Automated Demo Booking via Tool Calling:** Directly inspects sales team availability using the Google Calendar API and books confirmed slots with Google Meet invites.
- **Zero-Friction Barge-In / Interruption:** Real-time speech onset detection immediately aborts agent speech and flushes audio buffers when the prospect interrupts.
- **Executive Post-Call Summaries & Analytics:** Automatically generates call summaries, objection tags, customer sentiment polarity, and CRM sync.

---

## 🛠️ System Architecture & Technology Stack

```mermaid
flowchart TB
    subgraph Client ["1. Presentation Layer (React.js + Tailwind)"]
        UI["Web Dashboard & CRM View"]
        WebAudio["Web Audio API (16kHz PCM & AnalyserNode)"]
        Subtitles["Live Streaming Captions"]
    end

    subgraph Gateway ["2. Real-Time Gateway (Node.js & Express)"]
        WSS["WebSocket Server (/ws/call)"]
        Session["Call Session State Machine (Listening/Thinking/Speaking)"]
        VAD["Voice Activity Detection (Barge-in Interruption)"]
        WSS <--> Session <--> VAD
    end

    subgraph AIOrchestration ["3. AI Intelligence & Tool Calling"]
        STT["Deepgram Nova-2 (Bilingual STT)"]
        LLM["OpenAI GPT-4o-mini (Sentence Chunking)"]
        TTS["ElevenLabs Turbo v2.5 / Web Speech Engine"]
        ToolRouter["Tool Execution Dispatcher"]
        
        Session <--> STT
        STT --> LLM
        LLM --> ToolRouter
        LLM --> TTS
        TTS --> Session
    end

    subgraph Integrations ["4. Business Integrations & Data"]
        KnowledgeStore["Grounded Company Knowledge Store"]
        CalendarAPI["Google Calendar Service (Meet Links)"]
        CRMDB["Leads & BANT CRM Store"]
        
        ToolRouter <--> KnowledgeStore
        ToolRouter <--> CalendarAPI
        ToolRouter <--> CRMDB
    end

    WebAudio <== "Bi-directional WebSocket" ==> WSS
    UI <== "REST API (/api/v1)" ==> Gateway
```

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
  - Modular monorepo project structure, environment configuration, and logging infrastructure.
- [x] **Phase 2 (Completed): Real-Time Voice Streaming Gateway (Module 1)**
  - [x] Node.js WebSocket gateway (`/ws/call`) with session connection lifecycle.
  - [x] Interactive browser-based Web Audio visualizer and test console (`/test-voice`).
  - [x] Voice agent persona and conversational guardrail prompt engineering.
  - [x] Deepgram Nova-2 STT streaming, ElevenLabs TTS streaming, and sentence-boundary chunking.
  - [x] Barge-in speech onset detection and instant audio buffer cancellation.
- [x] **Phase 3 (Completed): AI Tool Calling & Grounded Discovery (Module 2)**
  - [x] Verified company knowledge grounding store (Pricing tiers, Features, Security/HIPAA specs).
  - [x] Google Calendar demo availability checking & appointment booking engine with Google Meet links.
  - [x] Function calling JSON schemas for `search_company_info`, `check_calendar_availability`, and `book_calendar_appointment`.
  - [x] BANT lead qualification scoring algorithm (0–100 scale).
  - [x] Dynamic real-time tool badges in conversation stream.
- [x] **Phase 4 (Completed): Full React Dashboard, Lead CRM & Analytics (Module 8)**
  - [x] Vite + React 18 SPA with Tailwind CSS and glassmorphism UI.
  - [x] 1-Click Recruiter Demo Access authentication screen.
  - [x] Executive Sales KPI Dashboard with interactive Recharts volume curves.
  - [x] Live Voice Console with glowing 3D visualizer orb, waveform audio canvas, and live subtitles.
  - [x] Leads & BANT CRM Table with status badges and detail drawers.
  - [x] Booked Demos page with direct Google Meet join links.
- [ ] **Phase 5: BullMQ Distributed Async Summaries & Enterprise Hardening**

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher

### Installation & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/muskanuppal08/VoxLeadAI.git
   cd VoxLeadAI
   ```

2. **Install dependencies for both server and client:**
   ```bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   cd ..
   ```

3. **Configure environment variables (optional):**
   ```bash
   cd server
   cp .env.example .env
   # Add your API keys if desired: OPENAI_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY
   # (Note: Built-in intelligent browser voice fallbacks allow full testing even without keys!)
   cd ..
   ```

4. **Start the Backend Server (Terminal 1):**
   ```bash
   cd server
   npm start
   # Server runs on http://localhost:5001
   ```

5. **Start the React Frontend Application (Terminal 2):**
   ```bash
   cd client
   npm run dev
   # React app runs on http://localhost:5173
   ```

6. **Open in Your Browser:**
   - **Full React Dashboard & CRM Console:** [http://localhost:5173](http://localhost:5173) (Click *1-Click Recruiter Demo Access*)
   - **Interactive Voice Test Console:** [http://localhost:5001/test-voice](http://localhost:5001/test-voice)
   - **REST API Diagnostics:** [http://localhost:5001/api/v1/health](http://localhost:5001/api/v1/health)

---

## 📄 License
This project is licensed under the MIT License.
