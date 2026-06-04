const mongoose = require('mongoose');

const kiddingSchema = new mongoose.Schema({
  kidding_id: { type: String, unique: true },
  mother_goat_id: { type: String, required: true },
  father_goat_id: { type: String, required: true },
  kidding_date: { type: Date, required: true },
  kids_count: { type: Number, required: true },
  kids: [{ type: String }]
});

module.exports = mongoose.model('KiddingRecord', kiddingSchema);