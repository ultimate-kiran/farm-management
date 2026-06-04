const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  treatment_id: {
    type: String,
    unique: true
  },

  goat_id: {
    type: String,
    required: true
  },

  treatment_date: {
    type: Date,
    default: Date.now
  },

  problem: {
    type: String,
    required: true
  },

  notes: {
    type: String,
    default: ''
  },

  treated_by: {
    type: String,
    default: ''
  },

  next_checkup: {
    type: Date,
    default: null
  },

  medicines: [
    {
      medicine_name: {
        type: String,
        trim: true,
        default: ''
      },

      dosage: {
        type: String,
        trim: true,
        default: ''
      },

      type: {
        type: String,
        default: 'tablet'
      },

      instructions: {
        type: String,
        trim: true,
        default: ''
      },

      duration: {
        type: String,
        trim: true,
        default: ''
      }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model(
  'TreatmentRecord',
  treatmentSchema
);