const express = require('express');
const router = express.Router();
const TreatmentRecord = require('../models/TreatmentRecord');

function generateTreatmentId() {
  return 'TR-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

router.get('/:goatId', async (req, res) => {
  try {
    const records = await TreatmentRecord.find({ goat_id: req.params.goatId }).sort({ treatment_date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const records = await TreatmentRecord.find().sort({ treatment_date: -1 }).limit(100);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const treatment_id = generateTreatmentId();
    const record = new TreatmentRecord({ ...req.body, treatment_id });
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await TreatmentRecord.findOneAndDelete({ treatment_id: req.params.id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;