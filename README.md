# 🌱 ReCraft - Sustainable Upcycling Platform

ReCraft is a blockchain-powered platform that connects institutions (schools, colleges, offices) with NGOs and artisans to transform discarded paper and materials into beautiful, sustainable home décor products. The platform ensures complete traceability, transparency, and fair revenue distribution through smart contracts.

## 🎯 Project Purpose

- **Environmental Impact**: Reduce waste by recycling discarded paper and materials
- **Social Impact**: Empower NGOs and artisans with fair income opportunities
- **Transparency**: Blockchain-based traceability from donation to final product
- **Fair Revenue**: Automated smart contract distribution (70% NGO/Artisan, 20% Institution, 10% Platform)

## 📁 Project Structure

```
ReCraft/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contracts/      # Contract ABI files
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── contracts/              # Solidity smart contracts
│   ├── ReCraft.sol
│   ├── hardhat.config.js
│   ├── scripts/deploy.js
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- MetaMask browser extension
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ReCraft
```

### 2. Setup Smart Contracts

```bash
cd contracts
npm install

# Copy environment file
cp .env.example .env

# Compile contracts
npm run compile

# Start local Hardhat node (in a separate terminal)
npm run node

# Deploy contracts (in another terminal)
npm run deploy

# Save the deployed contract address!
```

After deployment, you'll see output like:
```
ReCraft contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3. Setup Backend Server

```bash
cd ../server
npm install

# Copy environment file
cp .env.example .env

# Edit .env file and update:
# - MONGODB_URI (if not using default)
# - JWT_SECRET (change to a secure random string)
# - CONTRACT_ADDRESS (from deployment step)
```

Start MongoDB (if local):
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

Start the server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### 4. Setup Frontend

```bash
cd ../client
npm install

# Copy environment file
cp .env.example .env

# Edit .env file and add the CONTRACT_ADDRESS from deployment
# VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Copy the contract ABI:
```bash
# Create contracts directory
mkdir -p src/contracts

# Copy ABI from compiled contracts
cp ../contracts/artifacts/contracts/ReCraft.sol/ReCraft.json src/contracts/ReCraftABI.json
```

Start the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/recraft
JWT_SECRET=your_super_secret_jwt_key
RPC_URL=http://localhost:8545
NETWORK=localhost
CONTRACT_ADDRESS=<your_deployed_contract_address>
```

#### Client (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=<your_deployed_contract_address>
VITE_NETWORK=localhost
```

## 📖 Usage Guide

### For Institutions

1. **Register**: Create an account, connect MetaMask wallet
2. **Create Donation**: List discarded materials (paper, notebooks, etc.)
3. **Track Status**: Monitor donations from "Available" → "Accepted" → "Crafted" → "Sold"
4. **Earn Revenue**: Receive 20% of product sales automatically

### For NGOs

1. **Register**: Create account with registration number, connect wallet
2. **Browse Donations**: View available donations from nearby institutions
3. **Accept Donation**: Click "Accept" to claim materials (blockchain transaction)
4. **Create Products**: After crafting, list products with details and pricing
5. **Earn Revenue**: Receive 70% of product sales (split with artisans if applicable)
6. **Add Artisans**: Register artisan wallet addresses for revenue sharing

### For Buyers

1. **Browse Marketplace**: Explore sustainable home décor products
2. **View Traceability**: See complete journey from source to product
3. **Connect Wallet**: Link MetaMask to purchase
4. **Buy Products**: Purchase with ETH/PYUSD, revenue automatically distributed

## 🔗 API Endpoints

### Institution Routes
```
POST   /api/institutions/register     - Register institution
POST   /api/institutions/login        - Login institution
GET    /api/institutions/profile      - Get profile (auth required)
GET    /api/institutions/donations    - Get all donations
POST   /api/institutions/donations    - Create donation record
```

### NGO Routes
```
POST   /api/ngos/register                      - Register NGO
POST   /api/ngos/login                         - Login NGO
GET    /api/ngos/profile                       - Get profile (auth required)
GET    /api/ngos/donations/available           - Get available donations
GET    /api/ngos/donations                     - Get accepted donations
PATCH  /api/ngos/donations/:id/accept          - Accept donation
POST   /api/ngos/artisans                      - Add artisan
GET    /api/ngos/artisans                      - Get artisans
```

### Product Routes
```
GET    /api/products/marketplace               - Get all available products
GET    /api/products/:id                       - Get product details
POST   /api/products                           - Create product (auth required)
PATCH  /api/products/:id/purchase              - Record purchase
GET    /api/products/ngo/:ngoId                - Get products by NGO
GET    /api/products/institution/:institutionId - Get products by institution
```

### Blockchain Routes
```
GET    /api/blockchain/contract-info           - Get contract information
GET    /api/blockchain/donations/:id           - Get donation from blockchain
GET    /api/blockchain/products/:id            - Get product from blockchain
GET    /api/blockchain/donations/available/list - Get available donations
GET    /api/blockchain/products/available/list  - Get available products
GET    /api/blockchain/transaction/:hash        - Get transaction receipt
GET    /api/blockchain/explorer-link/:hash      - Get explorer link
POST   /api/blockchain/verify-signature         - Verify wallet signature
```

## 🧪 Testing the Application

### 1. Test Institution Flow
```bash
# Register institution with MetaMask
# Create donation (e.g., 50 sheets of paper)
# Check blockchain transaction on MetaMask
# View donation in dashboard
```

### 2. Test NGO Flow
```bash
# Register NGO with different MetaMask account
# Browse available donations
# Accept a donation (approve transaction)
# Create product from accepted donation
# Check product appears in marketplace
```

