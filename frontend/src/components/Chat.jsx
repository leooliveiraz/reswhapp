import React, { useEffect, useState } from "react";

export default function Chat({ contactId, socket }) {
    const [chatList, setChatList] = useState([]);

    function getLastMessages() {
        console.log("getting messages from", contactId)
        if (contactId) {
            socket.emit("get-last-messages", { contactId: contactId, limit: 20 })
        }

    }

    useEffect(() => {
        socket.on('last-messages', (lastMessages) => {
            console.log('Recebido lista de chats');
            console.log(lastMessages)
            setChatList(lastMessages.messages)
        });
        return () => {
            socket.off('last-messages');
        }
    }, [])

    useEffect(() => {
        getLastMessages();
    }, [contactId])


    return <>
        {contactId}
        <div>
            {chatList.map(msg => {
                return <div>
                    {msg.isMe ? msg.contactName :  msg.contactName}: <br></br>
                    {msg.body} <br></br>                   
                </div>
            })}
        </div>
    </>

}