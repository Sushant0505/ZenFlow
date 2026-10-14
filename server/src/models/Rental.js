import mongoose from 'mongoose';

export const PAYMENT_STATUS = ['Paid', 'Pending'];

const rentalSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }, // vehicle held that week, if any
    weekStart: { type: Date, required: [true, 'Week is required'] }, // always a Monday (UTC)
    amount: { type: Number, required: [true, 'Rental amount is required'], min: [1, 'Amount must be greater than 0'] },
    status: {
      type: String,
      enum: { values: PAYMENT_STATUS, message: 'Status must be Paid or Pending' },
      default: 'Pending',
      index: true,
    },
    paidOn: { type: Date, default: null },
  },
  { timestamps: true }
);

rentalSchema.index({ driver: 1, weekStart: 1 }, { unique: true });

export default mongoose.model('Rental', rentalSchema);
