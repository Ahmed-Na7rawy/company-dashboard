import fs from 'fs';
import path from 'path';

const quarters = ['All_All', '2026_Q1', '2026_Q2', '2026_Q3', '2026_Q4', '2025_Q1', '2025_Q2', '2025_Q3', '2025_Q4'];
const brands = ['nova_combined', 'zenith', 'nova_koffi', 'nova_frappit', 'nova_smoozy'];

const generateBrandData = () => {
  const data = {};
  
  for (const brand of brands) {
    data[brand] = {
      quarterly_comparison: {
        '2026_Q1': [1200000, 1500000, 1300000],
        '2026_Q2': [1300000, 1600000, 1400000],
        '2025_Q1': [1100000, 1400000, 1200000],
        '2025_Q2': [1200000, 1500000, 1300000]
      },
      filters: {}
    };
    
    for (const q of quarters) {
      data[brand].filters[q] = {
        metrics: {
          revenue: Math.floor(Math.random() * 5000000) + 1000000,
          qty: Math.floor(Math.random() * 50000) + 5000,
          return_rate: (Math.random() * 5).toFixed(1)
        },
        product_share: [
          { 'Material Desc': 'Original Blend', Net_Sales: 2000000, Quantity: 8000 },
          { 'Material Desc': 'Vanilla Roast', Net_Sales: 1500000, Quantity: 4000 },
          { 'Material Desc': 'Caramel Infusion', Net_Sales: 1000000, Quantity: 3000 }
        ],
        salespersons: [
          { name: 'Alice Smith', sales: 1200000, active_accounts: 45, target_achievement: 110 },
          { name: 'Bob Jones', sales: 900000, active_accounts: 30, target_achievement: 95 },
          { name: 'Charlie Doe', sales: 1100000, active_accounts: 35, target_achievement: 105 },
          { name: 'Diana Prince', sales: 800000, active_accounts: 25, target_achievement: 90 }
        ],
        churn: {
          summary: {
            low: 120, medium: 40, high: 15, total_customers: 175,
            avg_risk_score: 32, revenue_at_risk: 450000
          },
          at_risk: [
            { customer_name: 'Corp A', probability: 85, last_order_date: '2026-05-15', total_revenue: 120000, top_product: 'Original Blend' },
            { customer_name: 'Corp B', probability: 70, last_order_date: '2026-06-01', total_revenue: 80000, top_product: 'Vanilla Roast' },
            { customer_name: 'Corp C', probability: 60, last_order_date: '2026-06-10', total_revenue: 60000, top_product: 'Caramel Infusion' }
          ]
        },
        monthly_trends: [
          { month: 'Jan', product: 'Original Blend', sales: 150000 },
          { month: 'Feb', product: 'Original Blend', sales: 160000 },
          { month: 'Mar', product: 'Original Blend', sales: 155000 }
        ],
        top_customers: [
          { name: 'MegaMart', total_sales: 500000, orders_count: 25 },
          { name: 'SuperGrocers', total_sales: 450000, orders_count: 20 },
          { name: 'LocalStore', total_sales: 300000, orders_count: 15 }
        ]
      };
    }
  }
  
  return data;
};

const finalData = generateBrandData();

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataSourceDir = path.join(__dirname, '../data-source');
if (!fs.existsSync(dataSourceDir)) {
  fs.mkdirSync(dataSourceDir);
}
fs.writeFileSync(path.join(dataSourceDir, 'brand_sales_data.json'), JSON.stringify(finalData, null, 2));
fs.writeFileSync(path.join(__dirname, '../src/data/nova_zenith_sales_data.json'), JSON.stringify(finalData, null, 2));

console.log('✅ Generated brand data successfully!');
