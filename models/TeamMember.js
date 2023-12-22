const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  // Your schema fields here

  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['Member', 'Leader'], // Example: Roles can be 'Member' or 'Leader'
    default: 'Member',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  acceptanceCode: {
    type: String,
    required: true,
    unique: true,
  },
  // Add more fields as needed
});


const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;
