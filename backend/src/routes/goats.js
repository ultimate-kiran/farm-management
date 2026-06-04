const express = require('express');
const router = express.Router();
const Goat = require('../models/Goat');
const KiddingRecord = require('../models/KiddingRecord');
const MatingRecord = require('../models/MatingRecord');

function generateGoatId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `GF-${year}${month}${day}-${random}`;
}

// Helper to calculate mating eligibility for female goats
async function calculateMatingEligibility(goat) {
  if (goat.gender !== 'female') {
    return { status: 'N/A', reason: 'Not a female goat' };
  }
  if (goat.category === 'Kid') {
    return { status: 'Not Eligible', reason: 'Goat is still a Kid' };
  }
  if (goat.status === 'pregnant') {
    return { status: 'Not Eligible', reason: 'Goat is currently pregnant' };
  }
  if (goat.status === 'sold' || goat.status === 'deceased') {
    return { status: 'Not Eligible', reason: 'Goat is not active' };
  }

  // Check if there is an active mating run (pending or pregnant)
  const activeMating = await MatingRecord.findOne({
    female_goat_id: goat.goat_id,
    status: { $in: ['pending', 'pregnant'] }
  });

  if (activeMating) {
    return {
      status: 'Not Eligible',
      reason: activeMating.status === 'pregnant' ? 'Goat is currently pregnant' : 'Goat has a pending mating check'
    };
  }

  // Find the latest kidding record where she was the mother
  const latestKidding = await KiddingRecord.findOne({ mother_goat_id: goat.goat_id })
    .sort({ kidding_date: -1 });

  if (!latestKidding) {
    return { status: 'Eligible', reason: 'No recent deliveries' };
  }

  const deliveryDate = new Date(latestKidding.kidding_date);
  const recoveryUntil = new Date(deliveryDate);
  recoveryUntil.setMonth(recoveryUntil.getMonth() + 2); // 2 months recovery period

  const today = new Date();
  if (today < recoveryUntil) {
    return {
      status: 'Not Eligible',
      reason: `Recovering until ${recoveryUntil.toISOString().split('T')[0]}`,
      recoveryUntil: recoveryUntil
    };
  }

  return { status: 'Eligible', reason: 'Recovery period completed' };
}

