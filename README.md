# LMS YPP - AI-Assisted Interactive LMS

> **Belajar Bareng AI, Tetap Pakai Otak**  
> AI provides hints only, never answers.

An interactive Learning Management System for SMP & SMA Indonesia (Grades 7-12) built with Next.js 14.

## Features

- 🤖 **AI Hint Assistant** - Token-based hint system with guardrails
- 🏁 **Competition System** - Daily Sprint, Class Battles, Tournaments
- 📊 **Balanced Scoring** - Not just speed, includes reasoning quality
- 🔒 **Exam Mode** - AI lock for integrity
- 🎮 **Gamification** - XP, badges, streaks, leaderboards

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- localStorage (MVP) → PostgreSQL (V1)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── contexts/      # React contexts (Auth, Game, AI Hint)
├── lib/           # Utilities and helpers
└── types/         # TypeScript type definitions
```
