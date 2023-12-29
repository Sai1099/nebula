const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  

    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: 'admin', // Default role is set to 'user'; change as needed
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String, // Change the type accordingly based on your token generation method
    },
  });
  
  
  const User = mongoose.model('users', userSchema);
  // In your route/controller where you fetch the user
  module.exports = User;