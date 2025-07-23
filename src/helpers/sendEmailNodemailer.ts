// // import nodemailer from "nodemailer";
// // import config from "../config";
// // const sendEmailByNodemailer = async (
// //   to: string,
// //   subject: string,
// //   html: string,
// //   text?: string
// // ) => {
// //   // Create a transporter
// //   const transporter = nodemailer.createTransport({
// //     host: "smtp.gmail.com",
// //     service: "gmail",
// //     port: 587,
// //     secure: true,
// //     auth: {
// //       user: config.emailSender.email,
// //       pass: config.emailSender.app_pass,
// //     },
// //   });

// import config from "../config";

// //   // Email options
// //   const mailOptions = {
// //     from: config.emailSender.email,
// //     to,
// //     subject,
// //     html,
// //     text,
// //   };
// //   await transporter.sendMail(mailOptions);
// // };

// // export default sendEmailByNodemailer;

// import smtpTransporter from "nodemailer-smtp-transport";
// import nodemailer from "nodemailer";
// let sendEmailByNodemailer = async (
//   emailTo: string,
//   EmailSubject: string,

//   EmailHTML: string,
//     EmailText?: string,
// ) => {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.hostinger.com",
//     port: 587,
//     secure: false, // true for port 465
//     auth: {
//       user: config.emailSender.email, // info@probanesa.com
//       pass: config.emailSender.app_pass, // your email password
//     },
//   });

//   let mailOptions = {
//     from: `"Probanesa Service" <no-replay@probanesa.com>`,
//     to: emailTo,
//     subject: EmailSubject,
//     text: EmailText,
//     html: EmailHTML,
//   };

//   return await transporter.sendMail(mailOptions);
// };

// export default sendEmailByNodemailer;
