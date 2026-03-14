import React from "react";

export default function ContactCard({ contactData, setSelectedContact }) {
  return (
    <div
      onClick={() => {
        setSelectedContact(contactData);
      }}
    >
      {contactData.name} ({contactData.number}){" "}
    </div>
  );
}
