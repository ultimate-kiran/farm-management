const express = require('express');
const router = express.Router();
const MatingRecord = require('../models/MatingRecord');
const Goat = require('../models/Goat');

function generateMatingId() {
  return 'MT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const records = await MatingRecord.find(query).sort({ mating_date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const mating_id = generateMatingId();
    const expected_kidding_date = new Date(req.body.mating_date);
    expected_kidding_date.setDate(expected_kidding_date.getDate() + 150);
    const record = new MatingRecord({
      ...req.body,
      mating_id,
      expected_kidding_date
    });
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existingRecord = await MatingRecord.findOne({ mating_id: req.params.id });
    if (!existingRecord) return res.status(404).json({ message: 'Record not found' });

    if (req.body.status === 'pregnant') {
      const matingDate = new Date(existingRecord.mating_date);
      const today = new Date();
      matingDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = today - matingDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 100) {
        return res.status(400).json({ 
          message: `Pregnancy cannot be confirmed until 100 days have passed since the mating date. (Only ${diffDays} days have passed)` 
        });
      }
    }

    const record = await MatingRecord.findOneAndUpdate(
      { mating_id: req.params.id },
      req.body,
      { new: true }
    );

    if (req.body.status === 'pregnant') {
      await Goat.findOneAndUpdate(
        { goat_id: record.female_goat_id },
        { status: 'pregnant' }
      );
    } else if (req.body.status === 'delivered') {
      await Goat.findOneAndUpdate(
        { goat_id: record.female_goat_id },
        { status: 'active' }
      );
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await MatingRecord.findOneAndDelete({ mating_id: req.params.id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;