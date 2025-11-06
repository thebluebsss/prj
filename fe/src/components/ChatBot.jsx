import React, { useState, useEffect, useRef } from "react";
import "./ChatBot.css";

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "Chào bạn! Tôi có thể giúp gì cho bạn?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi gọi API");
      }

      const data = await response.json();
      const botMessage = { type: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Lỗi:", error);
      const errorMessage = {
        type: "bot",
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button className="chatbot-icon-button" onClick={toggleChat}>
        💬
      </button>
    );
  }

  return (
    <>
      <div className="chat-window">
        <div className="chat-header">
          <h4>Chat với AI</h4>
          <button onClick={toggleChat} className="chat-close-button">
            ✕
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
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading}>
            Gửi
          </button>
        </div>
      </div>
    </>
  );
}

export default ChatBot;