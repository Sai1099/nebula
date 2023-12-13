// csv_importer.js

const express = require('express');
const multer = require('multer');
const csv = require('fast-csv');
const mongoose = require('mongoose');
const path = require('path'); 

const app = express();
const router = express.Router();



app.set('view engine', 'ejs');

const TeamSchema = new mongoose.Schema({
  name: String,
  collegeName: String,
  rollNo: String,
  phone: String,
});

const Team = mongoose.model('Team', TeamSchema);







const isAuthenticated = require(path.join(__dirname, '..', 'middleware', 'isAuthenticated'));


let records = [];



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.get('/upload', isAuthenticated, (req, res) => {
  res.render('upload_csv');
});



    
    // Function to parse CSV
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
    
        // Save records to MongoDB or perform other actions
        // ...
    
        res.render('display_csv', { records, successMessage: 'CSV file uploaded and data saved successfully!' });
      } catch (error) {
        console.error('Error uploading CSV:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    // Function to parse CSV
    async function parseCSV(csvString) {
      return new Promise((resolve, reject) => {
        const parsedRecords = [];
        csv.fromString(csvString, { headers: true })
          .on('data', (data) => parsedRecords.push(data))
          .on('end', () => resolve(parsedRecords))
          .on('error', (error) => reject(error));
      });
    }
 router.get('/display', isAuthenticated, async (req, res) => {
      try {
        const records = await Team.find({});
        res.render('display_csv', { records, successMessage: '' });
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

    // ... (Remaining code for deleting all records)

    res.redirect('/display');
  } catch (error) {
    console.error('Error deleting all records:', error);
    res.status(500).send('Internal Server Error');
  }
});





async function parseCSV(csvString) {
  return new Promise((resolve, reject) => {
    const parsedRecords = [];
    csv.fromString(csvString, { headers: true })
      .on('data', (data) => parsedRecords.push(data))
      .on('end', () => resolve(parsedRecords))
      .on('error', (error) => reject(error));
  });
}


module.exports = router;
