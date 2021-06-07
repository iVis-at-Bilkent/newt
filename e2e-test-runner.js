// e2e-run-tests.js
const cypress = require('cypress')
const fs = require('fs');
const nodeMailer = require('nodemailer');

function sendEmail(msg) {
  console.log('process.env.newtforminerva_pwd: ', process.env.newtforminerva_pwd);
  let transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      // should be replaced with real sender's account
      user: 'newtforminerva@gmail.com',
      pass: process.env.newtforminerva_pwd
    }
  });
  let mailOptions = {
    // should be replaced with real recipient's account
    //to: 'replyto.lcsb.gitlab+minerva-core-499-3hxqgkf3oh3yq2zb9veolqjo6-issue@gmail.com',
    to: "newteditor@gmail.com",
    subject: "Error in end-to-end test of newt",
    text: msg,
    attachments: []
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    process.exit(0);
  });
}

cypress.run({ headless: true, browser: 'chrome', record: true, key: process.env.CYPRESS_RECORD_KEY })
  .then(result => {
    if (result.totalFailed > 0) {
      console.log('Failure(s) in tests! Will send an e-mail')
      const msg = `There is error in this test. This test should be recorded in cypress dashboard. You can check it from https://dashboard.cypress.io/projects/m5jo3x/`;
      sendEmail(msg);
    } else {
      process.exit(0);
    }
  })
  .catch(err => {
    fs.writeFileSync('Newt-e2e-test-results.txt', JSON.stringify(err, null, 2));
    process.exit(0);
  });