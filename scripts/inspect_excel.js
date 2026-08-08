import xlsx from 'xlsx';

const filePath = 'C:\\Users\\maiar pc\\Documents\\data\\Sales Report From 2022 - Mayar.xlsx';

try {
  console.log('Loading full workbook...');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.Sheets['Master'] ? 'Master' : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  console.log('Total rows:', data.length);
  
  const getVal = (row, ...keys) => {
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const target = k.trim().toLowerCase();
      const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === target);
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
        return String(row[foundKey]).trim();
      }
    }
    return 'MISSING';
  };

  let missingCc = 0;
  let missingMc = 0;
  let missingUom = 0;

  data.forEach((r, idx) => {
    const cc = getVal(r, 'Customer Code', 'CustomerCode', 'Cust Code');
    const mc = getVal(r, 'Material Code', 'MaterialCode', 'Item Code');
    const uom = getVal(r, 'UOM', 'UoM', 'Base UoM', 'Unit');

    if (cc === 'MISSING') missingCc++;
    if (mc === 'MISSING') missingMc++;
    if (uom === 'MISSING') missingUom++;

    if (idx < 5) {
      console.log(`Row ${idx}: Customer="${r['Customer Name']}", CustCode="${cc}", Material="${r['Material Desc']}", MatCode="${mc}", UoM="${uom}"`);
    }
  });

  console.log(`Summary of 189k rows: Missing CustCode=${missingCc}, Missing MatCode=${missingMc}, Missing UoM=${missingUom}`);
} catch (error) {
  console.error('Error reading Excel file:', error);
}
