const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// MongoDB connection
mongoose.connect('mongodb+srv://sai:nebula123@cluster0.l9c5xyp.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema
const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  gmail: String,
});
const User = mongoose.model('User', userSchema, 'team_users');


// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      
    clientID: '772787922-vhcqcla66i15hqduocfgb6c9jga9et09.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    },async (accessToken, refreshToken, profile, done) => {
     
    
      
      try {
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '';
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

       
        const newUser = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          gmail: email,
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
      .exec()
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err, null);
      });
  });
// Express middleware
app.use(session({ secret: '0499544725f45b3b3f2a00b498e26bb396cc936e1e3a6cc6dd495a59584cd29b', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<h1>Hello, ${req.user.displayName}</h1><p>Your Gmail ID: ${req.user.gmail}</p><a href="/logout">Logout</a>`);
  } else {
    res.redirect('/');
  }
});


const teamMemberSchema = new mongoose.Schema({
    // Define the fields for a team member
    name: String,
  collegeName: String,
  rollNo: String,
  gmail: String,
  phone: String,
  token: String,
  isVerified: Boolean, // Added isVerified field
  acceptanceCode: String,
    // ...
  });
  
  const TeamMember = mongoose.model('TeamMember', teamMemberSchema, 'teams'); // 'Team' is the collection name
  
  app.get('/verify-and-fetch', (req, res) => {
    const filePath = path.join(__dirname, 'verify-and-fetch.html');
    res.sendFile(filePath);
  });
  

  app.post('/verify-and-fetch', async (req, res) => {
    try {
      // Check if the request is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).send('Unauthorized');
      }
  
      // Get the acceptance code from the request body
      const acceptanceCode = req.body.acceptanceCode;
  
      if (!acceptanceCode) {
        return res.json({ success: false, message: 'Acceptance code is required.' });
      }
  
      // Assuming you store the user's Gmail in the profile
      const teamMember = await TeamMember.findOne({ gmail: req.user.gmail, acceptanceCode: acceptanceCode, isVerified: true });
  
      if (teamMember) {
        res.json({ success: true, teamMember });
      } else {
        // Check if the team member with the given Gmail exists in the database
        const userExists = await TeamMember.findOne({ gmail: req.user.gmail });
  
        if (!userExists) {
          return res.json({ success: false, message: 'User not found.' });
        }
  
        res.json({ success: false, message: 'Verification failed.' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
