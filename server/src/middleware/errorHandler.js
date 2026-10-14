const DUPLICATE_MESSAGES = {
  registrationNumber: 'A vehicle with this registration number already exists',
  phone: 'A driver with this phone number already exists',
  licenseNumber: 'A driver with this licence number already exists',
  vehicle: 'This vehicle already has an active driver',
  driver: 'This driver already has an active vehicle',
};

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: errors[0], errors });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || {});
    // Rental uniqueness is on the (driver, weekStart) pair.
    const message = keys.includes('weekStart')
      ? 'A rental for this driver and week already exists'
      : DUPLICATE_MESSAGES[keys[0]] || 'Duplicate record';
    return res.status(409).json({ message });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Something went wrong on the server' : err.message });
}
