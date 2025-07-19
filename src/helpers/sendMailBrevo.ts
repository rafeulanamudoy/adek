import axios from "axios";
import config from "../config";

const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  const payload = {
    sender: {
      name: "Nanwaa - Ride Hailing App",
      email: "masukkabir.dev@gmail.com",
    },
    to: [
      {
        email: to,
      },
    ],
    subject,
    htmlContent: html,
    textContent: text || "This is the plain text version of the email.",
  };
  await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
    headers: {
      "api-key": config.brevo.brevo_api_key,
      "Content-Type": "application/json",
    },
  });
};

export default sendEmail;
