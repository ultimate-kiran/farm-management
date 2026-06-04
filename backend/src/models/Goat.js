const mongoose = require('mongoose');

const goatSchema = new mongoose.Schema({
  goat_id: { type: String, unique: true },
  name: { type: String, required: false }, // Made optional for newborn kids
  gender: { type: String, enum: ['male', 'female'], required: true },
  breed: { type: String, required: true },
  color: { type: String, required: true },
  dob: { type: Date, required: true },
  source_type: { type: String, enum: ['born', 'purchased'], required: true },
  category: { type: String, enum: ['Kid', 'Adult'], default: 'Adult' }, // Kid vs Adult category
  father_id: { type: String, default: null },
  mother_id: { type: String, default: null },
  status: { type: String, enum: ['active', 'sold', 'deceased', 'pregnant'], default: 'active' },
  health_status: { type: String, default: 'Healthy' },
  weight: { type: Number, default: 0 },
  purchase_details: {
    purchase_date: Date,
    purchase_weight: Number,
    purchase_price: Number,
    seller_details: String,
    seller_name: String, // Keeping for compatibility
    purchase_cost: Number, // Keeping for compatibility
    source_farm: String,
    age_at_purchase: String,
    health_status: String
  },
  sale_details: {
    sale_date: Date,
    weight_at_sale: Number,
    sale_price: Number,
    buyer_details: String,
    profit_loss: Number,
    reason_for_sale: String
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goat', goatSchema);