const fs = require('fs');
const path = require('path');

// Mock data mapping to match App.tsx definitions
const pushItems = [
  { sku: 'Sodium Tripolyphosphate', group: 'Non-Starch', currentStock: 8500, safetyStock: 4200, surplus: 4300, discount: '15%' },
  { sku: 'Carrageenan', group: 'Non-Starch', currentStock: 6200, safetyStock: 3100, surplus: 3100, discount: '10%' },
  { sku: 'Guar Gum', group: 'Non-Starch', currentStock: 9800, safetyStock: 5400, surplus: 4400, discount: '15%' },
  { sku: 'Potato Starch', group: 'Starch', currentStock: 14000, safetyStock: 8000, surplus: 6000, discount: '10%' }
];

const exportsDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir);
}

const csvPath = path.join(exportsDir, 'weekly_push_list.csv');

// Construct CSV content
let csvContent = 'SKU Name,Category Group,Current Stock,Safety Stock,Surplus Quantity,Pre-Approved Discount\n';
pushItems.forEach(item => {
  csvContent += `"${item.sku}","${item.group}",${item.currentStock},${item.safetyStock},${item.surplus},"${item.discount}"\n`;
});

try {
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`[Push List Pipeline] CSV file generated successfully at: ${csvPath}`);
  
  // Simulate Monday 8:00 AM email dispatch
  console.log('\n=========================================');
  console.log('Dispatching Weekly Push List Email...');
  console.log('To: b2b-sales-team@apexenterprises.com');
  console.log('Subject: [Apex S&OP Bridge] Weekly Clearance Priorities - Monday Dispatch');
  console.log('Body:');
  console.log('Hi Team,');
  console.log('\nBelow are the active inventory clearance priorities for this week. Please target these SKUs during client calls. Margin discounts are pre-approved:\n');
  pushItems.forEach(item => {
    console.log(` * ${item.sku} (${item.group}) - Surplus: ${item.surplus.toLocaleString()} Qty - Pre-Approved Discount: ${item.discount} Off`);
  });
  console.log('\nWeekly CSV file has been published to SharePoint directory /exports/weekly_push_list.csv.');
  console.log('=========================================\n');
} catch (err) {
  console.error('Failed to run push list pipeline:', err);
  process.exit(1);
}
