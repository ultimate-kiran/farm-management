const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema({
  weight_id: { type: String, unique: true },
  goat_id: { type: String, required: true },
  weight: { type: Number, required: true },
  recorded_date: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
});

module.exports = mongoose.model('WeightRecord', weightSchema);