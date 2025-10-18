const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  blockchainId: {
    type: Number,
    required: true,
    unique: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  institutionWallet: {
    type: String,
    required: true,
    lowercase: true
  },
  materialType: {
    type: String,
    required: [true, 'Material type is required'],
    enum: ['paper', 'cardboard', 'notebooks', 'magazines', 'newspapers', 'mixed']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  unit: {
    type: String,
    default: 'sheets',
    enum: ['sheets', 'kg', 'units', 'boxes']
  },
  description: {
    type: String,
    maxlength: 500
  },
  images: [{
    type: String // URLs to images (IPFS or cloud storage)
  }],
  status: {
    type: String,
    enum: ['Available', 'Accepted', 'Crafted', 'Sold'],
    default: 'Available'
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO'
  },
  ngoWallet: {
    type: String,
    lowercase: true
  },
  acceptedAt: {
    type: Date
  },
  transactionHash: {
    type: String
  },
  blockNumber: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes
donationSchema.index({ status: 1 });
donationSchema.index({ institutionId: 1 });
donationSchema.index({ ngoId: 1 });
donationSchema.index({ blockchainId: 1 });

module.exports = mongoose.model('Donation', donationSchema);