# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sugam Garbh (सुगम गर्भ) is a bilingual (Hindi/English) Telegram bot + web interface for pregnancy tracking and support. Built with Node.js, Express, MongoDB, and Google Gemini AI.

## Commands

- **Run the app:** `node index.js` (starts Express server on port 5000)
- **Install dependencies:** `npm install`
- **No test suite configured** — `npm test` is a no-op placeholder

## Architecture

**Entry point:** `index.js` — initializes Express server, MongoDB connection, Telegram bot polling, and cron jobs.

**Service layer pattern:**
- `services/botService.js` — Central orchestrator (~1000 lines). Handles all Telegram commands, user registration state machine, message routing, and callback queries. Uses an in-memory `Map` for tracking registration flow state.
- `services/pregnancyService.js` — Weekly pregnancy updates and health check reminders via cron (daily 9 AM IST, Mondays 10 AM IST).
- `services/geminiService.js` — Google Gemini AI integration for conversational responses. Falls back gracefully if unavailable.
- `services/keywordService.js` — Pattern-matching against predefined keyword datasets before falling back to Gemini AI.

**Message handling flow:** User message → keyword match check → if no match, Gemini AI response → attach feedback buttons.

**Data layer:**
- `models/User.js` — Mongoose schema with pre/post hooks for automatic AES-256-CBC encryption of sensitive fields (location, healthConditions).
- `config/database.js` — MongoDB connection setup.
- `utils/encryption.js` — AES-256-CBC encryption utilities.
- `utils/dateUtils.js` — Pregnancy week calculation and date parsing.

**Static content in `data/`:**
- `keywords.js` / `keywords-english.js` — Predefined keyword-response maps for common pregnancy topics.
- `pregnancyWeeks.js` / `pregnancyWeeks-english.js` — Week-by-week pregnancy information (weeks 1-42).

**Web interface:**
- `views/index.ejs` — Landing page.
- `views/chat.ejs` — Web chat interface.
- Express routes: `GET /`, `GET /chat`, `POST /api/chat`, `GET /health`.

## Bilingual Design

Language preference is stored per-user in MongoDB. All user-facing content (keywords, pregnancy weeks, bot messages, Gemini prompts) has Hindi and English variants. Keyword datasets and pregnancy week data are in separate files per language.

## Environment Variables

Key variables (see `.env.example`): `TELEGRAM_BOT_TOKEN`, `MONGODB_URI`, `ENCRYPTION_KEY` (32 chars), `PORT`, `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`.

## User Registration Flow

`/start` → language selection → consent → conception date input → optional info (age, location, parity) → registration complete → send current week info. State tracked in-memory via `userStates` Map in botService.
