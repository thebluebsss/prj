import React from "react";
import HeaderTop from "./components/HeaderTop.jsx";
import Navbar from "./components/Navbar.jsx";
import Services from "./components/Services.jsx";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import PricePage from "./pages/PricePage.jsx";
import Footer from "./components/Footer.jsx";
import ChatBot from "./components/ChatBot"; // <-- Dòng mới
import "./index.css";
import BookingForm from "./components/BookingForm.jsx";
// import AboutPage from './pages/AboutPage'; // (Tạo sau)
// import ServicesPage from './pagesli/ServicesPage'; // (Tạo sau)

function App() {
  return (
    <div className="App">
      <HeaderTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bang-gia" element={<PricePage />} />
          <Route path="/dat-lich" element={<BookingForm />} />
          <Route path="/dich-vu" element={<Services />} />
        </Routes>
      </main>
      <Footer />
      {/* <ChatBotIcon /> */} {/* <-- Dòng này cũ */}
      <ChatBot /> {/* <-- Dòng mới */}
    </div>
  );
}

export default App;
