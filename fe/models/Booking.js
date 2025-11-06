import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  date: String,
  service: String,
});

export default mongoose.model("Booking", bookingSchema);
