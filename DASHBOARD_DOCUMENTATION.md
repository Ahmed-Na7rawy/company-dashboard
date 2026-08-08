# Executive Business Intelligence Dashboard Documentation

This documentation describes the architecture, key features, and access control model of the **Enterprise Executive BI Dashboard**.

---

## 1. Executive Summary

The **Executive BI Dashboard** is a secure, high-performance, bilingual (English/Arabic RTL) business intelligence application that translates raw B2B and B2C transaction ledgers into department-specific strategic insights.

The dashboard is structured into **13 specialized command views** (CEO, B2B Sales, B2C Sales, HORECA Sales, Financial Planning, Supply Chain, Marketing, HR, Product Intelligence, Customer Profiles, Seller Profiles, Brand Performance, and System Admin Control).

---

## 2. Core Functional Modules

### 🔹 CEO Strategic View
Provides executive leadership with an immediate overview of company-wide health:
* **Inventory & Dead Stock**: Displays volumes of stagnant warehouse inventory.
* **Capital Health Index**: Scores working capital efficiency based on receivables.
* **Concentration Risks**: Highlights high-volume items reliant on key buyers.

### 🔹 B2B Sales Director View
Provides deep B2B sales metrics and sales rep performance tracking:
* **Timeline Analysis**: Tracks monthly gross sales vs. return volumes vs. net quantities.
* **Rep Leaderboards**: Ranks sales representatives by revenue contribution.

### 🔹 B2C Sales Director View
Focuses on high-volume consumer channels:
* **Channel Performance**: Monitors sales across Modern Trade, Distribution Offices, and E-Commerce.
* **Return Rate Analysis**: Identifies products with high return rates.

### 🔹 Financial Planning View
Assists finance teams in forecasting:
* **Revenue vs Collections**: Compares invoiced amounts with actual cash collections.
* **Margin Impact Analysis**: Simulates price and cost elasticity.

### 🔹 Supply Chain & Logistics View
Helps inventory managers maintain optimal stock:
* **SKU Safety Levels**: Alerts when inventory drops below safety thresholds.
* **Stock Turnover**: Measures inventory velocity.

---

## 3. Multithreaded Web Worker Engine

The application utilizes a background ES Web Worker thread (`src/workers/dataWorker.ts`) to execute data processing, filtering, and KPI computations off the main thread. This architecture guarantees a 60 FPS responsive UI even when handling large datasets.
