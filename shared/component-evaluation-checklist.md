# Open Source Component Evaluation Checklist

## Purpose

This checklist must be completed **in order** whenever evaluating an open source component for use in Tau.*. Sections 1 and 2 are hard gates — if either is a no-go, stop there.

---

## 1. Licensing 🚦 — Hard Gate

| Question | Answer |
|----------|--------|
| What is the actual license — MIT, Apache, GPL, AGPL, BSL, or other? | |
| Can Tau use it commercially without restriction? | |
| Any copyleft clauses that could affect our own codebase? | |
| Is there a distinction between the open source license and a commercial or hosted version's terms? | |
| Have you read the license text — not just the badge on the README? | |

🚫 **If any answer here is unclear or unfavourable — stop. Do not proceed.**

---

## 2. Data Sensitivity 🚦 — Hard Gate

| Question | Answer |
|----------|--------|
| Does it send any data externally in its default configuration? | |
| Can it keep all data within our own infrastructure? | |
| Does it have telemetry, licensing pings, or update checks that phone home? | |
| Can it run in a fully air-gapped environment if needed? | |
| Have you reviewed the privacy policy or data terms of any third party it depends on? | |

🚫 **If any answer here is unclear or unfavourable — stop. Do not proceed.**

---

## 3. Understand It First

| Question | Answer |
|----------|--------|
| Can you explain in two sentences what it does and how? | |
| Have you actually run it — not just read about it? | |
| Have you read the source code at the top level, not just the README? | |
| Do you understand what it replaces and what it does not replace? | |

---

## 4. Fitness for Purpose

| Question | Answer |
|----------|--------|
| Does it cover all of the requirements of the component you are targeting or only some? | |
| Have you listed the gaps explicitly? | |
| Can the gaps be filled by building on top of it? | |
| Does it introduce new dependencies that create their own problems? | |

---

## 5. Self-Hosting and Deployment

| Question | Answer |
|----------|--------|
| Have you actually self-hosted it — not just confirmed it is possible? | |
| Does it fit into a Docker-based setup? | |
| What are the minimum infrastructure requirements? | |
| What does scaling look like — horizontal, vertical, or not at all? | |
| What happens under load? | |

---

## 6. Project Health

| Question | Answer |
|----------|--------|
| When was the last meaningful commit — actual code, not a documentation fix? | |
| Are issues being responded to or is the tracker a graveyard? | |
| How many active contributors are there? | |
| Is there a commercial entity or foundation backing the project? | |
| What is our exit strategy if it gets abandoned or goes proprietary? | |

---

## 7. Integration Effort

| Question | Answer |
|----------|--------|
| How much work to integrate into Tau's existing architecture? | |
| Does it introduce a new language or framework the team does not currently use? | |
| Is the API stable or does it change frequently between versions? | |
| Are breaking changes documented clearly in the changelog? | |

---

## 8. Alternatives Considered

| Question | Answer |
|----------|--------|
| Have you identified at least two alternatives? | |
| Can you state clearly why this one is better for Tau's specific context? | |
| Is there a proprietary option that would be significantly simpler even if it costs more? | |

---

## Final Three Questions

Before recommending anything, answer these in writing:

1. **What is the single biggest risk and how would you mitigate it?**

   > 

2. **What would have to be true for your recommendation to be wrong?**

   > 

3. **If this fails in production six months from now, what is the fallback?**

   > 

---

## Evaluation: Vexa (Meeting Transcription Platform)

