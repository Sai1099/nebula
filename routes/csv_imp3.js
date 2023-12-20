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
  token: String,
  
});

const Team = mongoose.model('Team', TeamSchema);

const isAuthenticated = require(path.join(__dirname, '..', 'middleware', 'isAuthenticated'));

let records = [];

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
    await Team.insertMany(records);

    // Set a session variable to indicate that the user has uploaded a CSV
    req.session.uploadedCSV = true;
    const adminToken = generateRandomToken();
    records.forEach(async (record) => {
      record.token = adminToken;
      await Team.create(record);
    });
    // Use 303 See Other status to redirect after POST
    res.redirect(303, '/csv-importer/display');
  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/display', isAuthenticated, async (req, res) => {
  try {
    const adminToken = req.session.adminToken;
    const recordsFromDB = await Team.find({ token: adminToken });
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
