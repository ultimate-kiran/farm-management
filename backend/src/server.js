const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const authRoutes = require('./routes/auth');
const goatRoutes = require('./routes/goats');
const weightRoutes = require('./routes/weight');
const treatmentRoutes = require('./routes/treatments');
const matingRoutes = require('./routes/mating');
const kiddingRoutes = require('./routes/kidding');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    try {
      const Goat = require('./models/Goat');
      const result = await Goat.updateMany(
        { category: { $exists: false } },
        { category: 'Adult' }
      );
      if (result.modifiedCount > 0) {
        console.log(`Successfully migrated ${result.modifiedCount} legacy goats to 'Adult' category.`);
      }
    } catch (err) {
      console.error('Legacy goats migration failed:', err);
    }
  })
  .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/goats', goatRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/mating', matingRoutes);
app.use('/api/kidding', kiddingRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));