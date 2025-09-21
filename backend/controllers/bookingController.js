const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const PDFDocument = require('pdfkit');

// Create booking
exports.createBooking = asyncHandler(async (req, res, next) => {
  const { tripId, seats } = req.body;
  if (!tripId || !Array.isArray(seats) || seats.length === 0) {
    return next(new AppError('tripId and seats array are required', 400));
  }

  const trip = await Trip.findById(tripId);
  if (!trip) return next(new AppError('Trip not found', 404));

  // check conflicts
  const conflicting = await Booking.find({
    trip: tripId,
    status: { $ne: 'cancelled' },
    seats: { $in: seats },
  });
  if (conflicting.length > 0) {
    return next(new AppError('One or more selected seats are already booked.', 409));
  }

  if (trip.availableSeats < seats.length) {
    return next(new AppError('Not enough available seats', 409));
  }

  const booking = await Booking.create({
    user: req.user._id,
    trip: trip._id,
    seats,
    paymentStatus: 'pending',
  });

  trip.availableSeats -= seats.length;
  await trip.save();

  res.status(201).json({ status: 'success', data: { booking } });
});

// Confirm payment
exports.confirmPayment = asyncHandler(async (req, res, next) => {
  const { bookingId, amount, method = 'mock', transactionId } = req.body;
  if (!bookingId || amount == null) return next(new AppError('bookingId and amount required', 400));

  const booking = await Booking.findById(bookingId).populate('trip');
  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.paymentStatus === 'paid') return next(new AppError('Booking already paid', 400));

  const payment = await Payment.create({
    booking: booking._id,
    user: booking.user,
    amount,
    method,
    status: 'success',
    transactionId: transactionId || `MOCK-${Date.now()}`,
  });

  booking.paymentStatus = 'paid';
  await booking.save();

  const ticket = await Ticket.create({
    booking: booking._id,
    user: booking.user,
    trip: booking.trip._id,
    seats: booking.seats,
    qrCode: `TICKET-${Date.now()}`,
  });

  res.status(200).json({
    status: 'success',
    data: { booking, payment, ticket },
  });
});

// My bookings
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('trip')
    .sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', data: { bookings } });
});

// Cancel booking
exports.cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate('trip');
  if (!booking) return next(new AppError('Booking not found', 404));

  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }

  if (booking.status === 'cancelled') return next(new AppError('Booking already cancelled', 400));

  booking.status = 'cancelled';
  if (booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
  await booking.save();

  const trip = await Trip.findById(booking.trip._id);
  if (trip) {
    trip.availableSeats += booking.seats.length;
    if (trip.availableSeats > trip.totalSeats) trip.availableSeats = trip.totalSeats;
    await trip.save();
  }

  res.status(200).json({ status: 'success', data: { booking } });
});

// Admin: list all bookings
exports.getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('user', 'name email role')
    .populate('trip', 'from to date time price')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
});

// Download ticket (PDF)
exports.downloadTicket = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('trip')
    .populate('user', 'name email');
  if (!booking) return next(new AppError('Booking not found', 404));

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking._id}.pdf`);
  doc.pipe(res);

  doc.fontSize(22).text('🎟️ PSQUARE Ticket', { align: 'center' }).moveDown();
  doc.fontSize(14).text(`Booking ID: ${booking._id}`);
  doc.text(`Name: ${booking.user?.name || 'User'}`);
  doc.text(`Email: ${booking.user?.email || '-'}`).moveDown();
  doc.text(`Route: ${booking.trip.from} → ${booking.trip.to}`);
  doc.text(`Date: ${new Date(booking.trip.date).toLocaleDateString()}`);
  doc.text(`Time: ${booking.trip.time}`);
  doc.text(`Seats: ${booking.seats.join(', ')}`);
  doc.text(`Status: ${booking.status}`);
  doc.text(`Payment: ${booking.paymentStatus}`).moveDown();
  doc.fontSize(16).text('Enjoy your trip with PSQUARE!', { align: 'center' });

  doc.end();
});
