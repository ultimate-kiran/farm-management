const express = require('express');
const router = express.Router();
const Goat = require('../models/Goat');
const WeightRecord = require('../models/WeightRecord');
const TreatmentRecord = require('../models/TreatmentRecord');
const KiddingRecord = require('../models/KiddingRecord');

router.get('/dashboard', async (req, res) => {
  try {
    const totalGoats = await Goat.countDocuments({ status: { $nin: ['sold', 'deceased'] } });
    const maleGoats = await Goat.countDocuments({ gender: 'male', status: { $nin: ['sold', 'deceased'] } });
    const femaleGoats = await Goat.countDocuments({ gender: 'female', status: { $nin: ['sold', 'deceased'] } });
    const pregnantGoats = await Goat.countDocuments({ status: 'pregnant' });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const kidsThisMonth = await Goat.countDocuments({
      source_type: 'born',
      created_at: { $gte: startOfMonth }
    });

    const weights = await WeightRecord.find();
    const avgWeight = weights.length > 0
      ? (weights.reduce((sum, w) => sum + w.weight, 0) / weights.length).toFixed(2)
      : 0;

    res.json({
      totalGoats,
      maleGoats,
      femaleGoats,
      pregnantGoats,
      kidsThisMonth,
      avgWeight
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/weight-chart', async (req, res) => {
  try {
    const { category } = req.query;

    // Map goat_id to category for quick lookup
    const goats = await Goat.find();
    const categoryMap = {};
    goats.forEach(g => {
      let cat = g.category || 'Adult';
      
      // Dynamic age verification: kids older than 3 months are strictly classified as Adults
      if (g.dob) {
        const dob = new Date(g.dob);
        const today = new Date();
        const diffDays = Math.ceil(Math.abs(today - dob) / (1000 * 60 * 60 * 24));
        const ageMonths = diffDays / 30.43;
        if (ageMonths >= 3.0) {
          cat = 'Adult';
        }
      }
      
      categoryMap[g.goat_id] = cat;
    });

    const weights = await WeightRecord.find().sort({ recorded_date: 1 });
    const monthlyData = {};

    weights.forEach(w => {
      const goatCategory = categoryMap[w.goat_id] || 'Adult';
      
      // Filter by category if requested
      if (category && goatCategory !== category) {
        return;
      }

      const date = new Date(w.recorded_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { total: 0, count: 0 };
      monthlyData[key].total += w.weight;
      monthlyData[key].count += 1;
    });

    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      avgWeight: (data.total / data.count).toFixed(2)
    }));

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/population-growth', async (req, res) => {
  try {
    const goats = await Goat.find().sort({ created_at: 1 });
    const monthlyData = {};

    goats.forEach(g => {
      const date = new Date(g.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    let cumulative = 0;
    const chartData = Object.entries(monthlyData).map(([month, count]) => {
      cumulative += count;
      return { month, count: cumulative };
    });

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/gender-ratio', async (req, res) => {
  try {
    const male = await Goat.countDocuments({ gender: 'male', status: { $nin: ['sold', 'deceased'] } });
    const female = await Goat.countDocuments({ gender: 'female', status: { $nin: ['sold', 'deceased'] } });
    res.json([{ name: 'Male', value: male }, { name: 'Female', value: female }]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/birth-rate', async (req, res) => {
  try {
    const kidding = await KiddingRecord.find().sort({ kidding_date: 1 });
    const monthlyData = {};

    kidding.forEach(k => {
      const date = new Date(k.kidding_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = 0;
      monthlyData[key] += k.kids_count;
    });

    const chartData = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/treatment-frequency', async (req, res) => {
  try {
    const treatments = await TreatmentRecord.find();
    const problemCount = {};

    treatments.forEach(t => {
      const problem = t.problem || 'Unknown';
      problemCount[problem] = (problemCount[problem] || 0) + 1;
    });

    const chartData = Object.entries(problemCount)
      .map(([problem, count]) => ({ problem, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/breed-distribution', async (req, res) => {
  try {
    const goats = await Goat.find({ status: { $nin: ['sold', 'deceased'] } });
    const breedCount = {};

    goats.forEach(g => {
      const breed = g.breed || 'Unknown';
      breedCount[breed] = (breedCount[breed] || 0) + 1;
    });

    const chartData = Object.entries(breedCount).map(([breed, count]) => ({ breed, count }));
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const pregnantGoats = await Goat.find({ status: 'pregnant' });
    const expectedKidding = [];

    for (const goat of pregnantGoats) {
      const mating = await import('../models/MatingRecord.js').then(m => m.default.findOne({
        female_goat_id: goat.goat_id,
        status: 'pregnant'
      }).sort({ expected_kidding_date: -1 }).limit(1));

      if (mating && new Date(mating.expected_kidding_date) <= thirtyDaysLater) {
        expectedKidding.push({
          goat_id: goat.goat_id,
          name: goat.name,
          expected_date: mating.expected_kidding_date
        });
      }
    }

    res.json({ expectedKidding });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;