import React, { useContext } from "react";
import { AppContext } from "../AppContext";

export default function ChatCard({ chatData }) {

    const { setSelectedContact } = useContext(AppContext);
    return  <div onClick={() => {console.log(chatData);
        setSelectedContact(chatData.id._serialized)
    }}>
        {chatData.name}
        <hr></hr>
    </div>
}