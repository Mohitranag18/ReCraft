const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const Institution = require('../models/Institution');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Create product record (after blockchain transaction)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      blockchainId, 
      donationId, 
      donationBlockchainId, 
      productName, 
      productType, 
      description, 
      price, 
      images, 
      artisanWallet, 
      artisanName,
      transactionHash,
      blockNumber
    } = req.body;

    // Verify NGO
    const ngo = await NGO.findById(req.user.id);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    // Verify donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.ngoId.toString() !== ngo._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized: You did not accept this donation' });
    }

    // Create product
    const product = new Product({
      blockchainId,
      donationId: donation._id,
      donationBlockchainId,
      productName,
      productType,
      description,
      price,
      images: images || [],
      ngoId: ngo._id,
      ngoWallet: ngo.walletAddress,
      artisanWallet: artisanWallet?.toLowerCase(),
      artisanName,
      institutionId: donation.institutionId,
      institutionWallet: donation.institutionWallet,
      transactionHash,
      blockNumber
    });

    await product.save();

    // Update donation status
    donation.status = 'Crafted';
    await donation.save();

    // Update NGO stats
    ngo.totalProductsCrafted += 1;
    await ngo.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// Get all available products (marketplace)
router.get('/marketplace', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, search } = req.query;

    let query = { sold: false };

    if (type) {
      query.productType = type;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('ngoId', 'name walletAddress')
      .populate('institutionId', 'name type')
      .populate('donationId', 'materialType quantity')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID with full traceability
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('ngoId', 'name walletAddress address description')
      .populate('institutionId', 'name type address')
      .populate('donationId', 'materialType quantity description createdAt');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product after purchase (blockchain callback)
router.patch('/:id/purchase', async (req, res) => {
  try {
    const { buyerWallet, transactionHash, blockNumber, revenue, paymentMethod } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.sold) {
      return res.status(400).json({ error: 'Product already sold' });
    }

    // Update product
    product.sold = true;
    product.soldAt = new Date();
    product.buyerWallet = buyerWallet.toLowerCase();
    product.transactionHash = transactionHash;
    product.blockNumber = blockNumber;
    product.revenue = revenue;
    product.paymentMethod = paymentMethod; // Save the payment method

    await product.save();

    // Update donation status
    await Donation.findByIdAndUpdate(product.donationId, { status: 'Sold' });

    // Update NGO revenue
    await NGO.findByIdAndUpdate(product.ngoId, {
      $inc: { totalRevenue: revenue.ngoShare }
    });

    // Update Institution revenue
    await Institution.findByIdAndUpdate(product.institutionId, {
      $inc: { totalRevenue: revenue.institutionShare }
    });

    res.json({
      message: 'Product purchase recorded successfully',
      product
    });
  } catch (error) {
    console.error('Product purchase error:', error);
    res.status(500).json({ error: 'Failed to record purchase', details: error.message });
  }
});

// Get products by NGO
router.get('/ngo/:ngoId', async (req, res) => {
  try {
    const products = await Product.find({ ngoId: req.params.ngoId })
      .populate('institutionId', 'name')
      .populate('donationId', 'materialType quantity')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by institution
router.get('/institution/:institutionId', async (req, res) => {
  try {
    const products = await Product.find({ institutionId: req.params.institutionId })
      .populate('ngoId', 'name')
      .populate('donationId', 'materialType quantity')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;
