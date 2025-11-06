import React, { useState } from "react";
// Giả sử bạn import các component UI đã có
// import { Input } from "./ui/input";
// import { Button } from "./ui/button";
// import { ScrollArea } from "./ui/scroll-area";

function ChatWindow({ onClose }) {
  const [messages, setMessages] = useState([]); // [{ type: 'user', text: 'Hi' }, { type: 'bot', text: 'Hello!' }]
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Bước 3 sẽ kết nối ở đây
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();

      const botMessage = { type: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage = { type: "bot", text: "Xin lỗi, đã có lỗi xảy ra." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window">
      {" "}
      {/* Bạn cần tự định nghĩa style cho class này */}
      <div className="chat-header">
        <h4>Chat với AI</h4>
        <button onClick={onClose}>&times;</button>
      </div>
      {/* Dùng ScrollArea của bạn ở đây để bọc 'chat-messages' */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="message bot">Đang gõ...</div>}
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        {/* Dùng Input và Button của bạn ở đây */}
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

export default ChatWindow;
