// controllers/tripController.js
const Trip = require('../models/Trip');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const multer = require('multer');

// multer memory storage for image buffer (we store image in DB)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif/.test((file.mimetype || '').toLowerCase());
    if (ok) cb(null, true);
    else cb(new AppError('Only image files allowed (jpeg, png, webp, gif)', 400), false);
  },
});

exports.uploadImage = upload.single('image');

// helper: compute absolute image URL for a trip, using the request host/protocol
function buildImageUrl(req, tripObj) {
  if (!tripObj) return null;
  if (tripObj.imageData) {
    // serve image via streaming endpoint
    return `${req.protocol}://${req.get('host')}/api/v1/trips/${tripObj._id}/image`;
  }
  if (tripObj.image) {
    return `${req.protocol}://${req.get('host')}/uploads/trips/${tripObj.image}`;
  }
  return null;
}

/* ---------- Controllers ---------- */

// Create trip (admin)
exports.createTrip = asyncHandler(async (req, res, next) => {
  const { from, to, date, time, totalSeats, price } = req.body;
  if (!from || !to || !date || !time || !totalSeats || price == null) {
    return next(new AppError('Missing required trip fields', 400));
  }

  const tripData = {
    from,
    to,
    date: new Date(date),
    time,
    totalSeats: Number(totalSeats),
    availableSeats: req.body.availableSeats ? Number(req.body.availableSeats) : Number(totalSeats),
    price: Number(price),
  };

  if (req.file && req.file.buffer) {
    tripData.imageContentType = req.file.mimetype;
    tripData.imageData = req.file.buffer.toString('base64');
  }

  const trip = await Trip.create(tripData);
  const tripObj = trip.toObject();
  tripObj.imageUrl = buildImageUrl(req, tripObj);

  res.status(201).json({ status: 'success', data: { trip: tripObj } });
});

// Update trip (admin)
exports.updateTrip = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return next(new AppError('Trip not found', 404));

  const updatable = ['from', 'to', 'date', 'time', 'totalSeats', 'price'];
  updatable.forEach((k) => {
    if (req.body[k] !== undefined) {
      if (k === 'date') trip[k] = new Date(req.body[k]);
      else if (k === 'totalSeats') trip[k] = Number(req.body[k]);
      else if (k === 'price') trip[k] = Number(req.body[k]);
      else trip[k] = req.body[k];
    }
  });

  if (req.body.totalSeats !== undefined) {
    const newTotal = Number(req.body.totalSeats);
    const diff = newTotal - trip.totalSeats;
    trip.availableSeats = Math.max(0, trip.availableSeats + diff);
    trip.totalSeats = newTotal;
  }

  if (req.file && req.file.buffer) {
    trip.imageContentType = req.file.mimetype;
    trip.imageData = req.file.buffer.toString('base64');
    trip.image = null; // clear legacy filename if any
  }

  await trip.save();
  const tripObj = trip.toObject();
  tripObj.imageUrl = buildImageUrl(req, tripObj);

  res.status(200).json({ status: 'success', data: { trip: tripObj } });
});

// Delete trip (admin)
exports.deleteTrip = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) return next(new AppError('Trip not found', 404));
  res.status(204).json({ status: 'success', data: null });
});

// List trips (public) with filters
exports.listTrips = asyncHandler(async (req, res) => {
  const filter = {};
  const { from, to, date, minPrice, maxPrice } = req.query;

  if (from) filter.from = new RegExp(`^${from}$`, 'i');
  if (to) filter.to = new RegExp(`^${to}$`, 'i');

  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  }

  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);

  const trips = await Trip.find(filter).sort({ date: 1 });

  // map and attach absolute imageUrl using req
  const tripsWithUrls = trips.map((t) => {
    const obj = t.toObject();
    obj.imageUrl = buildImageUrl(req, obj); // <-- IMPORTANT: uses req available in this scope
    return obj;
  });

  res.status(200).json({ status: 'success', results: tripsWithUrls.length, data: { trips: tripsWithUrls } });
});

// Get trip details (public)
exports.getTrip = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return next(new AppError('Trip not found', 404));
  const obj = trip.toObject();
  obj.imageUrl = buildImageUrl(req, obj);
  res.status(200).json({ status: 'success', data: { trip: obj } });
});

// Serve image endpoint: streams DB-stored image or redirects to uploads static file
exports.getImage = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id).lean();
  if (!trip) return next(new AppError('Trip not found', 404));

  if (trip.imageData && trip.imageContentType) {
    const imgBuffer = Buffer.from(trip.imageData, 'base64');
    res.set('Content-Type', trip.imageContentType);
    return res.send(imgBuffer);
  }

  if (trip.image) {
    // redirect to static uploads
    return res.redirect(`/uploads/trips/${trip.image}`);
  }

  return next(new AppError('Image not found', 404));
});
