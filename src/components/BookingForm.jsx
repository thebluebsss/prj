"use client";
import React, { useState } from "react";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Checkbox,
  FormGroup,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/vi";

export default function BookingForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [service, setService] = useState("giat-say");
  const [pickupDate, setPickupDate] = useState(null); // Ngày lấy
  const [deliveryDate, setDeliveryDate] = useState(null); // Ngày bắt đầu/trả
  const [detergent, setDetergent] = useState("Omo"); // Loại bột giặt
  const [bleach, setBleach] = useState("Sử dụng"); // Chất tẩy
  const [useBag, setUseBag] = useState("Có"); // Túi giặt
  const [dryCleaningItems, setDryCleaningItems] = useState(false); // Đồ giặt khô
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const bookingData = {
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
    };

    console.log("Đang gửi dữ liệu:", bookingData);

    try {
      const response = await fetch("http://localhost:3001/api/create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi");

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setMessage("Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: "600px",
          margin: "2rem auto",
          padding: "2rem",
          boxShadow: 3,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Đặt Lịch
        </Typography>

        <TextField
          label="Tên *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Địa chỉ *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <TextField
          label="Số điện thoại *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <FormControl fullWidth>
          <InputLabel>Dịch vụ</InputLabel>
          <Select
            value={service}
            label="Dịch vụ"
            onChange={(e) => setService(e.target.value)}
          >
            <MenuItem value="giat-say">Giặt Sấy</MenuItem>
            <MenuItem value="giat-kho">Giặt Khô</MenuItem>
            <MenuItem value="giat-ui">Giặt Ủi</MenuItem>
          </Select>
        </FormControl>

        <DatePicker
          label="Ngày lấy đồ"
          value={pickupDate}
          onChange={(newValue) => setPickupDate(newValue)}
          renderInput={(params) => <TextField {...params} />}
        />
        <DatePicker
          label="Ngày trả đồ (Ngày bắt đầu)"
          value={deliveryDate}
          onChange={(newValue) => setDeliveryDate(newValue)}
          renderInput={(params) => <TextField {...params} />}
        />

        <FormControl>
          <FormLabel>Loại bột(nước) giặt</FormLabel>
          <RadioGroup
            row
            value={detergent}
            onChange={(e) => setDetergent(e.target.value)}
          >
            <FormControlLabel value="Omo" control={<Radio />} label="Omo" />
            <FormControlLabel value="Gain" control={<Radio />} label="Gain" />
            <FormControlLabel
              value="Bột giặt của tôi"
              control={<Radio />}
              label="Bột giặt của tôi"
            />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel>Chất tẩy trắng</FormLabel>
          <RadioGroup
            row
            value={bleach}
            onChange={(e) => setBleach(e.target.value)}
          >
            <FormControlLabel
              value="Sử dụng"
              control={<Radio />}
              label="Sử dụng"
            />
            <FormControlLabel
              value="Không sử dụng"
              control={<Radio />}
              label="Không sử dụng"
            />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel>Sử dụng túi giặt?</FormLabel>
          <RadioGroup
            row
            value={useBag}
            onChange={(e) => setUseBag(e.target.value)}
          >
            <FormControlLabel value="Có" control={<Radio />} label="Có" />
            <FormControlLabel value="Không" control={<Radio />} label="Không" />
          </RadioGroup>
        </FormControl>

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={dryCleaningItems}
                onChange={(e) => setDryCleaningItems(e.target.checked)}
              />
            }
            label="Đồ giặt khô (Tối đa 5 loại)"
          />
        </FormGroup>

        <TextField
          label="Lưu ý của bạn (Ghi chú)"
          variant="outlined"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={3}
          placeholder="Ví dụ: Hãy giặt đồ của tôi bằng nước ấm..."
        />

        <FormControl>
          <FormLabel>Phương thức thanh toán</FormLabel>
          <RadioGroup
            row
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel
              value="cod"
              control={<Radio />}
              label="Thanh toán khi nhận hàng"
            />
            <FormControlLabel
              value="online"
              control={<Radio />}
              label="Thanh toán Online"
            />
          </RadioGroup>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{
            backgroundColor: "#4CAF50",
            "&:hover": { backgroundColor: "#45a049" },
          }}
        >
          {isSubmitting ? "Đang xử lý..." : "ĐẶT LỊCH"}
        </Button>

        {message && (
          <Typography
            color={message.includes("Lỗi") ? "error" : "success.main"}
          >
            {message}
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
}
