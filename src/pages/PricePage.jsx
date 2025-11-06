import React from "react";
import "./PricePage.css";
import { IoShirtOutline } from "react-icons/io5";
import { BsBag } from "react-icons/bs";
import { GiHanger } from "react-icons/gi";
import FullPriceList from "../components/FullPriceList";
function PricePage() {
  return (
    <div className="price-page-container">
      <div className="breadcrumb">HOME » PRICE</div>
      <div className="price-content">
        <h2>GIÁ DỊCH VỤ</h2>
        <div className="divider-green"></div>
        <p>Dịch vụ chất lượng luôn đi kèm với mức giá phải chăng.</p>
      </div>
      <section className="top-services">
        <h2>DỊCH VỤ HÀNG ĐẦU</h2>
        <div className="divider-green"></div>

        <div className="services-grid">
          <div className="service-item">
            <div className="service-icon">
              <IoShirtOutline />
            </div>
            <h4>Chỉ từ 20.000đ/chiếc</h4>
            <p>Dịch vụ giặt áo sơ mi</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <BsBag />
            </div>
            <h4>Chỉ từ 10.000đ/kg</h4>
            <p>Dịch vụ giặt ướt, sấy khô</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <GiHanger />
            </div>
            <h4>Chỉ từ 30.000đ/chiếc</h4>
            <p>Giặt khô là hơi</p>
          </div>
        </div>
      </section>
      <FullPriceList />
    </div>
  );
}

export default PricePage;
