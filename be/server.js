import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Groq from "groq-sdk";
import Booking from "./Booking.js"; // Import model

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ==================== KẾT NỐI MONGODB ====================
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/laundry-booking"
    );
    console.log("✅ MongoDB đã kết nối thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    console.log("\n⚠️  Hướng dẫn khắc phục:");
    console.log(
      "1. Cài MongoDB: https://www.mongodb.com/try/download/community"
    );
    console.log(
      "2. Hoặc dùng MongoDB Atlas (miễn phí): https://www.mongodb.com/cloud/atlas"
    );
    console.log("3. Cập nhật MONGODB_URI trong file .env\n");
    // Không thoát server, để API vẫn chạy được (trừ các route cần DB)
  }
};

connectDB();

// ==================== GROQ API SETUP ====================
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// ==================== CHATBOT ENDPOINT ====================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("📩 Nhận tin nhắn:", message);

    // Nếu không có API key → chatbot demo
    if (!groq) {
      return res.json({
        reply: `🤖 Chatbot demo: Bạn vừa nói "${message}". Hãy thêm GROQ_API_KEY vào file .env để sử dụng AI thực sự.`,
      });
    }

    // Gọi Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply =
      chatCompletion.choices[0]?.message?.content || "Xin lỗi, tôi không hiểu.";
    console.log("🤖 Bot trả lời:", reply);

    res.json({ reply });
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    return res.json({
      reply: `⚠️ Đã xảy ra lỗi: ${error.message}. Đây là phản hồi tạm thời cho tin nhắn "${req.body.message}".`,
    });
  }
});

// ==================== BOOKING API ROUTES ====================

// 📝 TẠO ĐơN HÀNG MỚI
app.post("/api/create-booking", async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      service,
      pickupDate,
      deliveryDate,
      detergent,
      bleach,
      useBag,
      dryCleaningItems,
      notes,
      paymentMethod,
    } = req.body;

    // Validation cơ bản
    if (!name || !phone || !address || !service) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng điền đầy đủ thông tin bắt buộc (tên, số điện thoại, địa chỉ, dịch vụ)",
      });
    }

    // Tạo booking mới
    const newBooking = new Booking({
      name,
      phone,
      address,
      service,
      pickupDate: pickupDate || null,
      deliveryDate: deliveryDate || null,
      detergent: detergent || "Omo",
      bleach: bleach || "Sử dụng",
      useBag: useBag || "Có",
      dryCleaningItems: dryCleaningItems || false,
      notes: notes || "",
      paymentMethod: paymentMethod || "cod",
      status: "pending",
      paymentStatus: "unpaid",
    });

    await newBooking.save();

    console.log("✅ Đơn hàng mới:", newBooking._id);

    // Nếu thanh toán online → trả về URL thanh toán giả lập
    if (paymentMethod === "online") {
      return res.status(201).json({
        success: true,
        message: "Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...",
        booking: newBooking,
        paymentUrl: `http://localhost:3000/payment?bookingId=${newBooking._id}`,
      });
    }

    // Thanh toán COD
    res.status(201).json({
      success: true,
      message: "Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm.",
      booking: newBooking,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo đơn hàng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
});

// 📋 LẤY TẤT CẢ ĐƠN HÀNG (có phân trang)
app.get("/api/bookings", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments();

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách đơn hàng",
      error: error.message,
    });
  }
});

// 🔍 LẤY ĐƠN HÀNG THEO ID
app.get("/api/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin đơn hàng",
      error: error.message,
    });
  }
});

// 🔍 TÌM ĐƠN HÀNG THEO SỐ ĐIỆN THOẠI
app.get("/api/bookings/phone/:phone", async (req, res) => {
  try {
    const bookings = await Booking.find({ phone: req.params.phone }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm đơn hàng",
      error: error.message,
    });
  }
});

// ✏️ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
app.patch("/api/bookings/:id/status", async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: booking,
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái",
      error: error.message,
    });
  }
});

// 🗑️ XÓA ĐƠN HÀNG
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({
      success: true,
      message: "Đã xóa đơn hàng thành công",
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa đơn hàng",
      error: error.message,
    });
  }
});

// 📊 THỐNG KÊ
app.get("/api/stats", async (req, res) => {
  try {
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ status: "pending" });
    const confirmed = await Booking.countDocuments({ status: "confirmed" });
    const completed = await Booking.countDocuments({ status: "completed" });
    const cancelled = await Booking.countDocuments({ status: "cancelled" });

    res.json({
      success: true,
      stats: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
      error: error.message,
    });
  }
});

// ==================== ROOT ENDPOINT ====================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "🧺 Laundry Booking API với Chatbot",
    hasGroqAPI: !!groq,
    endpoints: {
      "POST /api/chat": "Chatbot AI",
      "POST /api/create-booking": "Tạo đơn hàng mới",
      "GET /api/bookings": "Lấy danh sách đơn hàng",
      "GET /api/bookings/:id": "Lấy đơn hàng theo ID",
      "GET /api/bookings/phone/:phone": "Tìm đơn hàng theo SĐT",
      "PATCH /api/bookings/:id/status": "Cập nhật trạng thái",
      "DELETE /api/bookings/:id": "Xóa đơn hàng",
      "GET /api/stats": "Thống kê",
    },
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔗 Groq API: ${groq ? "Đã kết nối ✓" : "Chưa có key ✗"}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/create-booking\n`);
});
