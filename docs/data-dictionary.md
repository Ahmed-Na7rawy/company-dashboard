# Business Intelligence Data Dictionary & KPI Formulas

This document provides a comprehensive reference of all key performance indicators (KPIs), mathematical formulas, source transaction fields, and aggregation rules implemented across the **Enterprise Executive BI Dashboard**.

---

## 1. CEO Strategic Command View (`src/components/CeoView/`)

### Net Sales / Net Revenue
- **Formula**: $\sum (\text{Gross Revenue for Sales Transactions}) - \sum (\text{Returned Revenue for Credit Memos})$
- **Source Fields**: `Revenue`, `BillType`, `Quantity`
- **Aggregation**: Filtered by selected time period window (3M, 6M, 12M, or Custom).
- **Code Reference**: [useCeoData.ts](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/CeoView/useCeoData.ts#L153-L168)

### Return Rate Percentage
- **Formula**: $\left( \frac{\text{Returned Volume}}{\text{Gross Sales Volume}} \right) \times 100$
- **Source Fields**: `Volume`, `Quantity`, `BillType`
- **Aggregation**: Ratio across selected filter window.
- **Code Reference**: [useCeoData.ts](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/CeoView/useCeoData.ts#L170-L175)

### AI Opportunity Confidence Score
- **Formula**: $0.40 \times \text{NormGrowth} + 0.40 \times \text{NormCoPurchase} + 0.20 \times \text{NormDensity}$
- **Source Fields**: Derived category growth rate and historical co-purchase overlap.
- **Aggregation**: Evaluated per product segment signal.
- **Code Reference**: [useCeoData.ts](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/CeoView/useCeoData.ts#L180-L195)

---

## 2. Sales Director View (`src/components/SalesDirectorView/`)

### YoY Revenue Growth Rate
- **Formula**: $\left( \frac{\text{Net Sales}_{\text{Current Period}} - \text{Net Sales}_{\text{Prior Period}}}{\text{Net Sales}_{\text{Prior Period}}} \right) \times 100$
- **Source Fields**: `Revenue`, `DateTimestamp`
- **Aggregation**: Multi-period comparison (e.g. Q1 2026 vs Q1 2025).
- **Code Reference**: [useSalesDirectorData.ts](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/SalesDirectorView/useSalesDirectorData.ts#L140-L160)

### Customer Concentration Risk Ratio
- **Formula**: $\left( \frac{\sum \text{Revenue of Top 5 Accounts}}{\text{Total B2B Net Revenue}} \right) \times 100$
- **Source Fields**: `CustomerName`, `Revenue`
- **Aggregation**: Cumulative rank across B2B account ledgers.
- **Code Reference**: [useSalesDirectorData.ts](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/SalesDirectorView/useSalesDirectorData.ts#L185-L200)

---

## 3. Brand Intelligence View (`src/components/BrandDashboardView/`)

### Normalized RFM Churn Risk Score
- **Formula**: $\text{Composite Risk} = (0.45 \times R_{\text{norm}} + 0.35 \times F_{\text{norm}} + 0.20 \times M_{\text{norm}}) \times 100$
  - $R_{\text{norm}} = \min(1, \frac{\text{Days Since Last Order}}{180})$
  - $F_{\text{norm}} = \max(0, 1 - \frac{\text{Order Frequency}}{50})$
  - $M_{\text{norm}} = \min(1, \frac{\text{Total Account Sales}}{500,000})$
- **Tiers**: $\ge 65 \Rightarrow \text{High Risk}$, $35\text{--}64 \Rightarrow \text{Medium Risk}$, $< 35 \Rightarrow \text{Low Risk}$
- **Source Fields**: `CustomerName`, `DateTimestamp`, `Revenue`
- **Code Reference**: [useBrandDashboard.ts](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/BrandDashboardView/useBrandDashboard.ts#L245-L276)

---

## 4. Supply Chain & Financial Planning Views (`src/components/SupplyChainView.tsx`, `FinancialPlanningView.tsx`)

### Inventory Days of Supply (DOS)
- **Formula**: $\frac{\text{Current Warehouse Stock Quantity}}{\text{Average Daily Run-Rate Volume}}$
- **Source Fields**: `StockOnHand`, `NetQuantity`, `Date`
- **Code Reference**: [SupplyChainView.tsx](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/SupplyChainView.tsx#L85-L105)

### Gross Operating Margin
- **Formula**: $\text{Net Revenue} - (\text{COGS} \times \text{MarginModifier})$
- **Source Fields**: `Revenue`, `adminSettings.marginModifier`
- **Code Reference**: [FinancialPlanningView.tsx](file:///c:/Users/medoc/OneDrive/Desktop/work/Central%20Dashboard/src/components/FinancialPlanningView.tsx#L120-L135)