**Component:** [Vexa](https://github.com/vexa-ai/vexa) — open source meeting transcription and AI agent platform  
**Target use case:** Real-time meeting recording, transcription, and speaker diarization for Tau.*  
**Evaluated by:** Rajeet Ash  
**Date:** 2026-05-25

---

### 1. Licensing 🚦 — Hard Gate

| Question | Answer |
|----------|--------|
| What is the actual license? | **Apache 2.0** — permissive, commercial-friendly |
| Can Tau use it commercially without restriction? | **Yes.** Apache 2.0 allows commercial use, modification, distribution, and private use without restriction. |
| Any copyleft clauses that could affect our own codebase? | **No.** Apache 2.0 is not copyleft. Modifications can remain proprietary. |
| Distinction between OSS license and commercial/hosted terms? | **No dual licensing.** The entire codebase is Apache 2.0. There is a hosted service at vexa.ai but the self-hosted version has no separate terms. |
| Have you read the license text? | **Yes.** Standard Apache 2.0 with patent grant. CLA required for contributions (Individual + Corporate CLA in `/CLA/`). |

✅ **PASS — proceed to Section 2.**

---

### 2. Data Sensitivity 🚦 — Hard Gate

| Question | Answer |
|----------|--------|
| Does it send any data externally in its default configuration? | **Configurable.** Default `env-example` points transcription to `transcription.vexa.ai` (cloud), but setting `LOCAL_TRANSCRIPTION=true` keeps everything local. We run with local GPU — zero external calls. |
| Can it keep all data within our own infrastructure? | **Yes.** PostgreSQL, Redis, MinIO (S3-compatible) all self-hosted. Audio never leaves the machine when using local Whisper. |
| Does it have telemetry, licensing pings, or update checks that phone home? | **No.** Grep of codebase shows zero telemetry, no analytics SDKs, no phone-home mechanisms. The only external call is the optional cloud transcription endpoint. |
| Can it run in a fully air-gapped environment? | **Yes.** With local transcription, pre-pulled Docker images, and pre-downloaded Whisper models (`models/` volume), it runs fully offline. Tested and confirmed. |
| Privacy policy / data terms of dependencies? | **Reviewed.** Core deps: faster-whisper (MIT), CTranslate2 (MIT), FastAPI (MIT), Next.js (MIT), Piper TTS (MIT). HuggingFace model download is one-time and can be pre-cached. No third-party data processors in the self-hosted path. |

✅ **PASS — proceed to Section 3.**

---

### 3. Understand It First

| Question | Answer |
|----------|--------|
| Two-sentence explanation | Vexa sends browser-based bots into video meetings (Zoom, Google Meet, Teams), captures per-speaker audio, transcribes it locally using Whisper on GPU, and stores transcripts + recordings in PostgreSQL/MinIO. It exposes a REST API and WebSocket for real-time transcript streaming and a Next.js dashboard for management. |
| Have you actually run it? | **Yes.** Full stack running on local machine with RTX 5050 GPU. Joined a live Google Meet, confirmed speaker detection, recording upload, and real-time transcription (after fixing compute type for Blackwell GPU). |
| Have you read the source code? | **Yes.** Reviewed: api-gateway (FastAPI routing/auth), meeting-api (bot lifecycle, transcription collector), runtime-api (Docker container management), transcription-service (faster-whisper), vexa-bot (Node.js Chromium automation), dashboard (Next.js). |
| What it replaces and what it does not | **Replaces:** Cloud transcription APIs (Otter.ai, Fireflies), meeting bot SDKs. **Does not replace:** Calendar integration (commented out), AI summarization/analysis (would need to build on top), user-facing mobile apps. |

---

### 4. Fitness for Purpose

| Question | Answer |
|----------|--------|
| Coverage of requirements | Covers: meeting joining (3 platforms), per-speaker audio capture, real-time transcription, recording storage, REST API, WebSocket streaming, dashboard UI. ~85% of target requirements. |
| Gaps explicitly listed | 1. No built-in summarization/action-item extraction. 2. Calendar auto-join (code exists but NO-SHIP for v0.10). 3. No mobile SDK. 4. No speaker voice fingerprinting (uses visual/DOM-based detection). 5. Agent-api (Claude Code integration) not shipped in current release. |
| Can gaps be filled? | **Yes.** Summarization: post-processing hook on transcript segments. Calendar: code exists, just needs enabling. Mobile: API-first design means any client can consume it. |
| New dependency problems? | Adds: Docker-in-Docker (runtime-api spawns bot containers), NVIDIA Container Toolkit (GPU transcription), ~2GB VRAM per model. These are manageable in our infrastructure. |

---

### 5. Self-Hosting and Deployment

| Question | Answer |
|----------|--------|
| Actually self-hosted? | **Yes.** Running right now on Windows + Docker Desktop + WSL2 with full GPU acceleration. All 12 containers healthy. |
| Docker-based? | **Yes.** Single `docker-compose.yml` brings up entire stack. Helm charts also available for K8s. |
| Minimum infrastructure | 1 machine: 4GB RAM (services) + GPU with 4-5GB VRAM (transcription). PostgreSQL, Redis, MinIO all containerized. |
| Scaling | **Horizontal:** Transcription workers scale behind nginx LB (add more GPU workers). Meeting bots scale per-container (one per meeting). API services are stateless. **Vertical:** Larger GPU = more concurrent transcriptions. |
| Under load | Transcription service has backpressure (503 when busy, configurable concurrency). Bot containers are isolated. Redis streams buffer segments. Tested with single meeting — production would need load testing for 10+ concurrent. |

---

### 6. Project Health

| Question | Answer |
|----------|--------|
| Last meaningful commit | Active development — multiple commits in May 2026 (current month). Version 0.10.x series with regular releases. |
| Issue tracker | Active — issues being responded to, PRs merged. Not a graveyard. |
| Active contributors | Small team (appears to be 2-4 core contributors based on commit history). |
| Commercial backing | **VexaAI** — commercial entity behind the project. Offers hosted service at vexa.ai. DockerHub images published under `vexaai/` namespace. |
| Exit strategy | Apache 2.0 means we can fork at any point. Core dependencies (faster-whisper, FastAPI, Chromium) are independently maintained. The architecture is modular — individual services can be replaced. |

---

### 7. Integration Effort

| Question | Answer |
|----------|--------|
| Integration work | **Medium.** API-first design means Tau can consume via REST/WebSocket. Main work: webhook integration for transcript delivery, user management sync, custom bot naming. Estimate: 1-2 weeks for basic integration, 4-6 weeks for full production setup. |
| New language/framework? | **No.** Python (FastAPI) + Node.js + TypeScript (Next.js) — all in our existing stack. |
| API stability | Versioned API (`/v1/audio/transcriptions`). OpenAPI spec available at `/docs`. Breaking changes documented in changelog. |
| Breaking changes documented? | **Yes.** Version-tagged releases with changelogs. Migration notes in docs. |

---

### 8. Alternatives Considered

| Alternative | Pros | Cons | Why not |
|-------------|------|------|---------|
| **Recall.ai** (proprietary) | Polished, managed service, multi-platform | $$$, data leaves infra, vendor lock-in, no self-host | Data sensitivity hard gate fails |
| **Whisper + custom bot** (build from scratch) | Full control, no dependencies | 3-6 months engineering, browser automation is hard, platform-specific quirks | Time-to-market too long |
| **AssemblyAI / Deepgram** (cloud APIs) | High accuracy, easy integration | Cloud-only, per-minute pricing, data leaves infra | Data sensitivity hard gate fails |

**Why Vexa:** Only option that passes both hard gates (Apache 2.0 + fully self-hosted with local GPU), covers 85%+ of requirements out of the box, and is already running in our environment.

---

### Final Three Questions

1. **What is the single biggest risk and how would you mitigate it?**

   > Small team / bus factor. If VexaAI pivots or abandons the project, we're on our own. **Mitigation:** Apache 2.0 allows forking. The architecture is modular (12 independent services). We should maintain our own fork with Tau-specific patches and pin to known-good versions rather than tracking HEAD.

2. **What would have to be true for your recommendation to be wrong?**

   > If Vexa's browser-based bot approach becomes unreliable due to platform changes (Google Meet/Zoom/Teams actively blocking bots), the core value proposition breaks. Also wrong if our meeting volume exceeds what a single-GPU setup can handle and horizontal scaling proves harder than documented.

3. **If this fails in production six months from now, what is the fallback?**

   > Short-term: Switch transcription to cloud API (Deepgram/AssemblyAI) — the architecture supports this via `TRANSCRIPTION_SERVICE_URL` env swap. Medium-term: Extract the Whisper transcription service (standalone, MIT-licensed faster-whisper) and rebuild bot layer using Playwright directly. The recordings in MinIO and transcripts in PostgreSQL remain accessible regardless.
