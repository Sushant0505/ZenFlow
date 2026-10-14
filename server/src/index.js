import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import './models/Vehicle.js';
import './models/Driver.js';
import './models/Assignment.js';
import './models/Rental.js';
import './models/Breakdown.js';

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zenflo';

try {
  await mongoose.connect(URI);
  // Make sure unique / partial indexes exist before we accept traffic.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  app.listen(PORT, () => console.log(`Zenflo API running on http://localhost:${PORT}`));
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
