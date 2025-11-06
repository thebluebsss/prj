import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar-container">
      <ul>
        <li>
          <NavLink to="/" end>
            TRANG CHỦ
          </NavLink>
        </li>
        <li>
          <NavLink to="/ve-chung-toi">VỀ CHÚNG TÔI</NavLink>
        </li>
        <li>
          <NavLink to="/dich-vu">DỊCH VỤ</NavLink>
        </li>
        <li>
          <NavLink to="/bang-gia">BẢNG GIÁ</NavLink>
        </li>
        <li>
          <NavLink to="/tin-tuc">TIN TỨC</NavLink>
        </li>
        <li>
          <NavLink to="/dat-lich">ĐẶT LỊCH NGAY</NavLink>
        </li>
        <li>
          <NavLink to="/lien-he">LIÊN HỆ</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
