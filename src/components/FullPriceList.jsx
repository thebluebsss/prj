import React, { useState } from "react";
import "./FullPriceList.css";
import { MdOutlineLocalLaundryService } from "react-icons/md";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import { MdDryCleaning } from "react-icons/md";

const priceData = {
  dryClean: {
    Bộ: [
      { name: "Bộ Complet", price: "80,000" },
      { name: "Bộ kí giả", price: "60,000" },
      { name: "Bộ đồ thể thao", price: "40,000" },
      { name: "Bộ đồ ngủ", price: "35,000" },
      { name: "Bộ quần áo gió (mỏng)", price: "35,000" },
      { name: "Bộ vét nữ", price: "70,000" },
      { name: "Bộ vét không lót", price: "55,000" },
      { name: "Bộ quần áo dài nhung", price: "90,000" },
      { name: "Bộ quần áo dài thường", price: "80,000" },
    ],
    Áo: [{ name: "Áo sơ mi", price: "20,000" }],
    Quần: [],
    Váy: [],
    "Chăn gối": [],
    "Các loại hàng khác": [],
  },
  wetWash: {
    Bộ: [{ name: "Bộ đồ thể thao", price: "30,000" }],
    Áo: [],
    Quần: [],
    Váy: [],
    "Chăn gối": [],
    "Các loại hàng khác": [],
  },
};

function AccordionItem({ title, items, isOpen, onToggle }) {
  return (
    <div className="accordion-item">
      <div
        className={`accordion-header ${isOpen ? "active" : ""}`}
        onClick={onToggle}
      >
        {title}
        <span className="accordion-icon">
          {isOpen ? <AiOutlineMinus /> : <AiOutlinePlus />}
        </span>
      </div>

      {isOpen && (
        <div className="accordion-content">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div className="price-row" key={index}>
                <span className="price-item-name">{item.name}</span>
                <span className="price-item-value">{item.price}</span>
              </div>
            ))
          ) : (
            <p className="no-data">Chưa cập nhật dữ liệu</p>
          )}
        </div>
      )}
    </div>
  );
}

function FullPriceList() {
  const [activeTab, setActiveTab] = useState("dryClean");

  const [openItem, setOpenItem] = useState(null);

  const currentData = priceData[activeTab];

  const handleToggle = (title) => {
    setOpenItem(openItem === title ? null : title);
  };

  return (
    <div className="price-list-container">
      <h2>BẢNG GIÁ ĐẦY ĐỦ</h2>
      <div className="divider-green"></div>

      <div className="price-tabs">
        <button
          className={`tab-button ${activeTab === "dryClean" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("dryClean");
            setOpenItem(null);
          }}
        >
          <MdDryCleaning />
          GIẶT KHÔ LÀ HƠI
        </button>
        <button
          className={`tab-button ${activeTab === "wetWash" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("wetWash");
            setOpenItem(null);
          }}
        >
          <MdOutlineLocalLaundryService />
          GIẶT ƯỚT SẤY KHÔ
        </button>
      </div>

      <div className="accordion-container">
        {Object.keys(currentData).map((categoryTitle) => (
          <AccordionItem
            key={categoryTitle}
            title={categoryTitle}
            items={currentData[categoryTitle]}
            isOpen={openItem === categoryTitle}
            onToggle={() => handleToggle(categoryTitle)}
          />
        ))}
      </div>
    </div>
  );
}

export default FullPriceList;
