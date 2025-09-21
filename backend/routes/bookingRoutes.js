const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', bookingController.createBooking);
router.post('/confirm-payment', bookingController.confirmPayment);
router.get('/my', bookingController.getMyBookings);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.get('/:id/ticket', bookingController.downloadTicket);

router.get('/', restrictTo('admin'), bookingController.getAllBookings);

module.exports = router;
