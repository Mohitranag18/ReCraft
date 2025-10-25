# 🌱 ReCraft - Sustainable Upcycling Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blue)](https://sepolia.etherscan.io/)
[![PYUSD](https://img.shields.io/badge/Payment-PYUSD-00457C)](https://www.paypal.com/pyusd)
[![Avail Nexus](https://img.shields.io/badge/Bridge-Avail%20Nexus-purple)](https://www.availproject.org/)

> **Transforming waste into wonder through blockchain-powered sustainable commerce**

ReCraft is a decentralized platform connecting institutions (schools, colleges, offices) with NGOs and artisans to transform discarded materials into beautiful, sustainable home décor products. Built on Ethereum with complete traceability, transparent revenue distribution, and cross-chain payment capabilities.

---

## 🎯 Mission & Impact

### Environmental Impact
♻️ **Reduce Waste**: Convert discarded paper and materials into valuable products  
🌍 **Carbon Footprint**: Track and minimize environmental impact through blockchain transparency  
📊 **Measurable Results**: Every donation and product creation is permanently recorded on-chain

### Social Impact
💰 **Fair Income**: 70% of revenue goes directly to NGOs and artisans  
🤝 **Empower Communities**: Create sustainable livelihood opportunities  
🔍 **Complete Transparency**: Smart contract-enforced revenue distribution (70% NGO/Artisan, 20% Institution, 10% Platform)

### Technical Innovation
⛓️ **Cross-Chain Payments**: Pay with ETH from multiple chains using Avail Nexus  
💵 **Stablecoin Support**: PYUSD integration for price stability  
🔐 **Blockchain Verified**: Immutable traceability from donation to final product

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌉 **Cross-Chain Bridge** | Pay from Optimism, Arbitrum, or Base Sepolia using Avail Nexus |
| 💳 **Multi-Payment** | Accept both ETH and PYUSD stablecoin |
| 📦 **Donation Tracking** | Real-time status updates from donation to product sale |
| 🎨 **Product Marketplace** | Discover and purchase sustainable home décor |
| 💰 **Auto Revenue Split** | Smart contract distribution: 70% NGO, 20% Institution, 10% Platform |
| 🔍 **Full Traceability** | View complete product journey on blockchain |
| 👛 **Wallet Integration** | Seamless MetaMask and multi-chain wallet support |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ReCraft Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Institutions │  │     NGOs     │  │    Buyers    │      │
│  │   (Donors)   │  │  (Crafters)  │  │ (Consumers)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │           React Frontend (Vite + Wagmi)            │    │
│  │  • ConnectKit Wallet Integration                    │    │
│  │  • Avail Nexus Provider                            │    │
│  │  • Cross-Chain Purchase Widget                     │    │
│  └─────────────────────────┬──────────────────────────┘    │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │        Node.js Backend (Express + MongoDB)         │    │
│  │  • JWT Authentication                               │    │
│  │  • API Routes & Business Logic                     │    │
│  │  • Off-chain Data Storage                          │    │
│  └─────────────────────────┬──────────────────────────┘    │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │      Ethereum Smart Contract (Sepolia)             │    │
│  │  • Donation Management                              │    │
│  │  • Product Creation                                 │    │
│  │  • Purchase & Revenue Distribution                 │    │
│  │  • ETH & PYUSD Payment Processing                  │    │
│  └─────────────────────────┬──────────────────────────┘    │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │          External Integrations                      │    │
│  │  • Avail Nexus (Cross-chain bridging)             │    │
│  │  • PYUSD Token (Stablecoin payments)              │    │
│  │  • Ethers.js (Blockchain interaction)             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ReCraft/
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── components/              # React Components
│   │   │   ├── CrossChainPurchaseWidget.jsx  # Avail Nexus integration
│   │   │   ├── Marketplace.jsx              # Product marketplace
│   │   │   ├── ProductCard.jsx              # Product display
│   │   │   ├── InstitutionDashboard.jsx     # Donor interface
│   │   │   ├── NGODashboard.jsx             # Crafter interface
│   │   │   └── ...
│   │   ├── providers/               # Context Providers
│   │   │   ├── Web3Provider.jsx            # Wagmi + ConnectKit setup
│   │   │   └── NexusProvider.jsx           # Avail Nexus SDK
│   │   ├── contracts/               # Contract ABIs
│   │   │   └── ReCraftABI.json
│   │   ├── App.jsx                  # Main application
│   │   └── main.jsx                 # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js Backend
│   ├── models/                      # MongoDB Models
│   │   ├── Institution.js
│   │   ├── NGO.js
│   │   ├── Donation.js
│   │   └── Product.js
│   ├── routes/                      # API Routes
│   │   ├── institutions.js
│   │   ├── ngos.js
│   │   ├── products.js
│   │   └── blockchain.js
│   ├── middleware/                  # Express Middleware
│   │   └── auth.js
│   ├── server.js                    # Main server file
│   ├── .env.example                 # Environment template
│   └── package.json
│
├── contracts/                       # Smart Contract (Deployed via Remix)
│   └── ReCraft.sol                  # Main contract
│
└── README.md                        # You are here!
```

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18+ and npm
- **MongoDB** (local or cloud instance)
- **MetaMask** browser extension
- **Git**

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Mohitranag18/ReCraft.git
cd ReCraft
```

### 2️⃣ Smart Contract Deployment

The smart contract is deployed on **Ethereum Sepolia Testnet** using Remix IDE.

**Contract Address:** `[YOUR_CONTRACT_ADDRESS]`

**View on Etherscan:** `https://sepolia.etherscan.io/address/[YOUR_CONTRACT_ADDRESS]`

> 💡 **Note:** No local blockchain setup required. The contract is already deployed and verified on Sepolia.

### 3️⃣ Backend Setup

```bash
cd server
npm install

# Create environment file
cp .env.example .env
```

**Edit `.env` file:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/recraft
JWT_SECRET=your_super_secret_jwt_key_change_this
CONTRACT_ADDRESS=0x...  # Your deployed contract address
PYUSD_TOKEN_ADDRESS=0x... # PYUSD token on Sepolia
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NETWORK=sepolia
```

**Start MongoDB** (if running locally):
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Start the server:**
```bash
npm run dev
```
✅ Server running on `http://localhost:5000`

### 4️⃣ Frontend Setup

```bash
cd ../client
npm install

# Create environment file
cp .env.example .env
```

**Edit `.env` file:**
```env
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0x...  # Your deployed contract address
VITE_PYUSD_TOKEN_ADDRESS=0x... # PYUSD token on Sepolia
VITE_NETWORK=sepolia
```

**Start the frontend:**
```bash
npm run dev
```
✅ Frontend running on `http://localhost:5173`

---

## 🎮 User Flows

### 🏫 For Institutions (Donors)

1. **Register** → Create account and connect MetaMask wallet
2. **Create Donation** → List discarded materials (paper, notebooks, cardboard)
3. **Track Progress** → Monitor donation status: `Available` → `Accepted` → `Crafted` → `Sold`
4. **Earn Revenue** → Automatically receive 20% of product sales

### 🏘️ For NGOs (Crafters)

1. **Register** → Create account with registration number
2. **Browse Donations** → View available donations from institutions
3. **Accept Donation** → Claim materials via blockchain transaction
4. **Create Products** → Craft items and list on marketplace
5. **Earn Revenue** → Receive 70% of sales (split with artisans if applicable)
6. **Manage Artisans** → Add artisan wallets for revenue sharing

### 🛒 For Buyers (Consumers)

1. **Browse Marketplace** → Explore sustainable home décor products
2. **View Traceability** → See complete product journey from source institution
3. **Connect Wallet** → Use MetaMask or any Web3 wallet
4. **Choose Payment Method:**
   - 💎 **Direct ETH** (on Sepolia)
   - 🌉 **Cross-Chain ETH** (bridge from Optimism/Arbitrum/Base)
   - 💵 **PYUSD Stablecoin**
5. **Complete Purchase** → Revenue automatically distributed on-chain

---

## 🔗 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Institutions
```http
POST   /institutions/register        # Register new institution
POST   /institutions/login           # Login
GET    /institutions/profile         # Get profile (auth)
POST   /institutions/donations       # Create donation
GET    /institutions/donations       # List donations
```

#### NGOs
```http
POST   /ngos/register                # Register new NGO
POST   /ngos/login                   # Login
GET    /ngos/profile                 # Get profile (auth)
GET    /ngos/donations/available     # Browse donations
PATCH  /ngos/donations/:id/accept    # Accept donation
POST   /ngos/artisans                # Add artisan
```

#### Products
```http
GET    /products/marketplace         # Public marketplace
GET    /products/:id                 # Product details
POST   /products                     # Create product (auth)
PATCH  /products/:id/purchase        # Record purchase
```

#### Blockchain
```http
GET    /blockchain/contract-info     # Contract details
GET    /blockchain/donations/:id     # Get donation from chain
GET    /blockchain/products/:id      # Get product from chain
POST   /blockchain/verify-signature  # Verify wallet signature
```


---

## 📊 Smart Contract Interface

### Main Functions

#### For Institutions
```solidity
function createDonation(
    string memory materialType,
    uint256 quantity
) public returns (uint256)
```
Creates a donation record on blockchain.

#### For NGOs
```solidity
function acceptDonation(uint256 donationId) public
```
Accept an available donation.

```solidity
function createProduct(
    uint256 donationId,
    string memory productName,
    string memory productType,
    uint256 price,
    address artisan
) public returns (uint256)
```
Create a product from accepted donation.

#### For Buyers
```solidity
function purchaseProductWithETH(uint256 productId) public payable
```
Purchase product with native ETH.

```solidity
function purchaseProductWithPYUSD(uint256 productId) public
```
Purchase product with PYUSD stablecoin.

### Revenue Distribution
Automated 70/20/10 split executed on-chain:
- **70%** → NGO/Artisan
- **20%** → Institution
- **10%** → Platform

---

## 🌉 Cross-Chain Integration (Avail Nexus)

ReCraft integrates **Avail Nexus SDK** to enable seamless cross-chain payments.

### Supported Source Chains
- ✅ Optimism Sepolia
- ✅ Arbitrum Sepolia
- ✅ Base Sepolia

### How It Works
1. User selects source chain where they have ETH
2. Enter amount (must cover product price + fees)
3. SDK simulates bridge + execute transaction
4. User approves transaction
5. ETH bridges to Sepolia + product purchase executes automatically
6. Done! 🎉

### Implementation Example
```javascript
import { useNexus } from '../providers/NexusProvider';

const { nexusSdk } = useNexus();

const result = await nexusSdk.bridgeAndExecute({
  token: 'ETH',
  amount: bridgeAmount,
  fromChainId: SUPPORTED_CHAINS.OPTIMISM_SEPOLIA,
  toChainId: SUPPORTED_CHAINS.SEPOLIA,
  execute: {
    contractAddress,
    contractAbi: contractABI,
    functionName: 'purchaseProductWithETH',
    buildFunctionParams: () => ({
      functionParams: [productId]
    }),
    value: valueHex
  }
});
```


---

## 💵 PYUSD Integration

ReCraft accepts **PayPal USD (PYUSD)** for stable, dollar-pegged payments.

### Benefits
- 💹 **Price Stability**: No ETH volatility
- 🔄 **Easy Conversion**: 1 PYUSD = 1 USD
- 🌍 **Global Access**: PayPal ecosystem integration

### Payment Flow
1. System converts product price (ETH) to USD
2. User approves PYUSD spend (ERC-20 approval)
3. Contract transfers PYUSD from buyer
4. Revenue distributed in PYUSD to all parties

### Implementation
```javascript
// Approve PYUSD spend
const pyusdContract = new ethers.Contract(pyusdAddress, erc20ABI, signer);
await pyusdContract.approve(contractAddress, priceInPYUSD);

// Purchase product
const contract = new ethers.Contract(contractAddress, contractABI, signer);
await contract.purchaseProductWithPYUSD(productId);
```

> 💡 **PYUSD Token Address (Sepolia):** `0x...`

---

## 🧪 Testing Guide

### Test Network: Ethereum Sepolia

#### Get Test Funds
1. **SepoliaETH Faucet:** [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
2. **PYUSD Test Tokens:** [Contact for testnet PYUSD]

### Test Scenarios

#### 1. Institution Flow ✅
```bash
1. Register institution account
2. Connect MetaMask to Sepolia
3. Create donation (e.g., "Paper", 50 sheets)
4. View donation in dashboard
5. Check transaction on Sepolia Etherscan
```

#### 2. NGO Flow ✅
```bash
1. Register NGO with different wallet
2. Browse available donations
3. Accept donation (approve tx)
4. Create product from donation
5. Product appears in marketplace
```

#### 3. Buyer Flow ✅
```bash
# Test ETH Purchase
1. Open marketplace
2. Connect buyer wallet
3. Select product
4. Purchase with ETH
5. Verify revenue distribution

# Test PYUSD Purchase
1. Approve PYUSD spend
2. Purchase with PYUSD
3. Check all parties received funds

# Test Cross-Chain Purchase
1. Switch to Optimism Sepolia
2. Bridge ETH to Sepolia + purchase
3. Verify product ownership
```

---

## 🔐 Security Features

### Smart Contract
- ✅ Reentrancy guards on payment functions
- ✅ Access control (only NGO can create products from their donations)
- ✅ Input validation and require statements
- ✅ Safe math operations (Solidity 0.8+)
- ✅ Event emissions for all state changes

### Backend
- ✅ JWT authentication with secure tokens
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ MongoDB injection prevention
- ✅ CORS configuration
- ✅ Input sanitization
- ⚠️ Rate limiting (recommended for production)

### Frontend
- ✅ Wallet signature verification
- ✅ Secure token storage (localStorage with best practices)
- ✅ Network validation (ensure Sepolia)
- ✅ Transaction simulation before execution
- ⚠️ Content Security Policy (recommended for production)

> ⚠️ **Important:** This is a testnet deployment. Professional security audit required before mainnet.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** TailwindCSS
- **Web3:** Wagmi + Viem
- **Wallet:** ConnectKit
- **Bridge:** Avail Nexus SDK
- **Routing:** React Router v6
- **HTTP:** Axios

### Backend
- **Runtime:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken)
- **Security:** bcrypt, cors, helmet
- **Environment:** dotenv

### Blockchain
- **Network:** Ethereum Sepolia Testnet
- **Language:** Solidity ^0.8.20
- **Libraries:** OpenZeppelin Contracts
- **Tools:** Remix IDE, Ethers.js v6
- **Tokens:** Native ETH, PYUSD (ERC-20)

---

## 🌟 Future Enhancements

### Planned Features
- [ ] 📱 Mobile app (React Native)
- [ ] 🖼️ IPFS/Pinata for decentralized image storage
- [ ] 🎫 NFT certificates for products
- [ ] 📊 Advanced analytics dashboard
- [ ] ⭐ Rating and review system
- [ ] 🌍 Multi-language support (i18n)
- [ ] 📧 Email notifications
- [ ] 🔔 Push notifications
- [ ] 📈 Carbon footprint calculator
- [ ] 🎯 Donation campaigns and goals
- [ ] 🔍 Enhanced search and filters
- [ ] 💬 Chat system for institutions and NGOs

### Mainnet Deployment Checklist
- [ ] Professional security audit
- [ ] Gas optimization review
- [ ] Comprehensive testing suite
- [ ] Load testing
- [ ] Incident response plan
- [ ] Legal compliance review
- [ ] Privacy policy and terms
- [ ] Bug bounty program

---

## 🐛 Troubleshooting

### Common Issues

#### ❌ MetaMask Network Error
```javascript
// Solution: Switch to Sepolia
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xaa36a7' }]  // Sepolia
});
```

#### ❌ Transaction Fails
- ✅ Check wallet has sufficient SepoliaETH
- ✅ Verify contract address is correct
- ✅ Ensure you're on Sepolia network
- ✅ Check console for specific error messages

#### ❌ MongoDB Connection Error
```bash
# Check MongoDB is running
sudo systemctl status mongod  # Linux
brew services list             # macOS

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/recraft
```

#### ❌ CORS Issues
```javascript
// In server.js, update CORS config
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

#### ❌ Avail Nexus Initialization Failed
- ✅ Check wallet is connected
- ✅ Verify you're on a supported chain
- ✅ Check browser console for errors
- ✅ Try disconnecting and reconnecting wallet

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 ReCraft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[Full license text...]
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Write clear commit messages
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Be respectful and constructive

---

## 🙏 Acknowledgments

### Sponsors & Integrations
- **[Avail](https://www.availproject.org/)** - Cross-chain bridging with Nexus SDK
- **[PayPal USD](https://www.paypal.com/pyusd)** - Stablecoin payment integration
- **[Ethereum](https://ethereum.org/)** - Blockchain infrastructure

### Built With
- **[OpenZeppelin](https://www.openzeppelin.com/)** - Secure smart contract libraries
- **[Wagmi](https://wagmi.sh/)** - React hooks for Ethereum
- **[ConnectKit](https://docs.family.co/connectkit)** - Wallet connection UI
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[MongoDB](https://www.mongodb.com/)** - Database solution

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/Mohitranag18/ReCraft?style=social)
![GitHub forks](https://img.shields.io/github/forks/Mohitranag18/ReCraft?style=social)
![GitHub issues](https://img.shields.io/github/issues/Mohitranag18/ReCraft)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Mohitranag18/ReCraft)

---

<div align="center">

**Built with 💚 for a sustainable future**

*Empowering communities through blockchain technology*

[⬆ Back to Top](#-recraft---sustainable-upcycling-platform)

</div>

---

> **⚠️ Disclaimer:** This is a testnet deployment for demonstration and testing purposes. Additional security audits, optimizations, and legal compliance reviews are required before production deployment on Ethereum mainnet.