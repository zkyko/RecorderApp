# Project Specification: QA Studio Product Website

## 1. Overview
We are building a marketing and documentation website for **QA Studio**, an enterprise-grade test automation workbench designed specifically for Microsoft Dynamics 365 (D365).

The product is an Electron-based desktop application that combines:
1.  **Smart Recording:** A "Recorder-to-Runner" engine that captures D365 interactions.
2.  **AI Forensics:** A RAG-powered debugging system (using DeepSeek/OpenAI) that analyzes failed tests and explains *why* they failed.
3.  **Data-Driven Execution:** Running tests with Excel/JSON data parameters.

**Creator/Architect:** Nischal Bhandari.
**Target Audience:** QA Engineers, SDETs, and DevOps teams at Four Hands.

## 2. Tech Stack Requirements
* **Framework:** Next.js 14 (App Router).
* **Styling:** Tailwind CSS.
* **Components:** Shadcn/UI (for buttons, cards, dialogs).
* **Icons:** Lucide React.
* **Animations:** Framer Motion (for smooth entrance effects).
* **Deployment Target:** Vercel / Netlify.

## 3. Site Structure & Content

### A. Landing Page (Home)
* **Hero Section:**
    * **Headline:** "The Self-Healing Automation Workbench for D365."
    * **Subheadline:** "Stop wrestling with fragile selectors. Record, Generate, and Debug automation scripts with the power of AI Agents."
    * **CTAs:** Two buttons side-by-side: "Download for Windows (.exe)" and "Download for Mac (.dmg)".
    * **Visual:** A placeholder for a high-quality screenshot of the App Dashboard.
* **Feature Grid (Bento Grid Style):**
    * **AI Debugger:** "Chat with your tests. When a test fails, our RAG agent analyzes the logs and code to diagnose the issue instantly."
    * **Smart Recorder:** "D365-aware recording engine that handles complex navigation and deep-nested iframes automatically."
    * **Data-Driven:** "Run one test across 50 data scenarios. Import/Export Excel directly."
    * **BrowserStack Integration:** "Execute locally or scale to the cloud with one click."
* **Trust/Footer:**
    * "Architected & Built by Nischal Bhandari for Four Hands QA."
    * Links to: GitHub, Internal Confluence (placeholders).

### B. Documentation (`/docs`)
* A sidebar-layout documentation hub.
* **Categories:**
    * **Getting Started:** Installation, Setup Keys (OpenAI/DeepSeek).
    * **Architecture:** How the "Test Bundles" work (`.spec.ts` + `.meta.md`).
    * **Guides:** "How to record your first flow," "Using the AI Debugger."
* *Note:* Use a typography plugin (`@tailwindcss/typography`) to render clean Markdown.

### C. Download Page
* A clean table or card list showing versions (v1.5.0).
* Direct download links to the build artifacts.

## 4. Visual Identity (Vibe)
* **Theme:** Dark Mode by default (Slate/Zinc palette).
* **Accent Color:** Electric Blue / Violet (to represent AI/Intelligence).
* **Typography:** Modern Sans (Inter or Geist).
* **Look & Feel:** Professional, crisp, "Linear-like" aesthetics.

## 5. Specific Implementation Instructions for Cursor
1.  Start by creating the landing page structure using a `Hero` component and a `Features` component.
2.  Use Framer Motion to fade in elements as the user scrolls.
3.  Ensure the "Download" buttons are prominent.
4.  Include a "Made by Nischal Bhandari" credit in the footer component.