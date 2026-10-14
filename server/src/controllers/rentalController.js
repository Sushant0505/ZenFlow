import Rental from '../models/Rental.js';
import Driver from '../models/Driver.js';
import Assignment from '../models/Assignment.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertObjectId, parseDate } from '../utils/validators.js';
import { startOfWeekUTC } from '../utils/dates.js';
import mongoose from 'mongoose';

export const listRentals = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.driverId) {
    assertObjectId(req.query.driverId, 'Driver');
    filter.driver = req.query.driverId;
  }
  const rentals = await Rental.find(filter)
    .sort({ weekStart: -1, createdAt: -1 })
    .populate('driver', 'name phone')
    .populate('vehicle', 'registrationNumber')
    .lean();
  res.json(rentals);
});

export const createRental = asyncHandler(async (req, res) => {
  const { driverId, weekStart, amount, status = 'Pending' } = req.body;
  assertObjectId(driverId, 'Driver');
  const week = startOfWeekUTC(parseDate(weekStart, 'Week'));

  const driver = await Driver.findById(driverId);
  if (!driver) throw new AppError('Driver not found', 404);

  const active = await Assignment.findOne({ driver: driverId, isActive: true });
  const rental = await Rental.create({
    driver: driverId,
    vehicle: active?.vehicle,
    weekStart: week,
    amount: Number(amount),
    status,
    paidOn: status === 'Paid' ? new Date() : null,
  });
  res.status(201).json({ message: `Rental recorded for ${driver.name}`, data: rental });
});

export const markRentalPaid = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Rental');
  const rental = await Rental.findOneAndUpdate(
    { _id: req.params.id, status: 'Pending' },
    { status: 'Paid', paidOn: new Date() },
    { new: true }
  );
  if (!rental) {
    const exists = await Rental.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Rental not found', 404);
    throw new AppError('This rental is already marked as paid', 409);
  }
  res.json({ message: 'Payment marked as paid', data: rental });
});

// Outstanding = sum of all Pending rentals, grouped by driver.
export const outstandingRentals = asyncHandler(async (req, res) => {
  const rows = await Rental.aggregate([
    { $match: { status: 'Pending' } },
    { $group: { _id: '$driver', amount: { $sum: '$amount' }, pendingWeeks: { $sum: 1 }, oldest: { $min: '$weekStart' } } },
    { $lookup: { from: 'drivers', localField: '_id', foreignField: '_id', as: 'driver' } },
    { $unwind: '$driver' },
    { $project: { _id: 0, driverId: '$_id', name: '$driver.name', phone: '$driver.phone', amount: 1, pendingWeeks: 1, oldest: 1 } },
    { $sort: { amount: -1 } },
  ]);
  const totalOutstanding = rows.reduce((sum, r) => sum + r.amount, 0);
  res.json({ totalOutstanding, drivers: rows });
});
