import React from "react";
import "./HeaderTop.css";
import { FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";

function HeaderTop() {
  return (
    <div className="header-top-container">
      <div className="header-info">
        <FaMapMarkerAlt />
        <span>Bách Khoa, Hà Nội</span>
      </div>
      <div className="header-logo">
        PROLAUNDRY & DRYCLEANING
        <p>Save Time, Enjoy Life</p>
      </div>
      <div className="header-contact">
        <FaPhoneAlt />
        <span>0969263238</span>
        <p>Online</p>
      </div>
    </div>
  );
}

export default HeaderTop;
