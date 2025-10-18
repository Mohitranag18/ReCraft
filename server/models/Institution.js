const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['school', 'college', 'office', 'university', 'other'],
    required: [true, 'Institution type is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contactPerson: {
    name: String,
    phone: String,
    designation: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for geospatial queries
institutionSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('Institution', institutionSchema);