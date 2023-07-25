const nodemailer = require('nodemailer');

const sendEmail =async (options) => {

  const transport = nodemailer.createTransport({

    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    auth : {
      user : process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }

  });

  const mailOptions = {
    from : '<pickorder@gmail.com>',
    to : options.email,
    subject : options.subject,
    html : options.html
  };

  if(await transport.sendMail(mailOptions)){
    return "sent";
  }else{
    return "error";
  }
};

module.exports = sendEmail;