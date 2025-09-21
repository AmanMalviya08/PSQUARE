const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Booking must belong to a user"],
      index: true, // ✅ for faster queries
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Booking must be for a trip"],
      index: true,
    },
    seats: {
      type: [Number], // Example: [3, 4, 5]
      required: [true, "At least one seat must be booked"],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Seats array cannot be empty",
      },
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"], 
      default: "pending",
    },
  },
  { timestamps: true }
);

bookingSchema.virtual("ticket", {
  ref: "Ticket",
  foreignField: "booking",
  localField: "_id",
});

bookingSchema.index({ trip: 1, seats: 1 }, { unique: false });

bookingSchema.set("toJSON", {
  transform: (_, obj) => {
    delete obj.__v;
    return obj;
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
