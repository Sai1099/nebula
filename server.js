const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const User = require('./models/User.js');
const paymentRoutes = require('./routes/payment');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
// Assuming you have a middleware for authentication
// Assuming you have a middleware for handling file uploads

const app = express();
// middleware/isAuthenticated.js
app.use(bodyParser.json());
app.use('/api/payment', paymentRoutes);
// Connect to MongoDB Atlas
const mongoDBURI='mongodb+srv://sai:nebula123@cluster0.l9c5xyp.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(mongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true });



// User schema and model
// Assuming your User model looks something like this

  

// Passport setup
app.use(session({ secret: '0499544725f45b3b3f2a00b498e26bb396cc936e1e3a6cc6dd495a59584cd29b', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());



passport.use(new GoogleStrategy({
    clientID: '772787922-vhcqcla66i15hqduocfgb6c9jga9et09.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {

    const user = {
      
      
      username: profile.displayName,
      emails: profile.emails,
      // Add any other relevant user information
    };
  
    return done(null, user);
  }
  ));
    // Save user profile in your database or perform other actions
   

// Serialize and deserialize user functions
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Use Passport middleware
app.use(passport.initialize());
app.use(passport.session());

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Use the Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
  try {
    // Retrieve user information from the Google profile
    const { id, displayName, emails } = req.user;
    const email = emails && emails.length > 0 ? emails[0].value : null;

    // Find the user in the database based on email
    const user = await User.findOne({ email });

    if (!user) {
      // If the user is not found, redirect to the upload letter page
      return res.redirect('/upload-letter');
    }

    if (!user.isVerified) {
      // If the user is not verified, display a message and possibly resend the verification email
      return res.send('Your account is under verification. Check your email for the verification link.');
    }

    // If the user is verified, redirect to the dashboard
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Authentication Callback Error:', error);
    res.status(500).send('Internal Server Error');
  }
  
});



app.get('/dashboard', isAuthenticated, (req, res) => {
  const user = req.user; // Assuming the user object is available in req.user after authentication

  res.render('dashboard', { user });
});





// ...

// Express middleware


// Routes

  
  app.get('/success', (req, res) => {
    res.send('Upload successful!'); // You can replace this with the content you want to display on the success page
  });
  






const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

  // Updated code for email verification

     
      
     app.get('/upload-letter', (req, res) => {
        res.sendFile(path.join(__dirname, 'verify-letter.html'));
      });
      


      app.post('/upload-letter', upload.single('letter'), isAuthenticated, async (req, res) => {
        try {
          // Check if the user is authenticated
          if (!req.isAuthenticated()) {
            return res.redirect('/');
          }
      
          // Fetch user information
          const user = req.user;
          const userEmail = user.emails && user.emails.length > 0 ? user.emails[0].value : 'Unknown';
          const userName = user.username || 'Unknown';
      
          // Implement your verification logic here
          const letterPath = req.file.path;
      
          // Implement logic to send verification email using Nodemailer
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'contact.nebulaapparel@gmail.com',
              pass: 'pgfksxpluzffqifj', // Replace with your Gmail password or an App Password
            },
          });
      
          const verificationToken = crypto.randomBytes(20).toString('hex');
      
          // Save the verification token to the new user in the database
          const newUser = new User({
            username: userName,
            email: userEmail,
            isVerified: false, // Set to false by default, update to true after verification
            verificationToken: verificationToken, // Include the verification token
          });
      
          await newUser.save();
      
          // Update the verification link with the token and username
          const verificationLink = `http://localhost:3000/verify-email/${userEmail}/${verificationToken}`;
      
          const mailOptions = {
            from: 'contact.nebulaapparel@gmail.com',
            to: 'contact.nebulaapparel@gmail.com',
            subject: `New Letter Uploaded - ${userName}`,
            text: `A new letter has been uploaded by ${userName} (${userEmail}). Please verify it by clicking the following link: ${verificationLink}`,
            attachments: [
              {
                filename: req.file.originalname,
                path: letterPath,
              },
            ],
          };
      
          // Send the email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending email:', error);
              res.status(500).send('Internal Server Error');
            } else {
              console.log('Email sent:', info.response);
              res.send('Letter uploaded successfully! Wait for verification.');
            }
          });
        } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
        }
      });
// Verification endpoint


// ... (Previous code)

// Verification endpoint
app.get('/verify-email/:email/:token', async (req, res) => {
  try {
    const email = req.params.email;
    const token = req.params.token;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the token matches the user's verificationToken
    if (user.verificationToken === token) {
      // Update the user's isVerified status
      user.isVerified = true;
      user.verificationToken = undefined; // Clear the verification token
      await user.save();
         
      // Send the verification success email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'contact.nebulaapparel@gmail.com',
          pass: 'pgfksxpluzffqifj', // Replace with your Gmail password or an App Password
        },
      });

      const mailOptions = {
        from: 'contact.nebulaapparel@gmail.com',
        to: user.email,
        subject: 'Account Verified Successfully',
        text: 'Your account has been successfully verified. You can now log in to access your dashboard.',
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          res.status(500).send('Internal Server Error');
        } else {
          console.log('Email sent:', info.response);
          res.send('Email verification successful! You can now log in.');
        }
      });
    } else {
      return res.status(403).send('Invalid verification token');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// ... (Remaining code)


app.get('/csv-importer', isAuthenticated, (req, res) => {
  res.redirect('/csv-importer/upload');
});


app.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    res.render('dashboard', { user });
  } else {
    res.redirect('/login');
  }
});
const csvImporterRouter = require('./routes/csv_imp'); // Adjust the path based on your project structure
app.use('/csv-importer', csvImporterRouter);
 

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
