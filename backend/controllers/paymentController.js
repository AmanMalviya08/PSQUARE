// controllers/paymentController.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// Mock endpoint to create payment intent / simulate payment (client can call then confirm)
exports.createPayment = asyncHandler(async (req, res, next) => {
  const { bookingId, amount, method = 'mock' } = req.body;
  if (!bookingId || amount == null) return next(new AppError('bookingId and amount required', 400));

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new AppError('Booking not found', 404));

  // create a payment record with pending status
  const payment = await Payment.create({
    booking: booking._id,
    user: req.user._id,
    amount,
    method,
    status: 'pending',
    transactionId: `PAY-${Date.now()}`,
  });

  res.status(201).json({ status: 'success', data: { payment } });
});

// Webhook or confirm endpoint (in production would verify with payment gateway)
exports.markPaymentSuccess = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) return next(new AppError('Payment not found', 404));
  payment.status = 'success';
  await payment.save();

  // update booking
  const booking = await Booking.findById(payment.booking);
  booking.paymentStatus = 'paid';
  await booking.save();

  res.status(200).json({ status: 'success', data: { payment, booking } });
});
