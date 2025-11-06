import React, { useState, useEffect, useRef } from "react";
import "./ChatBot.css"; // Chúng ta sẽ tạo file này ở Bước 2
import { BsChatDots } from "react-icons/bs"; // Icon chat
import { IoClose } from "react-icons/io5"; // Icon đóng

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false); // Trạng thái đóng/mở
  const [messages, setMessages] = useState([
    { type: "bot", text: "Chào bạn! Tôi có thể giúp gì cho bạn?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ref để tự động cuộn xuống tin nhắn mới nhất
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Tự động cuộn khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm bật/tắt cửa sổ chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Hàm xử lý khi gửi form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // *** BƯỚC QUAN TRỌNG: GỌI API CỦA BẠN ***
      // Đây là nơi bạn kết nối với API Route (ví dụ: /api/chat)
      // mà bạn đã tạo ở backend (sử dụng gemini-agent.ts, v.v.)
      const response = await fetch("/api/chat", {
        // Đảm bảo đường dẫn này đúng
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi gọi API");
      }

      const data = await response.json();

      // Nhận câu trả lời từ bot
      const botMessage = { type: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Lỗi:", error);
      // Hiển thị lỗi cho người dùng
      const errorMessage = {
        type: "bot",
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu CHƯA MỞ, chỉ hiển thị icon
  if (!isOpen) {
    return (
      <button className="chatbot-icon-button" onClick={toggleChat}>
        <BsChatDots />
      </button>
    );
  }

  // Nếu ĐÃ MỞ, hiển thị toàn bộ cửa sổ chat
  return (
    <div className="chat-window">
      <div className="chat-header">
        <h4>Chat với AI</h4>
        <button onClick={toggleChat} className="chat-close-button">
          <IoClose />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <span className="typing-indicator"></span>
          </div>
        )}
        {/* Ref để cuộn */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Gửi
        </button>
      </form>
    </div>
  );
}

export default ChatBot;
