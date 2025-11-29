# Product Website Specification: QA Studio

**Architect:** Nischal Bhandari

**Target Audience:** QA Engineers, SDETs, and Enterprise D365 Teams.

## 1. Core Narrative (The "Why")

We are not just selling a tool; we are selling a solution to the "D365 Automation Dilemma."

* **The Conflict:** We evaluated market leaders. **BrowserStack LCA** was too fragile for dynamic ERPs. **Executive Automats** cost $100/user and hid the code.

* **The Resolution:** We built **QA Studio**. It combines the stability of **Playwright** with a custom-built Recorder Engine designed specifically for the D365 DOM.

* **The "Secret Sauce":** It uses an Agentic AI (RAG) workflow to self-diagnose failures, turning "flaky tests" into "solved problems."

## 2. Tech Stack & Design System

* **Framework:** Next.js 14 (App Router) + TypeScript.

* **Styling:** Tailwind CSS.

* **UI Components:** Shadcn/UI + Aceternity UI (for high-end effects).

* **Animation:** Framer Motion (smooth fade-ins, hover glows).

* **Theme:** **"Deep Space" Dark Mode.** Backgrounds are `zinc-950`. Accents are Electric Violet (`violet-500`) and Cyan (`cyan-400`).

## 3. Site Structure & Content

### A. Landing Page (`/`)

* **Hero Section:**

    * **H1:** "The Self-Healing Automation Workbench for D365."

    * **Sub:** "Stop wrestling with fragile selectors. Record resilient flows, generate native Playwright code, and let AI Agents diagnose your failures."

    * **Visual:** A tilted, 3D-perspective screenshot of the QA Studio Dashboard (use a placeholder for now).

    * **Social Proof Badge:** "Architected by Nischal Bhandari for Four Hands QA."

* **The "Origin Story" Section (Comparison):**

    * *Headline:* "Why we built this."

    * *Format:* A Comparison Grid (Use a 'Bento Grid' layout).

    * *Card 1 (The Problem):* "BrowserStack LCA." Tagline: "Too Fragile." Description: "Great for static webs, but breaks on D365's dynamic iframes."

    * *Card 2 (The Problem):* "Executive Automats." Tagline: "Too Expensive." Description: "$100/seat and vendor lock-in. We wanted code we own."

    * *Card 3 (The Solution):* "QA Studio." Tagline: "Just Right." Description: "Native Playwright output. Zero licensing costs. AI-driven stability."

* **Feature Highlight (The "AI Brain"):**

    * Focus on the **RAG Debugger**.

    * *Copy:* "Don't just see 'Failed'. See 'Why'. Our embedded AI agent analyzes your specific test code and error logs to explain the root cause instantly."

### B. Documentation (`/docs`)

* **Layout:** Sidebar navigation (left), Content (center), On-this-page (right).

* **Content Strategy:**

    * **"Architecture":** Explain the `.spec.ts` + `.meta.md` bundle concept.

    * **"The Recorder":** Explain how we handle D365 `waitFor` logic automatically.

    * **"AI Setup":** Guide on adding OpenAI/DeepSeek keys.

### C. Download Page (`/download`)

* Simple, clean card layout.

* **Windows:** "Download .exe (v1.5.0)" - Highlight as recommended.

* **Mac:** "Download .dmg (v1.5.0)" - For development/recording.

## 4. Specific Component Instructions for Cursor

* **Navbar:** Floating "glass" navbar with blur effect. Links: Features, Story, Docs, Download.

* **Buttons:** "Shimmer" buttons (animated border shine) for the primary Download CTA.

* **Footer:** Minimalist. Must include: "Designed & Built by Nischal Bhandari."

## 5. Brand Strategy: "The Engineer's Choice"

We will position QA Studio as the "Goldilocks" solution:

* **Not a Toy:** It's not a fragile "Low-Code" tool like BrowserStack LCA.

* **Not a Black Box:** It's not a locked-down, expensive vendor tool like Executive Automats.

* **The Pitch:** "The control of Playwright. The speed of a Recorder. The intelligence of AI."

## 6. The Design Aesthetic (The "Linear" Look)

* **Vibe:** Dark mode, neon purple/blue accents (Cyberpunk/Developer aesthetic).

* **Typography:** Inter or Geist Sans (Clean, technical).

* **Layout:** Bento Grids for features, huge typography for the Hero.

