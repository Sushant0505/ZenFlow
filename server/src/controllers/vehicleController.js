import Vehicle from '../models/Vehicle.js';
import Assignment from '../models/Assignment.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listVehicles = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const [vehicles, active] = await Promise.all([
    Vehicle.find(filter).sort({ registrationNumber: 1 }).lean(),
    Assignment.find({ isActive: true }).populate('driver', 'name phone').lean(),
  ]);
  const byVehicle = new Map(active.map((a) => [String(a.vehicle), a]));
  res.json(
    vehicles.map((v) => {
      const a = byVehicle.get(String(v._id));
      return { ...v, currentDriver: a?.driver ?? null, assignmentId: a?._id ?? null };
    })
  );
});

export const createVehicle = asyncHandler(async (req, res) => {
  // Whitelist fields: status is controlled by assignment/breakdown flows, not by the client.
  const { registrationNumber, model, batteryCapacityKwh } = req.body;
  const vehicle = await Vehicle.create({ registrationNumber, model, batteryCapacityKwh });
  res.status(201).json({ message: `Vehicle ${vehicle.registrationNumber} added`, data: vehicle });
});
