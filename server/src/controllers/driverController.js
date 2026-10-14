import Driver from '../models/Driver.js';
import Assignment from '../models/Assignment.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listDrivers = asyncHandler(async (req, res) => {
  const [drivers, active] = await Promise.all([
    Driver.find().sort({ name: 1 }).lean(),
    Assignment.find({ isActive: true }).populate('vehicle', 'registrationNumber model').lean(),
  ]);
  const byDriver = new Map(active.map((a) => [String(a.driver), a]));
  res.json(
    drivers.map((d) => {
      const a = byDriver.get(String(d._id));
      return { ...d, currentVehicle: a?.vehicle ?? null };
    })
  );
});

export const createDriver = asyncHandler(async (req, res) => {
  const { name, phone, licenseNumber } = req.body;
  const driver = await Driver.create({ name, phone, licenseNumber });
  res.status(201).json({ message: `Driver ${driver.name} added`, data: driver });
});
