import React from "react";
import ChatCard from "./ChatCard";

export default function ChatList({ chatList }) {
    return <div >
        <h3>Chat list size {chatList.length}</h3>
        {chatList.map(contact => {
            return <ChatCard chatData={contact} />
        })}
    </div>
}