// Get all goats (with filters and mating eligibility)
router.get('/', async (req, res) => {
  try {
    const { gender, breed, status, source_type, category, search } = req.query;
    let query = {};
    if (gender) query.gender = gender;
    if (breed) query.breed = breed;
    if (status) query.status = status;
    if (source_type) query.source_type = source_type;
    if (category) {
      if (category === 'Adult') {
        query.category = { $ne: 'Kid' }; // Matches 'Adult' and any goats imported before category field was added
      } else {
        query.category = category;
      }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { goat_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    const goats = await Goat.find(query).sort({ created_at: -1 });
    
    // Append mating eligibility and resolve parent names
    const goatsWithEligibility = await Promise.all(goats.map(async (g) => {
      const goatObj = g.toObject();
      goatObj.mating_eligibility = await calculateMatingEligibility(g);

      if (goatObj.mother_id) {
        const motherGoat = await Goat.findOne({ goat_id: goatObj.mother_id });
        goatObj.mother_name = motherGoat ? motherGoat.name : null;
      } else {
        goatObj.mother_name = null;
      }

      if (goatObj.father_id) {
        const fatherGoat = await Goat.findOne({ goat_id: goatObj.father_id });
        goatObj.father_name = fatherGoat ? fatherGoat.name : null;
      } else {
        goatObj.father_name = null;
      }

      return goatObj;
    }));
    
    res.json(goatsWithEligibility);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Promote a kid to adult
router.post('/promote/:id', async (req, res) => {
  try {
    const { name, goat_id: newGoatId } = req.body;
    const oldGoatId = req.params.id;

    if (!name || !newGoatId) {
      return res.status(400).json({ message: 'Name and new Tag Number (Goat ID) are required for promotion.' });
    }

    // Check if new tag exists
    if (newGoatId !== oldGoatId) {
      const existing = await Goat.findOne({ goat_id: newGoatId });
      if (existing) {
        return res.status(400).json({ message: `Goat with Tag Number "${newGoatId}" already exists.` });
      }
    }

    const goat = await Goat.findOne({ goat_id: oldGoatId });
    if (!goat) {
      return res.status(404).json({ message: 'Kid not found.' });
    }

    if (goat.category !== 'Kid') {
      return res.status(400).json({ message: 'Goat is already an Adult.' });
    }

    if (goat.status === 'deceased' || goat.status === 'sold') {
      return res.status(400).json({ message: 'Cannot promote a deceased or sold animal.' });
    }

    if (goat.dob) {
      const dob = new Date(goat.dob);
      const today = new Date();
      const diffTime = Math.abs(today - dob);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const ageMonths = diffDays / 30.43;
      if (ageMonths < 3.0) {
        return res.status(400).json({ message: 'Kids under 3 months cannot be promoted to Adult.' });
      }
    }

    // Update details
    goat.name = name;
    goat.goat_id = newGoatId;
    goat.category = 'Adult';
    goat.updated_at = Date.now();
    await goat.save();

    // If ID changed, update all histories!
    if (newGoatId !== oldGoatId) {
      const WeightRecord = require('../models/WeightRecord');
      const TreatmentRecord = require('../models/TreatmentRecord');
      const MatingRecord = require('../models/MatingRecord');

      await WeightRecord.updateMany({ goat_id: oldGoatId }, { goat_id: newGoatId });
      await TreatmentRecord.updateMany({ goat_id: oldGoatId }, { goat_id: newGoatId });
      await KiddingRecord.updateMany({ mother_goat_id: oldGoatId }, { mother_goat_id: newGoatId });
      await KiddingRecord.updateMany({ father_goat_id: oldGoatId }, { father_goat_id: newGoatId });
      
      // Update elements in kids array
      await KiddingRecord.updateMany(
        { kids: oldGoatId },
        { $set: { "kids.$": newGoatId } }
      );

      await MatingRecord.updateMany({ male_goat_id: oldGoatId }, { male_goat_id: newGoatId });
      await MatingRecord.updateMany({ female_goat_id: oldGoatId }, { female_goat_id: newGoatId });
      await Goat.updateMany({ mother_id: oldGoatId }, { mother_id: newGoatId });
      await Goat.updateMany({ father_id: oldGoatId }, { father_id: newGoatId });
    }

    res.json({ message: 'Goat successfully promoted to Adult', goat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single goat details
router.get('/:id', async (req, res) => {
  try {
    const goat = await Goat.findOne({ goat_id: req.params.id });
    if (!goat) return res.status(404).json({ message: 'Goat not found' });
    const goatObj = goat.toObject();
    goatObj.mating_eligibility = await calculateMatingEligibility(goat);

    if (goatObj.mother_id) {
      const motherGoat = await Goat.findOne({ goat_id: goatObj.mother_id });
      goatObj.mother_name = motherGoat ? motherGoat.name : null;
    } else {
      goatObj.mother_name = null;
    }

    if (goatObj.father_id) {
      const fatherGoat = await Goat.findOne({ goat_id: goatObj.father_id });
      goatObj.father_name = fatherGoat ? fatherGoat.name : null;
    } else {
      goatObj.father_name = null;
    }

    res.json(goatObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new goat
router.post('/', async (req, res) => {
  try {
    const goat_id = req.body.goat_id || generateGoatId();
    const goat = new Goat({ ...req.body, goat_id });
    await goat.save();
    res.status(201).json(goat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update goat
router.put('/:id', async (req, res) => {
  try {
    const goat = await Goat.findOneAndUpdate(
      { goat_id: req.params.id },
      { ...req.body, updated_at: Date.now() },
      { new: true }
    );
    if (!goat) return res.status(404).json({ message: 'Goat not found' });
    res.json(goat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete goat
router.delete('/:id', async (req, res) => {
  try {
    const goat = await Goat.findOneAndDelete({ goat_id: req.params.id });
    if (!goat) return res.status(404).json({ message: 'Goat not found' });
    res.json({ message: 'Goat deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;