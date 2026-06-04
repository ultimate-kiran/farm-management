const XLSX = require('xlsx');

const workbook = XLSX.readFile('../LSC GOAT DATA.xlsx');

// Read all sheets and check for goat-related keywords
console.log('Searching for goat data...\n');

for (let i = 0; i < workbook.SheetNames.length; i++) {
  const sheetName = workbook.SheetNames[i];
  const sheet = workbook.Sheets[sheetName];

  // Read with header:1 to get raw data
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (!data || data.length === 0) continue;

  // Check first few rows for any meaningful content
  const firstRows = data.slice(0, 15);
  const flatRows = firstRows.flat().map(String).join(' ').toLowerCase();

  if (flatRows.includes('goat') || flatRows.includes('id') || flatRows.includes('name') || flatRows.includes('male') || flatRows.includes('female')) {
    console.log(`\n=== ${sheetName} ===`);
    console.log('First 10 rows:');
    data.slice(0, 10).forEach((row, idx) => {
      console.log(`Row ${idx}:`, row.join(', '));
    });
  }
}