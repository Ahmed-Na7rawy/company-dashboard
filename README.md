# Enterprise Executive BI Dashboard

A high-performance, responsive, bilingual (English & Arabic RTL) executive analytics and control center for modern B2B & B2C enterprise operations.

Built with a **Multithreaded Web Worker Engine** that offloads heavy dataset filtering and metric aggregations to a background thread, maintaining a 60 FPS responsive UI during complex analytical operations.

---

## ⚡ Key Highlights & Architecture

- **Multithreaded Web Worker Engine**: Offloads transaction processing, search indexing, and multi-period calculations off the main thread.
- **Bilingual & RTL Native**: Instant full English and Arabic UI translation with right-to-left layout alignment.
- **13 Specialized Executive Views**: CEO Strategic View, B2B Sales, B2C Sales, HORECA, Financial Planning, Supply Chain & Inventory, Marketing Ads, HR Operations, Product Intelligence, Customer Profiles, Seller Profiles, Brand Performance, and System Admin Control.
- **Synthetic Data Generator**: Includes a built-in `@faker-js/faker` dataset generator for offline testing and demonstration.
- **Executive Dark/Light Mode**: Sleek glassmorphic theme system with responsive mobile drawer navigation.

---

## 🔑 Demonstration Login Credentials

The application enforces strict **Role-Based Access Control (RBAC)**. Log in with any of the accounts below to test role-specific features:

| Role / Department | Username | Password | Access Scope & Perspective |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin123` | Full global system control, user target settings, unfiltered access. |
| **CEO / Executive** | `ceo` | `ceo123` | Strategic executive summary, high-level revenue KPIs, customer/seller profiles. |
| **Financial Director** | `finance` | `finance123` | Financial planning, margin calculators, revenue vs collection streams. |
| **B2B Sales Director** | `b2b_director` | `b2b123` | B2B sales pipelines, target comparisons, customer concentration risk. |
| **B2C Sales Director** | `b2c_director` | `b2c123` | B2C retail channels, product return analysis, channel performance. |
| **HORECA Sales Director** | `horeca_director` | `horeca123` | Hotel, restaurant, & catering sector sales & volume metrics. |
| **Supply Chain & Logistics** | `supply_chain` | `sc123` | Inventory turnover, SKU safety levels, and warehouse logistics tracking. |
| **Marketing & Advertising** | `marketing` | `mkt123` | Campaign ROAS, channel conversion, and customer acquisition metrics. |
| **HR & Operations** | `hr_director` | `hr123` | Department headcount, sales rep performance leaderboard, and operational alerts. |
| **Brand Manager** | `brand_manager` | `brand123` | Product brand dashboards and regional distribution mapping. |
| **Field Sales Representative** | `sales_rep` | `rep123` | Personalized sales rep view scoped strictly to assigned customer accounts. |

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Threading Engine**: Native ES Web Workers (`src/workers/dataWorker.ts`)
- **Visualizations**: Recharts + Plotly.js + Leaflet Maps
- **Styling**: Vanilla CSS + Tailwind CSS v4 + Glassmorphism Design System
- **Icons**: Lucide React
- **Synthetic Data**: `@faker-js/faker`

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.


### 3. Build for Production
```bash
npm run build
```
Generates an optimized static bundle in the `dist` directory.
