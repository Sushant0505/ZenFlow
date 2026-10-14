import Vehicle from '../models/Vehicle.js';
import Rental from '../models/Rental.js';
import Breakdown from '../models/Breakdown.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const [statusCounts, pending, openBreakdowns] = await Promise.all([
    Vehicle.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Rental.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Breakdown.countDocuments({ status: 'Open' }),
  ]);
  const count = (s) => statusCounts.find((c) => c._id === s)?.count ?? 0;
  res.json({
    totalVehicles: statusCounts.reduce((n, c) => n + c.count, 0),
    available: count('Available'),
    assigned: count('Assigned'),
    underMaintenance: count('Under Maintenance'),
    outstandingAmount: pending[0]?.amount ?? 0,
    pendingPayments: pending[0]?.count ?? 0,
    openBreakdowns,
  });
});
