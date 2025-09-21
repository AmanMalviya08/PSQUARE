const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/create', paymentController.createPayment);
router.post('/confirm', paymentController.markPaymentSuccess);

router.get('/', restrictTo('admin'), async (req, res) => {
  res.status(200).json({ status: 'success', message: 'Implement payments listing in PaymentController' });
});

module.exports = router;
