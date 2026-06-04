const express = require('express');
const router = express.Router();
const KiddingRecord = require('../models/KiddingRecord');
const Goat = require('../models/Goat');
const MatingRecord = require('../models/MatingRecord');

function generateKiddingId() {
  return 'KD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function generateGoatId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `GF-${year}${month}${day}-${random}`;
}

router.get('/', async (req, res) => {
  try {
    const records = await KiddingRecord.find().sort({ kidding_date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { mother_goat_id, father_goat_id, kidding_date, kids_count, male_kids_count, female_kids_count, kids_details } = req.body;
    const kidding_id = generateKiddingId();

    const mother = await Goat.findOne({ goat_id: mother_goat_id });
    const breed = 'Local'; // Breed = "Local" (default)
    const color = mother ? mother.color : 'Unknown';

    // Parse counts to numbers robustly for fallback
    const parsedMale = parseInt(male_kids_count, 10);
    const parsedFemale = parseInt(female_kids_count, 10);
    const parsedKidsCount = parseInt(kids_count, 10);

    const hasMale = !isNaN(parsedMale);
    const hasFemale = !isNaN(parsedFemale);

    let finalKidsCount = 0;
    const kids = [];

    const createKid = async (index, gender, kidColor) => {
      const kidId = generateGoatId();
      
      // Clean mother name and kid color to generate search-friendly name: kid[index][motherName][color]
      const rawMotherName = mother && mother.name ? mother.name : mother_goat_id;
      const cleanMotherName = rawMotherName.replace(/\s+/g, '');
      const rawColor = kidColor || color || 'Mixed';
      const cleanColor = rawColor.replace(/\s+/g, '');
      const generatedName = `kid${index + 1}${cleanMotherName}${cleanColor}`;

      const kid = new Goat({
        goat_id: kidId,
        name: generatedName,
        gender: gender,
        breed: breed,
        color: rawColor,
        dob: kidding_date,
        source_type: 'born',
        category: 'Kid', // Classify initially as Kid
        father_id: father_goat_id,
        mother_id: mother_goat_id,
        status: 'active',
        health_status: 'Healthy',
        weight: 0
      });
      await kid.save();
      kids.push(kidId);
    };

    let kidIndex = 0;
    if (kids_details && Array.isArray(kids_details) && kids_details.length > 0) {
      finalKidsCount = kids_details.length;
      for (let i = 0; i < kids_details.length; i++) {
        const detail = kids_details[i];
        await createKid(kidIndex++, detail.gender || 'male', detail.color);
      }
    } else {
      // Calculate final cumulative kids count fallback
      finalKidsCount = (hasMale || hasFemale)
        ? ((hasMale ? parsedMale : 0) + (hasFemale ? parsedFemale : 0))
        : (!isNaN(parsedKidsCount) ? parsedKidsCount : 0);

      if (hasMale || hasFemale) {
        const maleCount = hasMale ? parsedMale : 0;
        const femaleCount = hasFemale ? parsedFemale : 0;

        // Generate specified number of male kids
        for (let i = 0; i < maleCount; i++) {
          await createKid(kidIndex++, 'male');
        }
        // Generate specified number of female kids
        for (let i = 0; i < femaleCount; i++) {
          await createKid(kidIndex++, 'female');
        }
      } else {
        // Fallback to legacy behavior (random gender generation)
        const count = !isNaN(parsedKidsCount) ? parsedKidsCount : 0;
        for (let i = 0; i < count; i++) {
          const gender = Math.random() > 0.5 ? 'male' : 'female';
          await createKid(kidIndex++, gender);
        }
      }
    }

    const record = new KiddingRecord({
      kidding_id,
      mother_goat_id,
      father_goat_id,
      kidding_date,
      kids_count: finalKidsCount,
      kids
    });
    await record.save();

    await Goat.findOneAndUpdate(
      { goat_id: mother_goat_id },
      { status: 'active' }
    );

    await MatingRecord.findOneAndUpdate(
      { female_goat_id: mother_goat_id, status: 'pregnant' },
      { status: 'delivered' }
    );

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;