const mongoose = require('mongoose');

const matingSchema = new mongoose.Schema({
  mating_id: { type: String, unique: true },
  male_goat_id: { type: String, required: true },
  female_goat_id: { type: String, required: true },
  mating_date: { type: Date, required: true },
  expected_kidding_date: { type: Date },
  actual_kidding_date: { type: Date },
  status: { type: String, enum: ['pending', 'pregnant', 'delivered', 'failed'], default: 'pending' }
});

module.exports = mongoose.model('MatingRecord', matingSchema);