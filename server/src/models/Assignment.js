import mongoose from 'mongoose';

// One document per vehicle<->driver pairing. Keeping history here (instead of a
// single field on Vehicle) lets us answer "who drove this vehicle last month?"
// and, more importantly, lets the database itself enforce the business rule.
const assignmentSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A vehicle can have at most ONE active driver, and a driver at most ONE active vehicle.
// Partial unique indexes only apply to active rows, so history is unrestricted.
assignmentSchema.index({ vehicle: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
assignmentSchema.index({ driver: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model('Assignment', assignmentSchema);
