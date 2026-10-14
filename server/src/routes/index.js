import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { listVehicles, createVehicle } from '../controllers/vehicleController.js';
import { listDrivers, createDriver } from '../controllers/driverController.js';
import { assignVehicle, endAssignment } from '../controllers/assignmentController.js';
import { listRentals, createRental, markRentalPaid, outstandingRentals } from '../controllers/rentalController.js';
import { listBreakdowns, createBreakdown, resolveBreakdown } from '../controllers/breakdownController.js';

const router = Router();

router.get('/dashboard', getDashboard);

router.route('/vehicles').get(listVehicles).post(createVehicle);
router.route('/drivers').get(listDrivers).post(createDriver);

router.post('/assignments', assignVehicle);
router.post('/assignments/:id/end', endAssignment);

router.get('/rentals/outstanding', outstandingRentals); // before /:id routes
router.route('/rentals').get(listRentals).post(createRental);
router.patch('/rentals/:id/pay', markRentalPaid);

router.route('/breakdowns').get(listBreakdowns).post(createBreakdown);
router.patch('/breakdowns/:id/resolve', resolveBreakdown);

export default router;
