import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import ChatHeader from "./ChatHeader";
import "./Chat.css";
import Message from "./Message";

export default function Chat() {
  const { socket, selectedContact } = useContext(AppContext);
  const [chatList, setChatList] = useState([]);

  function getLastMessages() {
    if (selectedContact) {
      socket?.emit("get-last-messages", {
        contactId: selectedContact.id._serialized,
        limit: 20,
      });
    }
  }

  useEffect(() => {
    socket?.on("last-messages", (lastMessages) => {
      setChatList(lastMessages.messages);
    });
    return () => {
      socket?.off("last-messages");
    };
  }, [socket]);

  useEffect(() => {
    getLastMessages();
  }, [selectedContact]);

  return (
    <>
      {selectedContact && (
        <ChatHeader
          nome={selectedContact?.name}
          numero={selectedContact?.id?.user}
        ></ChatHeader>
      )}

      <div className="chat-messages">
        {chatList.map((msg, index) => {
          return (
            <Message
              key={msg.id}
              msg={msg}
              contactName={selectedContact?.name}
              isOwn={msg.isMe}
            />
          );
        })}
      </div>
    </>
  );
}
