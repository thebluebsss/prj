import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      enum: ["giat-say", "giat-kho", "giat-ui"],
      required: true,
    },
    pickupDate: {
      type: Date,
      required: false,
    },
    deliveryDate: {
      type: Date,
      required: false,
    },
    detergent: {
      type: String,
      enum: ["Omo", "Gain", "Bột giặt của tôi"],
      default: "Omo",
    },
    bleach: {
      type: String,
      enum: ["Sử dụng", "Không sử dụng"],
      default: "Sử dụng",
    },
    useBag: {
      type: String,
      enum: ["Có", "Không"],
      default: "Có",
    },
    dryCleaningItems: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Index để tìm kiếm nhanh
bookingSchema.index({ phone: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });

export default mongoose.model("Booking", bookingSchema);
