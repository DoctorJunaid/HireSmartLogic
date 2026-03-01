import nodemailer from "nodemailer";
import getResetPasswordTemplate from "./emailTemplate.js";
const MAIL_PASS = process.env.MAIL_PASS;
import sendVerficationTemplate from './sendVerificationTemplate.js'
// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: "naseebnoman39@gmail.com",
    pass: MAIL_PASS,
  },
});

// Send an email using async/await
const sendMail = async (senderMail, subject, Message, resetLink) => {
  const info = await transporter.sendMail({
    from: '"HireSmart" <naseebnoman39@gmail.com>',
    to: senderMail,
    subject: subject,
    text: Message, // Plain-text version of the message
    html: getResetPasswordTemplate(resetLink), // HTML version of the message
  });


  return info.messageId;
};

// send email verfication

const sendVerificationMail = async (senderMail, subject, Message, verificationLink) => {

  const info = await transporter.sendMail({
    from: '"HireSmart" <naseebnoman39@gmail.com>',
    to: senderMail,
    subject: subject,
    text: Message, // Plain-text version of the message
    html: sendVerficationTemplate(verificationLink), // HTML version of the message
  });


  return info.messageId;
};



export { sendMail, sendVerificationMail };

