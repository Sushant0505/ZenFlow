import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Driver name is required'], trim: true, maxlength: 80 },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'Licence number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9 -]{8,20}$/, 'Licence number must be 8-20 letters, digits, spaces or dashes'],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Driver', driverSchema);
