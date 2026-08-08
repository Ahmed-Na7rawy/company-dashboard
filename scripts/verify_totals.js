import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const excelPath = 'C:\\Users\\maiar pc\\Documents\\data\\Sales Report From 2022 - Mayar.xlsx';
const jsonPath = path.resolve('public/sales_data_compressed.json');

try {
  console.log('Loading Excel sheet to calculate ground truth...');
  const workbook = xlsx.readFile(excelPath);
  const worksheet = workbook.Sheets['Master'] || workbook.Sheets[workbook.SheetNames[0]];
  const excelRows = xlsx.utils.sheet_to_json(worksheet);

  let excelTotalQty = 0;
  let excelTotalRevenue = 0;

  excelRows.forEach(row => {
    const qty = parseFloat(row[' Qty '] || row['Qty']) || 0;
    const price = parseFloat(row[' Net Sales Price '] || row['Net Sales Price']) || 0;
    excelTotalQty += qty;
    excelTotalRevenue += price;
  });

  console.log('Excel ground truth calculated successfully.');

  console.log('Loading generated JSON database...');
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  let jsonTotalQty = 0;
  let jsonTotalRevenue = 0;

  // JSON format row index 11 is quantity, index 12 is price/revenue (or last two elements of row array)
  jsonContent.data.forEach(row => {
    const isFullFormat = row.length >= 13;
    const qty = row[isFullFormat ? 11 : 9];
    const price = row[isFullFormat ? 12 : 10];
    jsonTotalQty += qty;
    jsonTotalRevenue += price;
  });

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log('Total Transactions Count (Excel Raw):', excelRows.length);
  console.log('Total Daily Aggregated Rows (JSON):', jsonContent.data.length);
  
  console.log('\nQuantity Comparison:');
  console.log('  Excel Qty Sum:', excelTotalQty.toLocaleString());
  console.log('  JSON Qty Sum: ', jsonTotalQty.toLocaleString());
  console.log('  Difference:   ', (excelTotalQty - jsonTotalQty).toFixed(4));

  console.log('\nRevenue Comparison:');
  console.log('  Excel Net Sales Price Sum:', excelTotalRevenue.toLocaleString(), 'EGP');
  console.log('  JSON Net Sales Price Sum: ', jsonTotalRevenue.toLocaleString(), 'EGP');
  console.log('  Difference:               ', (excelTotalRevenue - jsonTotalRevenue).toFixed(4));
  
  if (Math.abs(excelTotalQty - jsonTotalQty) < 0.01 && Math.abs(excelTotalRevenue - jsonTotalRevenue) < 0.01) {
    console.log('\nSTATUS: SUCCESS! JSON database matches Excel ground truth 100% perfectly!');
  } else {
    console.log('\nSTATUS: WARNING! Mismatch detected! Please investigate.');
  }

} catch (error) {
  console.error('Error running verification:', error);
}
