const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  blockchainId: {
    type: Number,
    required: true,
    unique: true
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donationBlockchainId: {
    type: Number,
    required: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  productType: {
    type: String,
    required: [true, 'Product type is required'],
    enum: ['decor', 'frame', 'lamp', 'basket', 'coaster', 'notebook', 'gift-box', 'other']
  },
  description: {
    type: String,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'PYUSD'
  },
  images: [{
    type: String // URLs to product images
  }],
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO',
    required: true
  },
  ngoWallet: {
    type: String,
    required: true,
    lowercase: true
  },
  artisanWallet: {
    type: String,
    lowercase: true
  },
  artisanName: {
    type: String
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
  sold: {
    type: Boolean,
    default: false
  },
  soldAt: {
    type: Date
  },
  buyerWallet: {
    type: String,
    lowercase: true
  },
  transactionHash: {
    type: String
  },
  blockNumber: {
    type: Number
  },
  revenue: {
    ngoShare: Number,
    institutionShare: Number,
    platformShare: Number,
    total: Number
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ sold: 1 });
productSchema.index({ ngoId: 1 });
productSchema.index({ institutionId: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ blockchainId: 1 });

module.exports = mongoose.model('Product', productSchema);