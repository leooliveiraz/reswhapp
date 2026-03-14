import React from "react";
import ContactCard from "./ContactCard";

export default function ContactList({ contactList, setSelectedContact }) {
  return (
    <div>
      <h3>Contact list size {contactList.length}</h3>
      {contactList.map((contact) => {
        return (
          <ContactCard
            contactData={contact}
            setSelectedContact={setSelectedContact}
          />
        );
      })}
    </div>
  );
}
