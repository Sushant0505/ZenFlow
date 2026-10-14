import mongoose from 'mongoose';
import AppError from './AppError.js';

export function assertObjectId(value, label) {
  if (!value || !mongoose.isValidObjectId(value)) {
    throw new AppError(`${label} is required and must be valid`, 400);
  }
}

export function parseDate(value, label) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) throw new AppError(`${label} must be a valid date`, 400);
  return d;
}
