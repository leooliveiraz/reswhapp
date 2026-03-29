import React, { useContext } from "react";

import "./Container.css";
import ChatList from "./ChatList";
import Chat from "./Chat";
import { AppContext } from "../AppContext";

export default function Container() {
  const { selectedContact } = useContext(AppContext);

  return (
    <div className={`container ${selectedContact ? "chat-open" : "chat-closed"}`}>
      <div className="chat-list-container">
        <ChatList></ChatList>
      </div>
      <div className="chat-container">
        <Chat></Chat>
      </div>
    </div>
  );
}
