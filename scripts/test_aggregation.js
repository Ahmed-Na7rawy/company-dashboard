import xlsx from 'xlsx';

const filePath = 'C:\\Users\\maiar pc\\Documents\\data\\Sales Report From 2022 - Copy.xlsx';

try {
  console.log('Loading workbook...');
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets['Master'];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const customers = new Set();
  const products = new Set();
  const salesmen = new Set();
  const segments = new Set();
  const itemGroups = new Set();
  const offices = new Set();
  const billTypes = new Set();
  
  let totalQty = 0;
  let totalSales = 0;

  for (const row of data) {
    customers.add(row['Customer Name']);
    products.add(row['Material Desc']);
    salesmen.add(row['Salesman Name']);
    segments.add(row['Company']);
    itemGroups.add(row['Item Group']);
    offices.add(row['Sales Office']);
    billTypes.add(row['Bill Type']);
    
    const qty = parseFloat(row[' Qty '] || row['Qty']) || 0;
    const price = parseFloat(row[' Net Sales Price '] || row['Net Sales Price']) || 0;
    totalQty += qty;
    totalSales += price;
  }

  console.log('Total Raw Rows:', data.length);
  console.log('Unique Customers:', customers.size);
  console.log('Unique Products:', products.size);
  console.log('Unique Salesmen:', salesmen.size);
  console.log('Unique Segments (Company):', segments.size);
  console.log('Unique Item Groups:', itemGroups.size);
  console.log('Unique Sales Offices:', offices.size);
  console.log('Unique Bill Types:', billTypes.size);
  console.log('Total Sales volume (Qty):', totalQty);
  console.log('Total Revenue (Net Sales):', totalSales);
  
  console.log('\nSegments list:', Array.from(segments));
  console.log('Salesmen list:', Array.from(salesmen));
  console.log('Item Groups list:', Array.from(itemGroups));
  console.log('Sales Offices list:', Array.from(offices));
  console.log('Bill Types list:', Array.from(billTypes));

} catch (error) {
  console.error('Error during inspection:', error);
}
