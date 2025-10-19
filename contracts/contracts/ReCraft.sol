// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Interface for ERC-20 tokens (PYUSD)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract ReCraft {
    address public platformWallet;
    uint256 public donationCounter;
    uint256 public productCounter;
    
    // PYUSD Token Address (set during deployment or update)
    // For testnet: Use PYUSD testnet address
    // For mainnet: 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8 (Ethereum)
    address public pyusdTokenAddress;
    
    enum PaymentMethod { ETH, PYUSD }
    
    struct Donation {
        uint256 id;
        address institution;
        string materialType;
        uint256 quantity;
        string status;
        address ngo;
        uint256 timestamp;
    }
    
    struct Product {
        uint256 id;
        uint256 donationId;
        string productName;
        string productType;
        uint256 priceInWei;        // Price in ETH (wei)
        uint256 priceInPYUSD;      // Price in PYUSD (6 decimals)
        address ngo;
        address artisan;
        address institution;
        bool sold;
        PaymentMethod paymentMethod;
        uint256 timestamp;
    }
    
    mapping(uint256 => Donation) public donations;
    mapping(uint256 => Product) public products;
    mapping(address => uint256[]) public institutionDonations;
    mapping(address => uint256[]) public ngoProducts;
    
    event DonationCreated(
        uint256 indexed donationId,
        address indexed institution,
        string materialType,
        uint256 quantity,
        uint256 timestamp
    );
    
    event DonationAccepted(
        uint256 indexed donationId,
        address indexed ngo,
        uint256 timestamp
    );
    
    event ProductCreated(
        uint256 indexed productId,
        uint256 indexed donationId,
        string productName,
        uint256 priceInWei,
        uint256 priceInPYUSD,
        address ngo,
        uint256 timestamp
    );
    
    event ProductPurchased(
        uint256 indexed productId,
        address indexed buyer,
        uint256 price,
        PaymentMethod paymentMethod,
        uint256 timestamp
    );
    
    event RevenueDistributed(
        uint256 indexed productId,
        address ngo,
        uint256 ngoAmount,
        address institution,
        uint256 institutionAmount,
        uint256 platformAmount,
        PaymentMethod paymentMethod,
        uint256 timestamp
    );
    
    event PYUSDAddressUpdated(address indexed newAddress);
    
    constructor(address _platformWallet, address _pyusdTokenAddress) {
        platformWallet = _platformWallet;
        pyusdTokenAddress = _pyusdTokenAddress;
        donationCounter = 0;
        productCounter = 0;
    }
    
    // Update PYUSD token address (only platform wallet)
    function updatePYUSDAddress(address _newPyusdAddress) external {
        require(msg.sender == platformWallet, "Only platform can update");
        pyusdTokenAddress = _newPyusdAddress;
        emit PYUSDAddressUpdated(_newPyusdAddress);
    }
    
    function createDonation(
        string memory _materialType,
        uint256 _quantity
    ) public returns (uint256) {
        donationCounter++;
        
        donations[donationCounter] = Donation({
            id: donationCounter,
            institution: msg.sender,
            materialType: _materialType,
            quantity: _quantity,
            status: "Available",
            ngo: address(0),
            timestamp: block.timestamp
        });
        
        institutionDonations[msg.sender].push(donationCounter);
        
        emit DonationCreated(
            donationCounter,
            msg.sender,
            _materialType,
            _quantity,
            block.timestamp
        );
        
        return donationCounter;
    }
    
    function acceptDonation(uint256 _donationId) public {
        require(_donationId > 0 && _donationId <= donationCounter, "Invalid donation ID");
        require(
            keccak256(bytes(donations[_donationId].status)) == keccak256(bytes("Available")),
            "Donation not available"
        );
        
        donations[_donationId].ngo = msg.sender;
        donations[_donationId].status = "Accepted";
        
        emit DonationAccepted(_donationId, msg.sender, block.timestamp);
    }
    
    function createProduct(
        uint256 _donationId,
        string memory _productName,
        string memory _productType,
        uint256 _priceInWei,
        uint256 _priceInPYUSD,
        address _artisan
    ) public returns (uint256) {
        require(_donationId > 0 && _donationId <= donationCounter, "Invalid donation ID");
        require(donations[_donationId].ngo == msg.sender, "Only NGO that accepted can create product");
        require(
            keccak256(bytes(donations[_donationId].status)) == keccak256(bytes("Accepted")),
            "Donation must be in Accepted status"
        );
        
        productCounter++;
        
        products[productCounter] = Product({
            id: productCounter,
            donationId: _donationId,
            productName: _productName,
            productType: _productType,
            priceInWei: _priceInWei,
            priceInPYUSD: _priceInPYUSD,
            ngo: msg.sender,
            artisan: _artisan,
            institution: donations[_donationId].institution,
            sold: false,
            paymentMethod: PaymentMethod.ETH,
            timestamp: block.timestamp
        });
        
        ngoProducts[msg.sender].push(productCounter);
        donations[_donationId].status = "Crafted";
        
        emit ProductCreated(
            productCounter,
            _donationId,
            _productName,
            _priceInWei,
            _priceInPYUSD,
            msg.sender,
            block.timestamp
        );
        
        return productCounter;
    }
    
    // Purchase with ETH
    function purchaseProductWithETH(uint256 _productId) public payable {
        require(_productId > 0 && _productId <= productCounter, "Invalid product ID");
        require(!products[_productId].sold, "Product already sold");
        require(msg.value >= products[_productId].priceInWei, "Insufficient payment");
        
        Product storage product = products[_productId];
        product.sold = true;
        product.paymentMethod = PaymentMethod.ETH;
        
        donations[product.donationId].status = "Sold";
        
        emit ProductPurchased(
            _productId,
            msg.sender,
            msg.value,
            PaymentMethod.ETH,
            block.timestamp
        );
        
        distributeRevenueETH(_productId, msg.value);
    }
    
    // Purchase with PYUSD
    function purchaseProductWithPYUSD(uint256 _productId) public {
        require(_productId > 0 && _productId <= productCounter, "Invalid product ID");
        require(!products[_productId].sold, "Product already sold");
        require(pyusdTokenAddress != address(0), "PYUSD not configured");
        
        Product storage product = products[_productId];
        uint256 price = product.priceInPYUSD;
        
        IERC20 pyusd = IERC20(pyusdTokenAddress);
        
        // Transfer PYUSD from buyer to contract
        require(
            pyusd.transferFrom(msg.sender, address(this), price),
            "PYUSD transfer failed"
        );
        
        product.sold = true;
        product.paymentMethod = PaymentMethod.PYUSD;
        donations[product.donationId].status = "Sold";
        
        emit ProductPurchased(
            _productId,
            msg.sender,
            price,
            PaymentMethod.PYUSD,
            block.timestamp
        );
        
        distributeRevenuePYUSD(_productId, price);
    }
    
    function distributeRevenueETH(uint256 _productId, uint256 _amount) internal {
        Product storage product = products[_productId];
        
        uint256 ngoAmount = (_amount * 70) / 100;
        uint256 institutionAmount = (_amount * 20) / 100;
        uint256 platformAmount = (_amount * 10) / 100;
        
        payable(product.ngo).transfer(ngoAmount);
        payable(product.institution).transfer(institutionAmount);
        payable(platformWallet).transfer(platformAmount);
        
        emit RevenueDistributed(
            _productId,
            product.ngo,
            ngoAmount,
            product.institution,
            institutionAmount,
            platformAmount,
            PaymentMethod.ETH,
            block.timestamp
        );
    }
    
    function distributeRevenuePYUSD(uint256 _productId, uint256 _amount) internal {
        Product storage product = products[_productId];
        
        uint256 ngoAmount = (_amount * 70) / 100;
        uint256 institutionAmount = (_amount * 20) / 100;
        uint256 platformAmount = (_amount * 10) / 100;
        
        IERC20 pyusd = IERC20(pyusdTokenAddress);
        
        require(pyusd.transfer(product.ngo, ngoAmount), "NGO transfer failed");
        require(pyusd.transfer(product.institution, institutionAmount), "Institution transfer failed");
        require(pyusd.transfer(platformWallet, platformAmount), "Platform transfer failed");
        
        emit RevenueDistributed(
            _productId,
            product.ngo,
            ngoAmount,
            product.institution,
            institutionAmount,
            platformAmount,
            PaymentMethod.PYUSD,
            block.timestamp
        );
    }
    
    function getDonation(uint256 _donationId) public view returns (Donation memory) {
        return donations[_donationId];
    }
    
    function getProduct(uint256 _productId) public view returns (Product memory) {
        return products[_productId];
    }
    
    function getInstitutionDonations(address _institution) public view returns (uint256[] memory) {
        return institutionDonations[_institution];
    }
    
    function getNGOProducts(address _ngo) public view returns (uint256[] memory) {
        return ngoProducts[_ngo];
    }
    
    function getAvailableDonations() public view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= donationCounter; i++) {
            if (keccak256(bytes(donations[i].status)) == keccak256(bytes("Available"))) {
                count++;
            }
        }
        
        uint256[] memory available = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= donationCounter; i++) {
            if (keccak256(bytes(donations[i].status)) == keccak256(bytes("Available"))) {
                available[index] = i;
                index++;
            }
        }
        
        return available;
    }
    
    function getAvailableProducts() public view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= productCounter; i++) {
            if (!products[i].sold) {
                count++;
            }
        }
        
        uint256[] memory available = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= productCounter; i++) {
            if (!products[i].sold) {
                available[index] = i;
                index++;
            }
        }
        
        return available;
    }
}