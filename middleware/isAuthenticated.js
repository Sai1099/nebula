const express = require('express');
const multer = require('multer');
const csv = require('fast-csv');
const mongoose = require('mongoose');
const path = require('path'); 
const router = express.Router();

//const isAuthenticated = require(path.join(__dirname, '..', 'middleware', 'isAuthenticated'));
// ... (Other code)



  const isAuthenticated = (req, res, next) => {
    // Check if the user is authenticated
    if (req.isAuthenticated()) {
      return next();
    }
  
    // If not authenticated, redirect to login page or handle as needed
    res.redirect('/login'); // You can customize the redirect URL
  };

  module.exports = isAuthenticated;