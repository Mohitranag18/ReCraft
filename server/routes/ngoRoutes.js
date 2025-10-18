const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');
const Donation = require('../models/Donation');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Register NGO
router.post('/register', async (req, res) => {
  try {
    const { name, registrationNumber, email, password, walletAddress, address, contactPerson, description } = req.body;

    // Check if NGO already exists
    const existingNGO = await NGO.findOne({ 
      $or: [{ email }, { walletAddress: walletAddress.toLowerCase() }, { registrationNumber }] 
    });
    
    if (existingNGO) {
      return res.status(400).json({ error: 'NGO already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new NGO
    const ngo = new NGO({
      name,
      registrationNumber,
      email,
      password: hashedPassword,
      walletAddress: walletAddress.toLowerCase(),
      address,
      contactPerson,
      description
    });

    await ngo.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: ngo._id, walletAddress: ngo.walletAddress, role: 'ngo' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'NGO registered successfully',
      token,
      ngo: {
        id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        walletAddress: ngo.walletAddress
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login NGO
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const ngo = await NGO.findOne({ email });
    if (!ngo) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, ngo.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: ngo._id, walletAddress: ngo.walletAddress, role: 'ngo' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      ngo: {
        id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        walletAddress: ngo.walletAddress
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get NGO profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user.id).select('-password');
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }
    res.json(ngo);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get available donations nearby
router.get('/donations/available', authenticateToken, async (req, res) => {
  try {
    const { radius = 50 } = req.query; // Default 50km radius
    
    const ngo = await NGO.findById(req.user.id);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    let query = { status: 'Available' };

    // If NGO has coordinates, find nearby donations
    if (ngo.address?.coordinates?.latitude && ngo.address?.coordinates?.longitude) {
      const donations = await Donation.find(query)
        .populate('institutionId', 'name address')
        .sort({ createdAt: -1 });
      
      res.json(donations);
    } else {
      // Return all available donations if no location
      const donations = await Donation.find(query)
        .populate('institutionId', 'name address')
        .sort({ createdAt: -1 });
      
      res.json(donations);
    }
  } catch (error) {
    console.error('Donations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Update donation status after accepting on blockchain
router.patch('/donations/:donationId/accept', authenticateToken, async (req, res) => {
  try {
    const { transactionHash, blockNumber } = req.body;
    
    const ngo = await NGO.findById(req.user.id);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    const donation = await Donation.findById(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.status !== 'Available') {
      return res.status(400).json({ error: 'Donation is not available' });
    }

    // Update donation
    donation.status = 'Accepted';
    donation.ngoId = ngo._id;
    donation.ngoWallet = ngo.walletAddress;
    donation.acceptedAt = new Date();
    donation.transactionHash = transactionHash;
    donation.blockNumber = blockNumber;

    await donation.save();

    res.json({
      message: 'Donation accepted successfully',
      donation
    });
  } catch (error) {
    console.error('Donation accept error:', error);
    res.status(500).json({ error: 'Failed to accept donation', details: error.message });
  }
});

// Get NGO's accepted donations
router.get('/donations', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ ngoId: req.user.id })
      .populate('institutionId', 'name email address')
      .sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    console.error('Donations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Add artisan to NGO
router.post('/artisans', authenticateToken, async (req, res) => {
  try {
    const { name, walletAddress, specialization } = req.body;

    const ngo = await NGO.findById(req.user.id);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    ngo.artisans.push({
      name,
      walletAddress: walletAddress.toLowerCase(),
      specialization,
      joinedDate: new Date()
    });

    await ngo.save();

    res.status(201).json({
      message: 'Artisan added successfully',
      artisans: ngo.artisans
    });
  } catch (error) {
    console.error('Artisan add error:', error);
    res.status(500).json({ error: 'Failed to add artisan', details: error.message });
  }
});

// Get NGO artisans
router.get('/artisans', authenticateToken, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user.id).select('artisans');
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }
    res.json(ngo.artisans);
  } catch (error) {
    console.error('Artisans fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch artisans' });
  }
});

module.exports = router;