import React from "react";

interface ContactFormEmailProps {
  name: string;
  email: string;
  message: string;
}

const ContactFormEmail: React.FC<Readonly<ContactFormEmailProps>> = ({
  name,
  email,
  message,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      maxWidth: "600px",
      margin: "0 auto",
      padding: "24px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
    }}
  >
    <h2 style={{ color: "#111", marginBottom: "8px" }}>
      📬 New message from {name}
    </h2>
    <hr style={{ borderColor: "#e5e5e5", marginBottom: "16px" }} />

    <p style={{ color: "#555", marginBottom: "4px" }}>
      <strong>Name:</strong> {name}
    </p>
    <p style={{ color: "#555", marginBottom: "4px" }}>
      <strong>Email:</strong>{" "}
      <a href={`mailto:${email}`} style={{ color: "#6366f1" }}>
        {email}
      </a>
    </p>

    <div
      style={{
        marginTop: "20px",
        padding: "16px",
        backgroundColor: "#fff",
        borderRadius: "6px",
        border: "1px solid #e5e5e5",
      }}
    >
      <p style={{ color: "#333", margin: 0, whiteSpace: "pre-wrap" }}>
        {message}
      </p>
    </div>

    <hr style={{ borderColor: "#e5e5e5", marginTop: "24px" }} />
    <p style={{ color: "#999", fontSize: "12px", marginTop: "12px" }}>
      © {new Date().getFullYear()} devprashantkyadav.com — You received this
      because someone submitted the contact form on your portfolio.
    </p>
  </div>
);

export default ContactFormEmail;
