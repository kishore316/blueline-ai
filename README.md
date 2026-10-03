# Blueline-AI

### An approachable cybersecurity assistant for small teams

Blueline-AI explores how one assistant could help teams understand threats, prioritize vulnerabilities and respond to incidents. Built as a collaborative AI-First Hackathon prototype, it presents security workflows in plain language.

**[Open live demo](https://ai-security-prototype-iitjammu-hack.vercel.app/)** · [Original team repository](https://github.com/AggarwalKashvi/AI-security-prototype) · [Kishore’s portfolio](https://kishore-portifolio.ai.studio/)

## Project status

This repository contains a React presentation and simulated interactive walkthrough. Assistant responses, threat feeds and scanning examples are pre-scripted demonstration content. Production APIs, live security integrations and automated penetration testing are not implemented in this frontend prototype.

## The problem

Small organizations often lack a dedicated security desk. Blueline brings together the intended experience of understanding alerts, reviewing security findings and receiving practical next-step guidance in one interface.

## Demonstrated workflows

| Workflow | Prototype experience |
| --- | --- |
| Security assistant | Plain-language security questions and example answers |
| Threat detection | A simulated feed of security events |
| Vulnerability assessment | Example scan findings and prioritization |
| Phishing detection | An explanation of suspicious-message indicators |
| Incident response | Suggested containment and escalation steps |
| Threat intelligence | A preview of contextual security guidance |

The demo also illustrates proposed dashboard, REST API, chat-bot and CLI access. These are design concepts rather than deployed production endpoints.

## Technology

**Implemented:** React 19, JavaScript, Vite, CSS and ESLint.

**Proposed integration architecture:** Llama, LangChain/RAG, OpenCTI, Wazuh, Greenbone, FastAPI, PostgreSQL, Docker and NIST guidance. The live demo describes these as the intended stack; the integrations are not included in this repository.

## Run locally

Install a Node.js version compatible with the Vite version in `package.json`, then:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production frontend build |
| `npm run preview` | Preview the build locally |
| `npm run lint` | Run ESLint |

## Repository layout

- `src/` — React application and styles
- `public/` — static assets
- `index.html` — frontend entry page
- `vite.config.js` — Vite configuration
- `eslint.config.js` — lint configuration

## Team and attribution

Developed as a collaborative project for the SS26 AI-First Hackathon by Team Kernal Panic, as credited in the demo. This is Kishore Karuturi’s portfolio fork of [AggarwalKashvi/AI-security-prototype](https://github.com/AggarwalKashvi/AI-security-prototype). Original authorship and commit history are preserved.

## Next steps

- Connect the interface to authenticated backend services.
- Replace simulated events with validated security-tool integrations.
- Add retrieval-backed assistant answers and auditable reporting.
- Evaluate the workflows with controlled datasets and documented results.

## Connect

[LinkedIn](https://www.linkedin.com/in/kishore-karuturi/) · [Portfolio](https://kishore-portifolio.ai.studio/)
