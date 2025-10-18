const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'NGO name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true
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
  description: {
    type: String,
    maxlength: 1000
  },
  artisans: [{
    name: String,
    walletAddress: String,
    specialization: String,
    joinedDate: Date
  }],
  verified: {
    type: Boolean,
    default: false
  },
  totalProductsCrafted: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

// Index for geospatial queries
ngoSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('NGO', ngoSchema);