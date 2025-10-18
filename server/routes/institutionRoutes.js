const express = require('express');
const router = express.Router();
const Institution = require('../models/Institution');
const Donation = require('../models/Donation');
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

// Register institution
router.post('/register', async (req, res) => {
  try {
    const { name, type, email, password, walletAddress, address, contactPerson } = req.body;

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({ 
      $or: [{ email }, { walletAddress: walletAddress.toLowerCase() }] 
    });
    
    if (existingInstitution) {
      return res.status(400).json({ error: 'Institution already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new institution
    const institution = new Institution({
      name,
      type,
      email,
      password: hashedPassword,
      walletAddress: walletAddress.toLowerCase(),
      address,
      contactPerson
    });

    await institution.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: institution._id, walletAddress: institution.walletAddress, role: 'institution' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Institution registered successfully',
      token,
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        walletAddress: institution.walletAddress
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login institution
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const institution = await Institution.findOne({ email });
    if (!institution) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, institution.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: institution._id, walletAddress: institution.walletAddress, role: 'institution' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        walletAddress: institution.walletAddress
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get institution profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const institution = await Institution.findById(req.user.id).select('-password');
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    res.json(institution);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get institution donations
router.get('/donations', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ institutionId: req.user.id })
      .populate('ngoId', 'name walletAddress')
      .sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    console.error('Donations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Create donation record (after blockchain transaction)
router.post('/donations', authenticateToken, async (req, res) => {
  try {
    const { blockchainId, materialType, quantity, unit, description, images, transactionHash, blockNumber } = req.body;

    const institution = await Institution.findById(req.user.id);
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const donation = new Donation({
      blockchainId,
      institutionId: institution._id,
      institutionWallet: institution.walletAddress,
      materialType,
      quantity,
      unit: unit || 'sheets',
      description,
      images: images || [],
      transactionHash,
      blockNumber
    });

    await donation.save();

    // Update institution total donations
    institution.totalDonations += 1;
    await institution.save();

    res.status(201).json({
      message: 'Donation recorded successfully',
      donation
    });
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(500).json({ error: 'Failed to create donation record', details: error.message });
  }
});

// Get donation by ID
router.get('/donations/:id', authenticateToken, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('institutionId', 'name email')
      .populate('ngoId', 'name email');
    
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json(donation);
  } catch (error) {
    console.error('Donation fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch donation' });
  }
});

module.exports = router;