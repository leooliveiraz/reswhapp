import React from "react";

export default function ContactCard({ contactData , setSelectedContact}) {
    
    return  <div onClick={() => {console.log(contactData);setSelectedContact(contactData.id._serialized)}}>
        {contactData.name} ({contactData.number}) </div>
}