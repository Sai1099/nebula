const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: String,
  collegeName: String,
  rollNo: String,
  gmail: String,
  phone: String,
  profilePic: String, // Add profile picture field
  instagramBio: String,
  bio: String,
  customFields: { type: Map, of: String },
  token: {
    type: String,
    default: function () {
      return generateRandomToken();
    },
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: true,
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

// Define other necessary functions used in the schema, such as generateRandomToken and generateRandomAcceptanceCode

const Team = mongoose.model('teams', teamSchema);

module.exports = Team;