const express = require('express');
const router = express.Router();
const WeightRecord = require('../models/WeightRecord');

function generateWeightId() {
  return 'WT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

router.get('/:goatId', async (req, res) => {
  try {
    const records = await WeightRecord.find({ goat_id: req.params.goatId }).sort({ recorded_date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const records = await WeightRecord.find().sort({ recorded_date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const savedRecords = [];
      for (const item of req.body) {
        const weight_id = generateWeightId();
        const record = new WeightRecord({ ...item, weight_id });
        await record.save();
        savedRecords.push(record);
      }
      res.status(201).json(savedRecords);
    } else {
      const weight_id = generateWeightId();
      const record = new WeightRecord({ ...req.body, weight_id });
      await record.save();
      res.status(201).json(record);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await WeightRecord.findOneAndDelete({ weight_id: req.params.id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await WeightRecord.findOneAndUpdate(
      { weight_id: req.params.id },
      req.body,
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;