### 3. Test Marketplace
```bash
# Open marketplace without login
# Connect wallet (buyer account)
# View product details and traceability
# Purchase product (approve transaction)
# Check revenue distribution in contract events
```

## 📊 Smart Contract Functions

### Main Functions

**createDonation(materialType, quantity)**
- Creates donation record on blockchain
- Emits `DonationCreated` event

**acceptDonation(donationId)**
- NGO accepts available donation
- Updates donation status to "Accepted"
- Emits `DonationAccepted` event

**createProduct(donationId, productName, productType, price, artisan)**
- Creates product from accepted donation
- Updates donation status to "Crafted"
- Emits `ProductCreated` event

**purchaseProduct(productId)**
- Buyer purchases product with payment
- Automatically distributes revenue (70/20/10 split)
- Updates product status to "Sold"
- Emits `ProductPurchased` and `RevenueDistributed` events

### View Functions

- `getDonation(id)` - Get donation details
- `getProduct(id)` - Get product details
- `getAvailableDonations()` - Get all available donations
- `getAvailableProducts()` - Get all unsold products
- `getInstitutionDonations(address)` - Get donations by institution
- `getNGOProducts(address)` - Get products by NGO

## 🔮 Future Scope & Integrations

### Planned Features

#### 1. **Avail Nexus SDK Integration**
- Enable cross-chain token bridging
- Allow payments across multiple blockchain networks
- Seamless asset transfers between chains

```javascript
// Future implementation
import { AvailNexus } from '@availproject/nexus-sdk';

const bridgePayment = async (sourceChain, targetChain, amount) => {
  const nexus = new AvailNexus();
  await nexus.bridge(sourceChain, targetChain, amount);
};
```

#### 2. **Blockscout Integration**
- Custom block explorer for ReCraft transactions
- Enhanced transaction tracking and analytics
- Public transparency dashboard

Setup local Blockscout:
```bash
docker-compose up -d blockscout
# Configure in .env: BLOCKSCOUT_URL=http://localhost:4000
```

#### 3. **PayPal USD (PYUSD) Integration**
- Accept PYUSD stablecoin for payments
- Reduce price volatility
- Easier fiat on/off ramps

```solidity
// Future smart contract enhancement
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

IERC20 public pyusdToken;

function purchaseProductWithPYUSD(uint256 productId, uint256 amount) public {
    require(pyusdToken.transferFrom(msg.sender, address(this), amount));
    // Process purchase and distribute revenue
}
```

#### 4. **IPFS/Pinata for Media Storage**
- Store product images on IPFS
- Decentralized and permanent storage
- Integrate with Pinata API

```javascript
// Future implementation
import pinataSDK from '@pinata/sdk';

const uploadToPinata = async (file) => {
  const pinata = pinataSDK(apiKey, secretKey);
  const result = await pinata.pinFileToIPFS(file);
  return `ipfs://${result.IpfsHash}`;
};
```

#### 5. **Additional Features**
- [ ] QR code generation for product traceability
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Rating and review system
- [ ] NFT certificates for products
- [ ] Carbon footprint calculator
- [ ] Donation campaigns and goals
- [ ] Social media integration
- [ ] Email notifications

## 🛡️ Security Considerations

### Smart Contract Security
- ✅ Reentrancy protection
- ✅ Access control (only NGO can create products)
- ✅ Input validation
- ⚠️ Consider OpenZeppelin upgradeable contracts for production
- ⚠️ Get professional audit before mainnet deployment

### Backend Security
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ⚠️ Implement rate limiting for production
- ⚠️ Add CSRF protection
- ⚠️ Use HTTPS in production

### Frontend Security
- ✅ Wallet signature verification
- ✅ Secure storage of tokens
- ⚠️ Implement Content Security Policy (CSP)
- ⚠️ XSS protection
- ⚠️ Sanitize user inputs

## 🐛 Troubleshooting

### Common Issues

**1. MetaMask Connection Issues**
```javascript
// Check if MetaMask is installed
if (!window.ethereum) {
  alert('Please install MetaMask!');
}

// Switch to correct network
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x539' }], // 1337 in hex for localhost
});
```

**2. MongoDB Connection Failed**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/recraft
```

**3. Contract Deployment Failed**
```bash
# Make sure Hardhat node is running
npm run node

# Check RPC URL in hardhat.config.js
# Verify you have test ETH in deployer account
```

**4. Transaction Reverted**
- Check if contract is deployed correctly
- Verify wallet has sufficient ETH for gas
- Check console logs for specific error messages
- Verify function parameters match contract requirements

**5. CORS Errors**
```javascript
// In server.js, update CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## 📝 Development Notes

### Code Structure Best Practices
- Components are organized by feature
- Reusable utilities in separate files
- Environment variables for configuration
- Error handling in all async operations

### Database Indexes
The MongoDB models include indexes for:
- Geospatial queries (NGO location-based search)
- Status filtering (donation/product status)
- User lookups (wallet addresses, emails)

### Gas Optimization
- Batch operations where possible
- Use events for data that doesn't need on-chain storage
- Optimize struct packing in smart contracts

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Blockchain Infrastructure**: Ethereum, Hardhat
- **Frontend**: React, TailwindCSS, Vite
- **Backend**: Node.js, Express, MongoDB
- **Web3 Libraries**: ethers.js
- **Sponsors**: Avail, Blockscout, PayPal USD (PYUSD)

## 📧 Support

For questions or support:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

---

**Built with 💚 for a sustainable future**

*Note: This is a starter codebase for development and testing. Additional security audits, testing, and optimizations are required before production deployment.*