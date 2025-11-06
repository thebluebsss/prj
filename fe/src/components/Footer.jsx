import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaPaperPlane,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-main">
        <div className="footer-column brand-info">
          <h3>PROLAUNDRY</h3>
          <p>Dịch vụ giặt sấy chuyên nghiệp. Save Time, Enjoy Life.</p>
          <div className="social-icons">
            <a href="#" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="#" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>
        <div className="footer-column">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/">Trang Chủ</Link>
            </li>
            <li>
              <Link to="/ve-chung-toi">Về Chúng Tôi</Link>
            </li>
            <li>
              <Link to="/dich-vu">Dịch Vụ</Link>
            </li>
            <li>
              <Link to="/bang-gia">Bảng Giá</Link>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Customer Service</h4>
          <ul>
            <li>
              <Link to="/lien-he">Liên Hệ</Link>
            </li>
            <li>
              <Link to="/dat-lich">Đặt Lịch Ngay</Link>
            </li>
            <li>
              <a href="#">FAQs</a>
            </li>
            <li>
              <a href="#">Privacy Policy</a>
            </li>
            <li>
              <a href="#">Terms & Conditions</a>
            </li>
          </ul>
        </div>

        <div className="footer-column subscribe">
          <h4>Stay Updated</h4>
          <p>Đăng ký nhận bản tin và các ưu đãi độc quyền của chúng tôi.</p>
          <form className="subscribe-form">
            <input type="email" placeholder="Email của bạn" />
            <button type="submit" aria-label="Subscribe">
              <FaPaperPlane />
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Prolaundry. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
