import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

// Set a fixed seed for reproducible synthetic dataset generation
faker.seed(2026);

const salesOffices = [
  'B2B',
  'B2C',
  'Modern Trade',
  'Alex Office',
  'Dist. Office',
  'LG Office',
  'E-Commerce',
  'Horeca Team',
  'Apex HQ',
  'Digital Marketing'
];

const segments = [
  'Key Accounts',
  'Wholesale',
  'HORECA',
  'Modern Retail',
  'Export',
  'Distributors',
  'Direct B2C'
];

const itemGroups = [
  'Beverages & Juices',
  'Confectionery & Sweets',
  'Snack Foods',
  'Dairy & Spreads',
  'Pantry Essentials'
];

const billTypes = [
  'Invoice',
  'Invoice',
  'Invoice',
  'Invoice',
  'Sales Invoice',
  'Sales Invoice',
  'Return',
  'Credit Note'
];

const uoms = ['Cartons', 'Units', 'Boxes', 'Pallets'];

// Generate 50 realistic products with category groupings
const productCatalog = Array.from({ length: 46 }, () => {
  const group = faker.helpers.arrayElement(itemGroups);
  return {
    name: `${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
    code: 'PRD-' + faker.string.numeric(5),
    group,
    basePrice: parseFloat(faker.commerce.price({ min: 120, max: 3200, dec: 2 })),
  };
});

productCatalog.push(
  { name: 'Sweet & Slim Stevia', code: 'VS-001', group: 'Pantry Essentials', basePrice: 150 },
  { name: 'Sweet & Slim Mints', code: 'VS-002', group: 'Confectionery & Sweets', basePrice: 45 },
  { name: 'Zero-Cal Flavored Syrup', code: 'VS-003', group: 'Beverages & Juices', basePrice: 120 },
  { name: 'Sweet & Slim Tabletop', code: 'VS-004', group: 'Pantry Essentials', basePrice: 90 }
);

// Generate 150 realistic corporate customer accounts
const customerCatalog = Array.from({ length: 150 }, () => ({
  name: faker.company.name(),
  code: 'CUST-' + faker.string.numeric(6),
  segment: faker.helpers.arrayElement(segments),
}));

// Generate Sales Reps using faker
const salesReps = Array.from({ length: 30 }, () => faker.person.fullName());

function generateSyntheticTransactions(count = 6500) {
  const records = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2026-08-01');

  for (let i = 0; i < count; i++) {
    const dateObj = faker.date.between({ from: startDate, to: endDate });
    const dateStr = dateObj.toISOString().split('T')[0];
    const customer = faker.helpers.arrayElement(customerCatalog);
    const product = faker.helpers.arrayElement(productCatalog);
    const billType = faker.helpers.arrayElement(billTypes);
    const isReturn = billType === 'Return' || billType === 'Credit Note';

    const qty = faker.number.int({ min: 10, max: 1800 });
    const unitPrice = product.basePrice;
    const grossRevenue = qty * unitPrice;
    const finalRevenue = isReturn ? -grossRevenue : grossRevenue;
    const netQty = isReturn ? -qty : qty;

    records.push({
      Date: dateStr,
      CustomerName: customer.name,
      CustomerCode: customer.code,
      Segment: customer.segment,
      ItemName: product.name,
      MaterialCode: product.code,
      Quantity: qty,
      NetQuantity: netQty,
      BillType: billType,
      SalesmanName: faker.helpers.arrayElement(salesReps),
      ItemGroup: product.group,
      SalesOffice: faker.helpers.arrayElement(salesOffices),
      Revenue: Math.round(finalRevenue),
      UoM: faker.helpers.arrayElement(uoms),
    });
  }

  // Sort by date ascending
  records.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

  return records;
}

function compressDataset(records) {
  const dates = [];
  const customers = [];
  const customerCodes = [];
  const products = [];
  const materialCodes = [];
  const segmentsList = [];
  const salesmenList = [];
  const itemGroupsList = [];
  const officesList = [];
  const billTypesList = [];
  const uomsList = [];

  const getIdx = (arr, val) => {
    let idx = arr.indexOf(val);
    if (idx === -1) {
      arr.push(val);
      idx = arr.length - 1;
    }
    return idx;
  };

  const data = records.map((r) => [
    getIdx(dates, r.Date),
    getIdx(customers, r.CustomerName),
    getIdx(customerCodes, r.CustomerCode || ''),
    getIdx(products, r.ItemName),
    getIdx(materialCodes, r.MaterialCode || ''),
    getIdx(segmentsList, r.Segment),
    getIdx(salesmenList, r.SalesmanName || ''),
    getIdx(itemGroupsList, r.ItemGroup),
    getIdx(officesList, r.SalesOffice || ''),
    getIdx(billTypesList, r.BillType),
    getIdx(uomsList, r.UoM || 'Units'),
    r.Quantity,
    r.Revenue,
  ]);

  return {
    dates,
    customers,
    customerCodes,
    products,
    materialCodes,
    segments: segmentsList,
    salesmen: salesmenList,
    itemGroups: itemGroupsList,
    offices: officesList,
    billTypes: billTypesList,
    uoms: uomsList,
    data,
  };
}

const fakeDataset = generateSyntheticTransactions(6500);
const compressedData = compressDataset(fakeDataset);

// Save to data-source/data.json
const dataSourceDir = path.join(process.cwd(), 'data-source');
if (!fs.existsSync(dataSourceDir)) {
  fs.mkdirSync(dataSourceDir);
}
const publicDataPath = path.join(dataSourceDir, 'data.json');
fs.writeFileSync(publicDataPath, JSON.stringify(fakeDataset, null, 2));

// Save to data-source/sales_data.json
const srcSalesDataPath = path.join(dataSourceDir, 'sales_data.json');
fs.writeFileSync(srcSalesDataPath, JSON.stringify(fakeDataset));

// Save to public/sales_data_v2.json
const compressedPath = path.join(process.cwd(), 'public', 'sales_data_v2.json');
fs.writeFileSync(compressedPath, JSON.stringify(compressedData));

console.log(`✅ All anonymized synthetic datasets generated successfully! (${fakeDataset.length} rows written across all data targets)`);
