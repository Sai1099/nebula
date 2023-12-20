const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');

const app = express();

// Connect to MongoDB Atlas
mongoose.connect('mongodb://sai:nebula123@cluster0.l9c5xyp.mongodb.net/test?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB Connection Error:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

// Define the Team model
const Team = mongoose.model('teams', {
  name: String,
  collegeName: String,
  rollNo: String,
  gmail: String,
  phone: String,
  token: String,
});

// Passport setup
app.use(session({ secret: '0499544725f45b3b3f2a00b498e26bb396cc936e1e3a6cc6dd495a59584cd29b', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Define the Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: '772787922-vhcqcla66i15hqduocfgb6c9jga9et09.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    username: profile.displayName,
    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
  };
  return done(null, user);
}));

// Set the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serialize and deserialize user functions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Use Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
  try {
    const { id, displayName, emails } = req.user;
    const email = emails && emails.length > 0 ? emails[0].value : null;

    // Check if the user exists in the "teams" collection
    const userInTeams = await Team.findOne({ gmail: email });

    if (!userInTeams) {
      return res.send('User not found');
    }

    // Assuming you have a "dashboard" template for rendering the user dashboard
    res.render('dashboard', { user: req.user });
  } catch (error) {
    console.error('Authentication Callback Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Render the login form
app.get('/login', (req, res) => {
  res.render('login');
});

// Process the login form
app.post('/login', async (req, res) => {
  try {
    const userEmail = req.body.email;

    // Check if the user exists in the "teams" collection
    const userInTeams = await Team.findOne({ gmail: userEmail });

    if (!userInTeams) {
      return res.status(404).send('User not found');
    }

    // Assuming you have a "dashboard" template for rendering the user dashboard
    res.render('dashboard', { user: { email: userEmail } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
