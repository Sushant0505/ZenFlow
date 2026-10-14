import mongoose from 'mongoose';

export const VEHICLE_STATUS = ['Available', 'Assigned', 'Under Maintenance'];

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9 -]{5,15}$/, 'Registration number must be 5-15 letters, digits, spaces or dashes'],
    },
    model: { type: String, required: [true, 'Vehicle model is required'], trim: true, maxlength: 60 },
    batteryCapacityKwh: { type: Number, min: [1, 'Battery capacity must be positive'], max: 100 },
    // Derived from assignments/breakdowns but stored so the dashboard can count with one query.
    status: { type: String, enum: VEHICLE_STATUS, default: 'Available', index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
