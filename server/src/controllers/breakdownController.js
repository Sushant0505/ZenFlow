import Breakdown from '../models/Breakdown.js';
import Vehicle from '../models/Vehicle.js';
import Assignment from '../models/Assignment.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertObjectId, parseDate } from '../utils/validators.js';

export const listBreakdowns = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const items = await Breakdown.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .populate('vehicle', 'registrationNumber model status')
    .populate('driver', 'name')
    .lean();
  res.json(items);
});

export const createBreakdown = asyncHandler(async (req, res) => {
  const { vehicleId, date, issue, vehicleStatus } = req.body;
  assertObjectId(vehicleId, 'Vehicle');
  const when = parseDate(date, 'Breakdown date');
  if (when.getTime() > Date.now() + 24 * 60 * 60 * 1000) throw new AppError('Breakdown date cannot be in the future', 400);

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const alreadyOpen = await Breakdown.exists({ vehicle: vehicleId, status: 'Open' });
  if (alreadyOpen) throw new AppError(`${vehicle.registrationNumber} already has an open breakdown. Resolve it first`, 409);

  const active = await Assignment.findOne({ vehicle: vehicleId, isActive: true });
  const underMaintenance = vehicleStatus === 'Under Maintenance';

  const breakdown = await Breakdown.create({
    vehicle: vehicleId,
    driver: active?.driver,
    date: when,
    issue,
    vehicleStatusAfter: vehicleStatus,
    status: underMaintenance ? 'Open' : 'Resolved',
    resolvedAt: underMaintenance ? null : new Date(),
  });

  if (underMaintenance) {
    // A vehicle in the workshop cannot stay with a driver: end the assignment so
    // the driver can be given another vehicle.
    if (active) await Assignment.updateOne({ _id: active._id }, { isActive: false, endDate: new Date() });
    vehicle.status = 'Under Maintenance';
  } else {
    // Minor issue fixed on the spot: vehicle keeps working with its driver (or stays available).
    vehicle.status = active ? 'Assigned' : 'Available';
  }
  await vehicle.save();

  res.status(201).json({
    message: underMaintenance
      ? `${vehicle.registrationNumber} marked Under Maintenance${active ? ' and unassigned from its driver' : ''}`
      : `Breakdown logged. ${vehicle.registrationNumber} remains ${vehicle.status}`,
    data: breakdown,
  });
});

export const resolveBreakdown = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Breakdown');
  const breakdown = await Breakdown.findOneAndUpdate(
    { _id: req.params.id, status: 'Open' },
    { status: 'Resolved', resolvedAt: new Date() },
    { new: true }
  );
  if (!breakdown) {
    const exists = await Breakdown.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Breakdown not found', 404);
    throw new AppError('This breakdown is already resolved', 409);
  }
  const vehicle = await Vehicle.findByIdAndUpdate(breakdown.vehicle, { status: 'Available' }, { new: true });
  res.json({ message: `${vehicle.registrationNumber} repaired and is now Available`, data: breakdown });
});
