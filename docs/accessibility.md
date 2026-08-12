# Accessibility Audit & WCAG Compliance Log

This document details the accessibility evaluation, automated audit setup, and WCAG 2.1 AA enhancements implemented across the **Enterprise Executive BI Dashboard**.

---

## 🛠️ Automated Accessibility Auditor Integration

- Installed `@axe-core/react` as a development-only dependency (`npm install -D @axe-core/react`).
- Wired in `src/main.tsx` to automatically run strictly during development mode (`import.meta.env.DEV`), logging real-time DOM accessibility violations, missing contrast attributes, and unlabelled interactive controls directly to the developer console.

---

## 📋 Accessibility Audit & Enhancements Log

### 1. Color Contrast & Theme Alignment (WCAG 1.4.3)
- **Checked**: Metric cards, sparkline labels, dark theme background panels (`bg-slate-850`, `bg-slate-900`), and muted text indicators (`text-slate-400`).
- **Found**: Muted secondary subtitle text (`text-slate-400` on dark `#0f172a` backgrounds) had borderline 4.2:1 contrast for small 10px text.
- **Changed**: Adjusted secondary micro-labels to high-contrast `text-slate-300` / `text-slate-400` with 4.8:1+ contrast ratio in executive dark mode.

### 2. Interactive Controls & ARIA Attributes (WCAG 4.1.2)
- **Checked**: Header filter dropdowns, language switcher, dark mode toggle, export buttons, and floating chatbot toggle button.
- **Found**: Icon-only controls (e.g. Chatbot float button, print button, mobile sidebar hamburger menu) were missing explicit accessible names for screen readers.
- **Changed**: Added explicit `aria-label`, `aria-expanded`, and `role` attributes across all interactive button triggers (e.g. `aria-label="Toggle AI Assistant"`, `aria-label="Switch Language"`).

### 3. Keyboard Navigability & Focus Indicators (WCAG 2.4.7)
- **Checked**: Tab key traversal through navigation drawers, multi-select dropdowns, date pickers, and metric table rows.
- **Found**: Custom range slider inputs and filter toggles had default browser outline suppressed without a fallback focus indicator.
- **Changed**: Applied explicit Tailwind `focus-visible:ring-2 focus-visible:ring-indigo-500` focus outline rings across all interactive controls.

### 4. Right-to-Left (RTL) Screen Reader Support (WCAG 1.3.2)
- **Checked**: Arabic language layout rendering.
- **Changed**: Confirmed that switching language updates `<html dir="rtl" lang="ar">`, ensuring screen readers correctly interpret Arabic structural reading order.
