const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Goat = require('./models/Goat');
const WeightRecord = require('./models/WeightRecord');

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB connected');

  const goats = await Goat.find();
  const categoryMap = {};
  goats.forEach(g => {
    categoryMap[g.goat_id] = g.category || 'Adult';
  });

  const weights = await WeightRecord.find();
  console.log(`Total weight records: ${weights.length}`);

  const kidWeights = [];
  weights.forEach(w => {
    const cat = categoryMap[w.goat_id] || 'Adult';
    if (cat === 'Kid') {
      kidWeights.push(w);
    }
  });

  console.log(`Kid weight records found: ${kidWeights.length}`);
  if (kidWeights.length > 0) {
    console.log('First 5 kid weight records:', kidWeights.slice(0, 5));
    // Let's print the goats that own these weight records
    const goatIds = [...new Set(kidWeights.map(kw => kw.goat_id))];
    const matchingGoats = await Goat.find({ goat_id: { $in: goatIds } });
    console.log('Matching kid goats in DB:', matchingGoats.map(mg => ({ goat_id: mg.goat_id, name: mg.name, category: mg.category, dob: mg.dob })));
  }

  process.exit(0);
}

check();
