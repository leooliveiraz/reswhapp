import React, { useContext } from "react";
import ChatCard from "./ChatCard";
import "./ChatList.css";
import { AppContext } from "../AppContext";

export default function ChatList() {
  const { chatList, setSelectedContact, setChatList } = useContext(AppContext);

  const handleSelectContact = (chatData) => {
    setSelectedContact(chatData);
    setChatList(prevChatList =>
      prevChatList.map(chat =>
        chat.id._serialized === chatData.id._serialized
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
  };

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h3>Chats ({chatList.length})</h3>
      </div>

      <div className="chat-list-scrollable">
        {chatList.map((chat) => {
          return (
            <ChatCard
              key={chat.id._serialized}
              chatData={chat}
              onClick={() => handleSelectContact(chat)}
            />
          );
        })}
      </div>
    </div>
  );
}
