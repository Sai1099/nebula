const express = require('express');
const multer = require('multer');
const csv = require('fast-csv');
const mongoose = require('mongoose');
const path = require('path');

const router = express.Router();
const app= express()
app.set('view engine', 'ejs');

const TeamSchema = new mongoose.Schema({
  name: String,
  collegeName: String,
  rollNo: String,
  gmail: String,
  phone: String,
  token: {
    type: String,
    default: function () {
      return generateRandomToken();
    },
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  acceptanceCode: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      return generateRandomAcceptanceCode(10);
    },
  },
});
  
  


const Team = mongoose.model('Team', TeamSchema);

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


router.get('/upload', isAuthenticated, (req, res) => {
  res.set('Cache-Control', 'no-store'); // or 'no-cache'
  res.render('upload_csv');
 });
 

 router.post('/upload', isAuthenticated, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileBuffer = req.file.buffer.toString();

    // Parse CSV and store records in the global variable
    records = await parseCSV(fileBuffer);

    if (!records || records.length === 0) {
      return res.status(400).send('No valid records found in the CSV file.');
    }

    // Save records to MongoDB using the Mongoose model (Team)
    const adminToken = generateRandomToken();

    for (const record of records) {
      const { isVerified, token } = adminToken;
      record.token = token;
      record.isVerified = isVerified;
      await Team.create(record);
    }
    //await Team.insertMany(records);
    req.session.adminToken = records[0].token; 
    // Set a session variable to indicate that the user has uploaded a CSV
    req.session.uploadedCSV = true;

    // Use 303 See Other status to redirect after POST
    res.redirect(303, '/csv-importer/display');
  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).send('Internal Server Error');
  }
});


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
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }

    // Delete all records from the MongoDB collection using Mongoose
    await Team.deleteMany({});
    await TeamMember.deleteMany({});
    // Redirect to the display page or any other appropriate page
    res.redirect('/display');
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
function generateRandomToken() {
  return Math.random().toString(36).substring(7);
}

module.exports = router;
