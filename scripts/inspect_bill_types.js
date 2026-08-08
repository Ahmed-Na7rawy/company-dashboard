import xlsx from 'xlsx';

const filePath = 'C:\\Users\\maiar pc\\Documents\\data\\Sales Report From 2022 - Copy.xlsx';

try {
  console.log('Loading workbook...');
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets['Master'];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const billTypesInfo = {};

  for (const row of data) {
    const bt = row['Bill Type'] || 'Unknown';
    const qty = parseFloat(row[' Qty '] || row['Qty']) || 0;
    const price = parseFloat(row[' Net Sales Price '] || row['Net Sales Price']) || 0;
    
    if (!billTypesInfo[bt]) {
      billTypesInfo[bt] = {
        count: 0,
        sampleRow: row,
        minQty: qty,
        maxQty: qty,
        minPrice: price,
        maxPrice: price,
        qtySum: 0,
        priceSum: 0
      };
    }
    
    const info = billTypesInfo[bt];
    info.count++;
    info.qtySum += qty;
    info.priceSum += price;
    if (qty < info.minQty) info.minQty = qty;
    if (qty > info.maxQty) info.maxQty = qty;
    if (price < info.minPrice) info.minPrice = price;
    if (price > info.maxPrice) info.maxPrice = price;
  }

  console.log('\n--- Bill Types Stats ---');
  for (const [bt, info] of Object.entries(billTypesInfo)) {
    console.log(`\nBill Type: ${bt}`);
    console.log(`  Count: ${info.count}`);
    console.log(`  Qty Sum: ${info.qtySum}, Range: [${info.minQty}, ${info.maxQty}]`);
    console.log(`  Net Sales Price Sum: ${info.priceSum}, Range: [${info.minPrice}, ${info.maxPrice}]`);
    console.log(`  Sample:`, {
      'Salesman Name': info.sampleRow['Salesman Name'],
      'Customer Name': info.sampleRow['Customer Name'],
      'Material Desc': info.sampleRow['Material Desc'],
      ' Qty ': info.sampleRow[' Qty '],
      ' Net Sales Price ': info.sampleRow[' Net Sales Price ']
    });
  }

} catch (error) {
  console.error('Error during bill type inspection:', error);
}
