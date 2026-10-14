import 'dotenv/config';
import mongoose from 'mongoose';
import Vehicle from './models/Vehicle.js';
import Driver from './models/Driver.js';
import Assignment from './models/Assignment.js';
import Rental from './models/Rental.js';
import Breakdown from './models/Breakdown.js';
import { startOfWeekUTC } from './utils/dates.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zenflo');
await Promise.all([Vehicle, Driver, Assignment, Rental, Breakdown].map((m) => m.deleteMany({})));
await Promise.all([Vehicle, Driver, Assignment, Rental, Breakdown].map((m) => m.init()));

const vehicles = await Vehicle.insertMany(
  [
    ['KA01AB1001', 'Euler HiLoad EV', 12.4],
    ['KA01AB1002', 'Euler HiLoad EV', 12.4],
    ['KA01AB1003', 'Mahindra Treo Zor', 7.37],
    ['KA01AB1004', 'Mahindra Treo Zor', 7.37],
    ['KA01AB1005', 'Piaggio Ape E-Xtra', 8.0],
    ['KA01AB1006', 'Piaggio Ape E-Xtra', 8.0],
    ['KA01AB1007', 'Euler HiLoad EV', 12.4],
    ['KA01AB1008', 'Mahindra Treo Zor', 7.37],
    ['KA01AB1009', 'Piaggio Ape E-Xtra', 8.0],
    ['KA01AB1010', 'Euler HiLoad EV', 12.4],
  ].map(([registrationNumber, model, batteryCapacityKwh]) => ({ registrationNumber, model, batteryCapacityKwh }))
);

const drivers = await Driver.insertMany(
  [
    ['Ramesh Kumar', '9876543210', 'KA0120210012345'],
    ['Suresh Gowda', '9876543211', 'KA0120200023456'],
    ['Mahesh Reddy', '9876543212', 'KA0120190034567'],
    ['Imran Sheikh', '9876543213', 'KA0120220045678'],
    ['Ganesh Naik', '9876543214', 'KA0120180056789'],
    ['Venkatesh Rao', '9876543215', 'KA0120210067890'],
    ['Anil Shetty', '9876543216', 'KA0120230078901'],
    ['Prakash Hegde', '9876543217', 'KA0120200089012'],
  ].map(([name, phone, licenseNumber]) => ({ name, phone, licenseNumber }))
);

// Vehicles 0-4 are assigned to drivers 0-4. Drivers 5-7 are free.
await Assignment.insertMany(
  [0, 1, 2, 3, 4].map((i) => ({ vehicle: vehicles[i]._id, driver: drivers[i]._id, startDate: new Date(Date.now() - 30 * 864e5) }))
);
await Vehicle.updateMany({ _id: { $in: [0, 1, 2, 3, 4].map((i) => vehicles[i]._id) } }, { status: 'Assigned' });

// Two vehicles in the workshop with open breakdowns (vehicles 5 and 6), one old resolved breakdown.
await Vehicle.updateMany({ _id: { $in: [vehicles[5]._id, vehicles[6]._id] } }, { status: 'Under Maintenance' });
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
await Breakdown.insertMany([
  { vehicle: vehicles[5]._id, date: daysAgo(3), issue: 'Motor controller fault, vehicle will not accelerate', vehicleStatusAfter: 'Under Maintenance', status: 'Open' },
  { vehicle: vehicles[6]._id, date: daysAgo(1), issue: 'Battery pack not charging beyond 40%', vehicleStatusAfter: 'Under Maintenance', status: 'Open' },
  { vehicle: vehicles[2]._id, driver: drivers[2]._id, date: daysAgo(12), issue: 'Rear brake cable snapped', vehicleStatusAfter: 'Available', status: 'Resolved', resolvedAt: daysAgo(12) },
]);

// Three weeks of rentals for the five assigned drivers. Older weeks mostly paid, latest mostly pending.
const thisWeek = startOfWeekUTC(new Date());
const week = (n) => new Date(thisWeek.getTime() - n * 7 * 864e5);
const rentals = [];
for (let i = 0; i < 5; i++) {
  for (let w = 0; w < 3; w++) {
    const paid = w === 2 || (w === 1 && i !== 3) || (w === 0 && i < 2);
    rentals.push({
      driver: drivers[i]._id,
      vehicle: vehicles[i]._id,
      weekStart: week(w),
      amount: 4500,
      status: paid ? 'Paid' : 'Pending',
      paidOn: paid ? daysAgo(w * 7 + 1) : null,
    });
  }
}
await Rental.insertMany(rentals);

console.log(`Seeded ${vehicles.length} vehicles, ${drivers.length} drivers, ${rentals.length} rentals`);
await mongoose.disconnect();
