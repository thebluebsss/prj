import React from "react";
import "./Services.css";
import { MdOutlineLocalLaundryService } from "react-icons/md";
import { BsLayers } from "react-icons/bs";
import { MdDryCleaning } from "react-icons/md";

function Services() {
  return (
    <div className="services-container">
      <div className="service-card blue">
        <div className="icon">
          <MdOutlineLocalLaundryService />
        </div>
        <h3>GIẶT ƯỚT SẤY KHÔ</h3>
        <p>Chúng tôi làm sạch đồ của bạn một cách nhanh chóng, hiệu quả</p>
      </div>

      <div className="service-card gray">
        <div className="icon">
          <MdDryCleaning />
        </div>
        <h3>GIẶT KHÔ LÀ HƠI</h3>
        <p>
          Giặt khô đảm bảo đồ của bạn sạch sẽ và bảo vệ được chất liệu vải không
          bị co dãn hoặc mất màu
        </p>
      </div>

      <div className="service-card green">
        <div className="icon">
          <BsLayers />
        </div>
        <h3>GIẶT LÀ CÔNG NGHIỆP</h3>
        <p>
          Với máy giặt công suất lớn chúng tôi có thể giặt tẩy lượng lớn đồ vải
          của nhà hàng, khách sạn.... hoặc giặt đồng phục nhân viên
        </p>
      </div>
    </div>
  );
}

export default Services;
