import React from "react";

import "./Container.css";
import ChatList from "./ChatList";
import Chat from "./Chat";
export default function Container() {
  return (
    <div className="container">
      <div className="chat-list-container">
        <ChatList></ChatList>
      </div>
      <div className="chat-container">
        <Chat></Chat>
      </div>
    </div>
  );
}
