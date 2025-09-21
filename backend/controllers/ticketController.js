// controllers/ticketController.js
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// get ticket info (for download or view)
exports.getTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate({ path: 'trip' })
    .populate({ path: 'user', select: 'name email' })
    .populate({ path: 'booking' });

  if (!ticket) return next(new AppError('Ticket not found', 404));

  // authorization: either ticket owner or admin
  if (String(ticket.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to view this ticket', 403));
  }

  // you can generate PDF here or return the data for client-side PDF rendering
  res.status(200).json({ status: 'success', data: { ticket } });
});
