import React, { useContext } from "react";
import ChatCard from "./ChatCard";
import "./ChatList.css"; // Vamos criar este arquivo
import { AppContext } from "../AppContext";

export default function ChatList() {
  const { chatList } = useContext(AppContext);
  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h3>Chat list size {chatList.length}</h3>
      </div>

      <div className="chat-list-scrollable">
        {chatList.map((chat, index) => {
          return <ChatCard key={chat.id.user} chatData={chat} />;
        })}
      </div>
    </div>
  );
}
