import mongoose from 'mongoose';

const breakdownSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }, // driver at the time of breakdown
    date: { type: Date, required: [true, 'Breakdown date is required'] },
    issue: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      minlength: [5, 'Describe the issue in at least 5 characters'],
      maxlength: 500,
    },
    // What the operator decided the vehicle's status should be after logging this.
    vehicleStatusAfter: {
      type: String,
      enum: { values: ['Under Maintenance', 'Available'], message: 'Vehicle status must be Under Maintenance or Available' },
      required: [true, 'Choose Under Maintenance or Available'],
    },
    status: { type: String, enum: ['Open', 'Resolved'], default: 'Open', index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Breakdown', breakdownSchema);
