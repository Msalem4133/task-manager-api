const sgMail = require('@sendgrid/mail');

;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEamil = (email, name) => {
  sgMail.send({
    to: email,
    from: 'ahmed.salen413@gmail.com',
    subject: 'Thanks to joining in',
    text: `Welcome to app, ${name} name .Let me know how you get`
  });
};

const sendCancelationEamil = (email, name) => {
  sgMail.send({
    to: email,
    from: 'ahmed.salen413@gmail.com',
    subject: 'sorry to see you go',
    text: `Goodbye, ${name}.I hope to see you back`
  });
};

module.exports = {
  sendWelcomeEamil,
  sendCancelationEamil
};
