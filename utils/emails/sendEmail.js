const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      service: "",
      port: process.env.NODEMAILER_PORT,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_USER,
      to: options.email,
      subject: options.subject,
      html: options.html,
      cc: options.cc,
      dynamicTemplateData: options.data,
      templateId: options.templateId,
    });
    return "sent";
  } catch (error) {
    console.log("email not sent");
    console.log(error);
  }
};

module.exports = sendEmail;
