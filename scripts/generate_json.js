import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const excelPath = 'C:\\Users\\maiar pc\\Documents\\data\\Sales Report From 2022 - Mayar.xlsx';
const outputPath = path.resolve('public/sales_data_compressed.json');

function excelDateToJSDate(serial) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  const y = date_info.getFullYear();
  const m = String(date_info.getMonth() + 1).padStart(2, '0');
  const d = String(date_info.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const getVal = (row, defaultVal, ...keys) => {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const target = k.trim().toLowerCase();
    const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === target);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
      return String(row[foundKey]).trim();
    }
  }
  return defaultVal;
};

try {
  console.log('Loading workbook from:', excelPath);
  const workbook = xlsx.readFile(excelPath);
  const worksheet = workbook.Sheets['Master'] || workbook.Sheets[workbook.SheetNames[0]];
  console.log('Workbook loaded. Converting sheet to JSON...');
  const rawRows = xlsx.utils.sheet_to_json(worksheet);
  console.log('Total raw rows:', rawRows.length);

  // Lists for mapping dictionaries
  const dates = new Set();
  const customers = new Set();
  const customerCodes = new Set();
  const products = new Set();
  const materialCodes = new Set();
  const segments = new Set();
  const salesmen = new Set();
  const itemGroups = new Set();
  const offices = new Set();
  const billTypes = new Set();
  const uoms = new Set();

  console.log('Analyzing dimensions including Material Codes, Customer Codes, and UoMs...');
  for (const row of rawRows) {
    let dateStr = '2022-01-01';
    if (typeof row['Bill. Date'] === 'number') {
      dateStr = excelDateToJSDate(row['Bill. Date']);
    } else if (row['Bill. Date']) {
      dateStr = String(row['Bill. Date']).split('T')[0];
    }
    
    dates.add(dateStr);
    customers.add(getVal(row, 'Unknown', 'Customer Name', 'CustomerName', 'Cust Name'));
    customerCodes.add(getVal(row, 'N/A', 'Customer Code', 'CustomerCode', 'Cust Code'));
    products.add(getVal(row, 'Unknown', 'Material Desc', 'Material Description', 'Product'));
    materialCodes.add(getVal(row, 'N/A', 'Material Code', 'MaterialCode', 'Item Code'));
    segments.add(getVal(row, 'Unknown', 'Company', 'Segment'));
    salesmen.add(getVal(row, 'Unknown', 'Salesman Name', 'SalesmanName', 'Rep'));
    itemGroups.add(getVal(row, 'Unknown', 'Item Group', 'ItemGroup'));
    offices.add(getVal(row, 'Unknown', 'Sales Office', 'SalesOffice'));
    billTypes.add(getVal(row, 'Invoice', 'Bill Type', 'BillType'));
    uoms.add(getVal(row, 'Units', 'UOM', 'UoM', 'Base UoM', 'Base Unit of Measure', 'Unit'));
  }

  // Convert to sorted arrays for stable indices
  const datesArr = Array.from(dates).sort();
  const customersArr = Array.from(customers).sort();
  const customerCodesArr = Array.from(customerCodes).sort();
  const productsArr = Array.from(products).sort();
  const materialCodesArr = Array.from(materialCodes).sort();
  const segmentsArr = Array.from(segments).sort();
  const salesmenArr = Array.from(salesmen).sort();
  const itemGroupsArr = Array.from(itemGroups).sort();
  const officesArr = Array.from(offices).sort();
  const billTypesArr = Array.from(billTypes).sort();
  const uomsArr = Array.from(uoms).sort();

  // Create lookup maps for performance
  const makeMap = arr => new Map(arr.map((val, idx) => [val, idx]));
  const dateMap = makeMap(datesArr);
  const customerMap = makeMap(customersArr);
  const customerCodeMap = makeMap(customerCodesArr);
  const productMap = makeMap(productsArr);
  const materialCodeMap = makeMap(materialCodesArr);
  const segmentMap = makeMap(segmentsArr);
  const salesmanMap = makeMap(salesmenArr);
  const itemGroupMap = makeMap(itemGroupsArr);
  const officeMap = makeMap(officesArr);
  const billTypeMap = makeMap(billTypesArr);
  const uomMap = makeMap(uomsArr);

  console.log('Aggregating rows daily and compressing with full metadata...');
  const aggregated = {};

  for (const row of rawRows) {
    let dateStr = '2022-01-01';
    if (typeof row['Bill. Date'] === 'number') {
      dateStr = excelDateToJSDate(row['Bill. Date']);
    } else if (row['Bill. Date']) {
      dateStr = String(row['Bill. Date']).split('T')[0];
    }

    const customer = getVal(row, 'Unknown', 'Customer Name', 'CustomerName', 'Cust Name');
    const customerCode = getVal(row, 'N/A', 'Customer Code', 'CustomerCode', 'Cust Code');
    const segment = getVal(row, 'Unknown', 'Company', 'Segment');
    const product = getVal(row, 'Unknown', 'Material Desc', 'Material Description', 'Product');
    const materialCode = getVal(row, 'N/A', 'Material Code', 'MaterialCode', 'Item Code');
    const salesman = getVal(row, 'Unknown', 'Salesman Name', 'SalesmanName', 'Rep');
    const itemGroup = getVal(row, 'Unknown', 'Item Group', 'ItemGroup');
    const office = getVal(row, 'Unknown', 'Sales Office', 'SalesOffice');
    const billType = getVal(row, 'Invoice', 'Bill Type', 'BillType');
    const uom = getVal(row, 'Units', 'UOM', 'UoM', 'Base UoM', 'Base Unit of Measure', 'Unit');

    const qty = parseFloat(row[' Qty '] || row['Qty']) || 0;
    const price = parseFloat(row[' Net Sales Price '] || row['Net Sales Price']) || 0;

    const dIdx = dateMap.get(dateStr);
    const cIdx = customerMap.get(customer);
    const ccIdx = customerCodeMap.get(customerCode);
    const pIdx = productMap.get(product);
    const mcIdx = materialCodeMap.get(materialCode);
    const sIdx = segmentMap.get(segment);
    const rIdx = salesmanMap.get(salesman);
    const gIdx = itemGroupMap.get(itemGroup);
    const oIdx = officeMap.get(office);
    const bIdx = billTypeMap.get(billType);
    const uIdx = uomMap.get(uom);

    const aggKey = `${dIdx},${cIdx},${ccIdx},${pIdx},${mcIdx},${sIdx},${rIdx},${gIdx},${oIdx},${bIdx},${uIdx}`;

    if (!aggregated[aggKey]) {
      aggregated[aggKey] = [
        dIdx,
        cIdx,
        ccIdx,
        pIdx,
        mcIdx,
        sIdx,
        rIdx,
        gIdx,
        oIdx,
        bIdx,
        uIdx,
        0, // Quantity sum
        0  // Net sales sum
      ];
    }

    aggregated[aggKey][11] += qty;
    aggregated[aggKey][12] += price;
  }

  const dataRows = Object.values(aggregated);
  console.log('Aggregated and compressed to:', dataRows.length, 'rows');

  const payload = {
    dates: datesArr,
    customers: customersArr,
    customerCodes: customerCodesArr,
    products: productsArr,
    materialCodes: materialCodesArr,
    segments: segmentsArr,
    salesmen: salesmenArr,
    itemGroups: itemGroupsArr,
    offices: officesArr,
    billTypes: billTypesArr,
    uoms: uomsArr,
    data: dataRows
  };

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('Writing JSON payload to:', outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(payload));
  
  const stats = fs.statSync(outputPath);
  const fileSizeInBytes = stats.size;
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
  console.log('Done! Output file size:', fileSizeInMegabytes.toFixed(2), 'MB');

} catch (error) {
  console.error('Error generating JSON database:', error);
}
