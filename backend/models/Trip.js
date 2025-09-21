// models/Trip.js
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
    },
    to: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Trip date is required'],
    },
    time: {
      type: String,
      required: [true, 'Trip time is required'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats are required'],
      min: 1,
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },

    // DB-stored image (base64) — good for small/medium images / dev
    imageData: {
      type: String, // base64 string (without data:<mime>;base64, prefix)
      default: null,
    },
    imageContentType: {
      type: String, // e.g. 'image/jpeg'
      default: null,
    },

    // Legacy/disk filename (optional)
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// set availableSeats default to totalSeats when creating doc if not provided
tripSchema.pre('validate', function (next) {
  if (this.isNew && (this.availableSeats === undefined || this.availableSeats === null)) {
    this.availableSeats = this.totalSeats;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
