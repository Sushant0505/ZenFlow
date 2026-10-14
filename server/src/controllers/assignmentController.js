import Assignment from '../models/Assignment.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertObjectId } from '../utils/validators.js';

export const assignVehicle = asyncHandler(async (req, res) => {
  const { vehicleId, driverId } = req.body;
  assertObjectId(vehicleId, 'Vehicle');
  assertObjectId(driverId, 'Driver');

  const driver = await Driver.findById(driverId);
  if (!driver) throw new AppError('Driver not found', 404);
  if (!driver.active) throw new AppError('Driver is inactive and cannot be assigned a vehicle', 400);

  const driverBusy = await Assignment.findOne({ driver: driverId, isActive: true }).populate('vehicle', 'registrationNumber');
  if (driverBusy) {
    throw new AppError(`${driver.name} already has vehicle ${driverBusy.vehicle.registrationNumber}`, 409);
  }

  // Atomic claim: only flips the vehicle if it is still Available, so two
  // concurrent requests cannot both win.
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: vehicleId, status: 'Available' },
    { status: 'Assigned' },
    { new: true }
  );
  if (!vehicle) {
    const existing = await Vehicle.findById(vehicleId);
    if (!existing) throw new AppError('Vehicle not found', 404);
    throw new AppError(`Vehicle ${existing.registrationNumber} is ${existing.status} and cannot be assigned`, 409);
  }

  try {
    const assignment = await Assignment.create({ vehicle: vehicle._id, driver: driver._id });
    res.status(201).json({
      message: `${vehicle.registrationNumber} assigned to ${driver.name}`,
      data: assignment,
    });
  } catch (err) {
    // The partial unique indexes are the last line of defence; undo the claim.
    await Vehicle.updateOne({ _id: vehicle._id }, { status: 'Available' });
    throw err;
  }
});

export const endAssignment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Assignment');
  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { isActive: false, endDate: new Date() },
    { new: true }
  );
  if (!assignment) throw new AppError('No active assignment found with this id', 404);

  // Only flip back if the vehicle is still "Assigned" (it may be in maintenance).
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: assignment.vehicle, status: 'Assigned' },
    { status: 'Available' },
    { new: true }
  );
  res.json({ message: 'Vehicle returned and is now available', data: { assignment, vehicle } });
});
