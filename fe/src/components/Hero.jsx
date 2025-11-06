import React from "react";
import "./Hero.css";

function Hero() {
  return (
    // <div className="hero-container" style={{ backgroundImage: `url(${HeroBackground})` }}>
    // Bỏ comment dòng trên khi có ảnh
    <div className="hero-container">
      <div className="hero-content">
        <p>GIAO NHẬN TẬN NƠI</p>
        <h2>0969263238</h2>
        <button>ĐẶT NGAY</button>
      </div>

      <div className="hero-graphic">
        {/* <img src={TshirtGraphic} alt="Laundry" /> */}
      </div>
      <div className="arrow left">&lt;</div>
      <div className="arrow right">&gt;</div>
    </div>
  );
}

export default Hero;
