// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ReCraft {
    address public platformWallet;
    uint256 public donationCounter;
    uint256 public productCounter;
    
    struct Donation {
        uint256 id;
        address institution;
        string materialType;
        uint256 quantity;
        string status; // Available, Accepted, Crafted, Sold
        address ngo;
        uint256 timestamp;
    }
    
    struct Product {
        uint256 id;
        uint256 donationId;
        string productName;
        string productType;
        uint256 price; // Price in wei (or PYUSD smallest unit)
        address ngo;
        address artisan;
        address institution;
        bool sold;
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
        uint256 price,
        address ngo,
        uint256 timestamp
    );
    
    event ProductPurchased(
        uint256 indexed productId,
        address indexed buyer,
        uint256 price,
        uint256 timestamp
    );
    
    event RevenueDistributed(
        uint256 indexed productId,
        address ngo,
        uint256 ngoAmount,
        address institution,
        uint256 institutionAmount,
        uint256 platformAmount,
        uint256 timestamp
    );
    
    constructor(address _platformWallet) {
        platformWallet = _platformWallet;
        donationCounter = 0;
        productCounter = 0;
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
        uint256 _price,
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
            price: _price,
            ngo: msg.sender,
            artisan: _artisan,
            institution: donations[_donationId].institution,
            sold: false,
            timestamp: block.timestamp
        });
        
        ngoProducts[msg.sender].push(productCounter);
        donations[_donationId].status = "Crafted";
        
        emit ProductCreated(
            productCounter,
            _donationId,
            _productName,
            _price,
            msg.sender,
            block.timestamp
        );
        
        return productCounter;
    }
    
    function purchaseProduct(uint256 _productId) public payable {
        require(_productId > 0 && _productId <= productCounter, "Invalid product ID");
        require(!products[_productId].sold, "Product already sold");
        require(msg.value >= products[_productId].price, "Insufficient payment");
        
        Product storage product = products[_productId];
        product.sold = true;
        
        donations[product.donationId].status = "Sold";
        
        emit ProductPurchased(
            _productId,
            msg.sender,
            msg.value,
            block.timestamp
        );
        
        distributeRevenue(_productId, msg.value);
    }
    
    function distributeRevenue(uint256 _productId, uint256 _amount) internal {
        Product storage product = products[_productId];
        
        // 70% to NGO/Artisan (can be split further off-chain)
        uint256 ngoAmount = (_amount * 70) / 100;
        
        // 20% to Institution
        uint256 institutionAmount = (_amount * 20) / 100;
        
        // 10% to Platform
        uint256 platformAmount = (_amount * 10) / 100;
        
        // Transfer funds
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
        
        // Count available donations
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