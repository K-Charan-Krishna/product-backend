const nodemailer = require('nodemailer');

exports.sendMail = async (mailAddresses, subjectText, htmlText, attachments) => {
  console.log("In Send Mail");

  try {
    // Create the transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail', // Use 'service' instead of 'host' for providers like Gmail
      auth: {
        user: 'your_email@gmail.com',
        pass: 'your_app_password', // Use app password if using Gmail
      },
    });

    console.log("Created Transporter and setting mail options");

    // Set mail options
    let mailOptions = {
      from: 'your_email@gmail.com',
      to: mailAddresses,
      subject: subjectText,
      html: htmlText,
      attachments: attachments || [],
    };

    console.log("Mail Options set.....will send the mail now");

    // Send the email using await
    let info = await transporter.sendMail(mailOptions);
    console.log('Mail sent successfully to:', mailAddresses);
    console.log('Message ID:', info.messageId);

    return true;
  } catch (error) {
    console.error('Error sending mail:', error);
    return false;
  }
};
