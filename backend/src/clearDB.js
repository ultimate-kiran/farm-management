const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to:', process.env.MONGODB_URI);

    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

clearData();