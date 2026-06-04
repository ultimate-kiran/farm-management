const mongoose = require('mongoose');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
const Goat = require('./models/Goat');
const WeightRecord = require('./models/WeightRecord');
const TreatmentRecord = require('./models/TreatmentRecord');

dotenv.config();

const MONTHS = ['NOV', 'DEC', 'JAN', 'FEB', 'MARCH', 'APIRL', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT'];

function getDateFromMonth(month, rowIndex) {
  if (!month || month === '') return null;
  const monthIndex = MONTHS.indexOf(month.toString().toUpperCase().trim());
  if (monthIndex === -1) return null;

  // NOV=10, DEC=11, then JAN=0, FEB=1...
  const monthMap = { NOV: 10, DEC: 11, JAN: 0, FEB: 1, MARCH: 2, APRIL: 3, APIRL: 3, MAY: 4, JUN: 5, JULY: 6, AUG: 7, SEP: 8, OCT: 9 };
  const monthNum = monthMap[month.toUpperCase().trim()];

  // Determine year based on column position
  let year = 2025;
  if (rowIndex >= 2) year = 2026;

  return new Date(year, monthNum, 15);
}

function parseWeight(str) {
  if (!str) return null;
  const match = str.toString().match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

async function importData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB - Database: farm2\n');

    // Clear existing data
    await Goat.deleteMany({});
    await WeightRecord.deleteMany({});
    await TreatmentRecord.deleteMany({});
    console.log('Cleared existing records\n');

    const workbook = XLSX.readFile('../LSC GOAT DATA.xlsx');
    console.log(`Excel loaded: ${workbook.SheetNames.length} sheets (goats)\n`);
    console.log('Importing data...\n');

    let totalGoats = 0;
    let totalWeights = 0;
    let totalTreatments = 0;

    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (!data || data.length < 5) continue;

      const goatColor = data[1]?.[0]?.toString() || sheetName;
      const row2 = data[2] || [];
      const row3 = data[3] || [];
      const row4 = data[4] || [];
      const row7 = data[7] || [];
      const row8 = data[8] || [];

      // Generate goat ID
      const goatId = `LSC-${String(i + 1).padStart(3, '0')}`;

      // Check status
      const notes3 = row3.slice(1).join(' ').toLowerCase();
      let status = 'active';
      if (notes3.includes('sold')) status = 'sold';
      if (notes3.includes('died')) status = 'deceased';

      // Create goat
      const goat = new Goat({
        goat_id: goatId,
        name: `Goat ${i + 1} (${goatColor})`,
        gender: 'male',
        breed: 'Country',
        color: goatColor,
        dob: new Date(2024, 0, 1),
        source_type: 'born',
        status: status
      });
      await goat.save();
      totalGoats++;

      // Get months
      const months = row2.slice(1);

      // Import weights
      if (weightRow = row4) {
        for (let j = 1; j < Math.min(weightRow.length, months.length + 1); j++) {
          const weight = parseWeight(weightRow[j]);
          if (weight) {
            const month = months[j - 1];
            const date = getDateFromMonth(month, j);
            if (date) {
              const weightRecord = new WeightRecord({
                weight_id: `WT-${goatId}-${j}`,
                goat_id: goatId,
                weight: weight,
                recorded_date: date
              });
              await weightRecord.save();
              totalWeights++;
            }
          }
        }
      }

      // Import treatments/medications
      if (row7[0] === 'MEDICATION') {
        for (let j = 1; j < Math.min(row7.length, months.length + 1); j++) {
          const medValue = row7[j];
          const noteValue = row8 ? row8[j] : null;
          if (medValue && medValue.toString().trim() !== '') {
            if (medValue.toString().includes('/') || !isNaN(medValue)) {
              const treatmentRecord = new TreatmentRecord({
                treatment_id: `TR-${goatId}-${j}`,
                goat_id: goatId,
                treatment_date: getDateFromMonth(months[j - 1], j) || new Date(),
                problem: 'Medication',
                notes: noteValue ? noteValue.toString() : '',
                medicines: [],
                treated_by: ''
              });
              await treatmentRecord.save();
              totalTreatments++;
            }
          }
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${workbook.SheetNames.length} sheets processed...`);
      }
    }

    console.log('\n========================================');
    console.log('       IMPORT COMPLETE!');
    console.log('========================================');
    console.log(`Goats imported:        ${totalGoats}`);
    console.log(`Weight records:        ${totalWeights}`);
    console.log(`Treatment records:     ${totalTreatments}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

importData();