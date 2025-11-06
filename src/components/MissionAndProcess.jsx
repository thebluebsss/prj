import React from "react";
import "./MissionAndProcess.css";
import { BsFillBasketFill } from "react-icons/bs";
import { FaTruck } from "react-icons/fa";
import { MdLocalLaundryService } from "react-icons/md";
import { FaUserTie } from "react-icons/fa";

function MissionAndProcess() {
  return (
    <div className="mission-process-wrapper">
      <section className="mission-container">
        <h2>SỨ MỆNH CỦA CHÚNG TÔI VỚI GIẶT LÀ</h2>
        <div className="divider"></div>
        <p>
          Chúng tôi mang lại dịch vụ tốt nhất tới khách hàng. Xua tan đi mọi sự
          lo lắng, mệt mỏi với đống đồ cần phải giặt sạch hàng ngày.
        </p>
      </section>

      <section className="process-container">
        <h2>QUY TRÌNH : 4 BƯỚC ĐƠN GIẢN</h2>

        <div className="process-steps">
          <div className="process-step">
            <div className="icon-wrapper basket">
              <BsFillBasketFill />
            </div>
            <h4>Tiếp Nhận</h4>
            <p>Gọi điện đặt lịch giặt</p>
          </div>

          <div className="process-step">
            <div className="icon-wrapper truck">
              <FaTruck />
            </div>
            <h4>Nhận Đồ Giặt</h4>
            <p>Nhân viên có mặt tại điểm hẹn</p>
          </div>

          <div className="process-step">
            <div className="icon-wrapper washer">
              <MdLocalLaundryService />
            </div>
            <h4>Giặt và Đóng Gói</h4>
            <p>Giặt sạch, là phẳng và đóng gói</p>
          </div>

          <div className="process-step">
            <div className="icon-wrapper tie">
              <FaUserTie />
            </div>
            <h4>Giao Hàng Tận Nơi</h4>
            <p>Chuyển quần áo sạch đến với khách hàng</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MissionAndProcess;
