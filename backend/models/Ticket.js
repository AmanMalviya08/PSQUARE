const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    seats: {
      type: [Number],
      required: true,
    },
    qrCode: {
      type: String, // Optional: generate QR code for ticket
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
