const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    gmail: String,
    acceptanceCode: String,
  });
  const User = mongoose.model('User', userSchema, 'team_users');
  module.exports = User;