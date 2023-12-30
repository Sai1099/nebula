require('dotenv').config();
const express = require('express');
const multer = require('multer');
const csv = require('fast-csv');
const mongoose = require('mongoose');
const path = require('path');
const nodemailer = require('nodemailer'); 
const hCaptcha = require('hcaptcha');
const router = express.Router();
const app = express();
const Team = require('../models/Team.js');
app.set('view engine', 'ejs');

const isAuthenticated = require(path.join(__dirname, '..', 'middleware', 'isAuthenticated'));

let records = [];

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
function generateRandomToken() {
  const isVerified = Math.random() < 0.8; // Adjust the verification probability as needed
  const token = isVerified ? Math.random().toString(36).substring(7) : null;
  return { isVerified, token };
}

function generateRandomAcceptanceCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let acceptanceCode = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    acceptanceCode += characters.charAt(randomIndex);
  }

  return acceptanceCode;
}
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  },
});


function generateRandomTokenAndAcceptanceCode() {
  const isVerified = Math.random() < 0.8;
  const token = Math.random().toString(36).substring(7);
  const acceptanceCode = generateRandomAcceptanceCode(10);

  return { isVerified, token, acceptanceCode };
}



// hCaptcha site key and secret key, replace with your own keys
const hCaptchaSiteKey = process.env.HCAPTCHA_SITE_KEY;
const hCaptchaSecretKey = process.env.HCAPTCHA_SECRET_KEY;

router.get('/upload', isAuthenticated, (req, res) => {
  res.set('Cache-Control', 'no-store'); // or 'no-cache'
  res.render('upload_csv');
});




 router.post('/upload', isAuthenticated, upload.single('csvFile'), async (req, res) => {
  try {
    if (req.session.uploadedCSV) {
      // CSV has already been uploaded, redirect to display page
      return res.redirect('/csv-importer/display');
    }

    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileBuffer = req.file.buffer.toString();

    // Parse CSV and store records in the global variable
    records = await parseCSV(fileBuffer);

    if (!records || records.length === 0) {
      return res.status(400).send('No valid records found in the CSV file.');
    }
    const existingRecords = await Team.find({});
    if (existingRecords && existingRecords.length > 0) {
      // Records already exist, redirect to the display page
      return res.redirect('/csv-importer/display');
    }


    // Save records to MongoDB using the Mongoose model (Team)
    const adminToken = generateRandomToken();

    for (const record of records) {
      const { isVerified, token, acceptanceCode } = generateRandomTokenAndAcceptanceCode();
      record.token = token;
      
      record.isVerified = isPaymentVerified; 
      record.acceptanceCode = acceptanceCode;
      await Team.create(record);
      sendEmailToTeamMember(record.gmail, record.acceptanceCode);
    }
     // Send email to team member
     
    

    // Send email to admin
    sendEmailToAdmin(req.user.email, adminToken);

    //await Team.insertMany(records);
    //req.session.adminToken = records[0].token; 
    req.session.adminToken = adminToken; 
    // Set a session variable to indicate that the user has uploaded a CSV
    req.session.uploadedCSV = true;

    // Use 303 See Other status to redirect after POST
    res.redirect(303, '/csv-importer/display');
  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).send('Internal Server Error');
  }
});
function sendEmailToTeamMember(email, acceptanceCode) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Acceptance Code Information',
    text: `Dear Team Member,\n\nYour acceptance code is: ${acceptanceCode}\n\nBest regards,\nThe Nebula Apparel Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email to team member:', error);
    } else {
      console.log('Email sent to team member:', info.response);
    }
  });
}





function sendEmailToAdmin(adminEmail, adminToken) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: adminEmail,
    subject: 'Admin Token Information',
    text: `Dear Admin,\n\nYour admin token is: ${adminToken}\n\nBest regards,\nThe Nebula Apparel Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email to admin:', error);
    } else {
      console.log('Email sent to admin:', info.response);
    }
  });
}



// Function to send email to admin


router.get('/display', isAuthenticated, async (req, res) => {
  try {
    // Fetch all records without using the adminToken
    const recordsFromDB = await Team.find({});
    res.render('display_csv', { records: recordsFromDB, successMessage: '' });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/delete-all', isAuthenticated, async (req, res) => {
  try {
    const token = req.body['h-captcha-response'];

    if (!token) {
      return res.status(400).send('hCaptcha verification failed.');
    }

    // Verify hCaptcha token
    const { success } = await hCaptcha.verify(hCaptchaSecretKey, token);

    if (!success) {
      return res.status(400).send('hCaptcha verification failed.');
    }

    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }

    // Delete all records from the MongoDB collection using Mongoose
    await Team.deleteMany({});
    await TeamMember.deleteMany({});
    // Redirect to the display page or any other appropriate page
    res.redirect('/upload');
  } catch (error) {
    console.error('Error deleting all records:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function parseCSV(csvString) {
  return new Promise((resolve, reject) => {
    const parsedRecords = [];
    csv.parseString(csvString, { headers: true })
      .on('data', (data) => parsedRecords.push(data))
      .on('end', () => resolve(parsedRecords))
      .on('error', (error) => reject(error));
  });
}







module.exports = router;
