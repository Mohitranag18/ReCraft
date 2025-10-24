const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Product = require('../models/Product');

// @route   GET /api/donations/:id
// @desc    Get a single donation by ID and its associated product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donationId = req.params.id;
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Find the product associated with this donation
    const product = await Product.findOne({ donationId: donation._id });

    res.json({ donation, product });
  } catch (error) {
    console.error('Error fetching donation and product data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
