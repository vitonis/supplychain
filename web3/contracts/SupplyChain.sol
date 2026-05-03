// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Simplified library without fee calculations
library TrackingLib {
    function validateShipmentData(
        address _receiver,
        address _carrier,
        uint256 _pickupTime,
        uint256 _estimatedDelivery,
        uint256 _declaredValue,
        uint256 _imageCount,
        string memory _title
    ) internal view {
        require(_receiver != address(0) && _carrier != address(0), "Invalid address");
        require(_pickupTime > block.timestamp, "Invalid pickup");
        require(_estimatedDelivery > _pickupTime, "Invalid delivery");
        require(_declaredValue <= 100 ether, "Value too high");
        require(_imageCount <= 10, "Too many images");
        require(bytes(_title).length > 0, "Title required");
    }
}

contract SupplyChain is ReentrancyGuard, Pausable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum ShipmentStatus { PENDING, IN_TRANSIT, DELIVERED, CANCELLED }
    enum ShipmentType { STANDARD, EXPRESS, OVERNIGHT, FRAGILE }
    enum ShipmentCategory { ELECTRONICS, CLOTHING, BOOKS, FOOD, MEDICAL, OTHER }
    enum UserStatus { PENDING, APPROVED, REJECTED, SUSPENDED }

    struct KYCDetails {
        string fullName;
        string email;
        string phoneNumber;
        string nationalId;
        string homeAddress;
        string idDocumentHash;
        string addressProofHash;
        string profileImageHash;
        uint256 submittedAt;
        uint256 verifiedAt;
        UserStatus status;
        string rejectionReason;
    }

    struct ShipmentDetails {
        string title;
        string description;
        string senderName;
        string receiverName;
        ShipmentCategory category;
        ShipmentType shipmentType;
        uint256 weight;
        string dimensions;
        string[] imageHashes;
        string documentHash;
        bool requiresSignature;
        uint256 declaredValue;
    }

    struct TrackingInfo {
        uint256 timestamp;
        string location;
        string status;
        string notes;
        string imageHash;
        address updatedBy;
    }

    struct Shipment {
        uint256 id;
        address sender;
        address receiver;
        address carrier;
        uint256 pickupTime;
        uint256 deliveryTime;
        uint256 price;
        ShipmentStatus status;
        bool isPaid;
        bool isInsured;
        ShipmentDetails details;
        uint256 createdAt;
        uint256 estimatedDelivery;
        uint256 lastUpdated;
    }

    Counters.Counter private _shipmentIds;
    
    mapping(address => KYCDetails) public userKYC;
    mapping(address => bool) public isRegistered;
    mapping(address => uint256[]) public senderShipments;
    mapping(address => uint256[]) public receiverShipments;
    mapping(address => uint256[]) public carrierShipments;
    mapping(uint256 => Shipment) public shipments;
    mapping(uint256 => TrackingInfo[]) public trackingHistory;
    
    address[] public pendingKYCUsers;
    mapping(address => uint256) public pendingKYCIndex;
    mapping(address => bool) public inPendingKYC;
    
    uint256[] public activeShipments;
    mapping(uint256 => uint256) public activeShipmentIndex;
    mapping(uint256 => bool) public isActiveShipment;
    
    // ── Escrow Confirmation Mappings ──
    // Both carrier and receiver must confirm before admin can release funds
    mapping(uint256 => bool) public escrowCarrierConfirmed;
    mapping(uint256 => bool) public escrowReceiverConfirmed;

    
    uint256 public constant KYC_VALIDITY_PERIOD = 365 days;
    
    event UserRegistered(address indexed user, uint256 timestamp);
    event KYCApproved(address indexed user, address indexed approver, uint256 timestamp);
    event KYCRejected(address indexed user, string reason, uint256 timestamp);
    event UserSuspended(address indexed user, string reason, uint256 timestamp);
    
    event ShipmentCreated(
        uint256 indexed shipmentId, 
        address indexed sender, 
        address indexed receiver, 
        address carrier,
        string title, 
        uint256 price,
        bool isInsured
    );
    event ShipmentStatusChanged(uint256 indexed shipmentId, ShipmentStatus oldStatus, ShipmentStatus newStatus);
    event TrackingUpdated(uint256 indexed shipmentId, string location, string status);
    event ShipmentDelivered(uint256 indexed shipmentId, uint256 deliveryTime);
    event ShipmentCancelled(uint256 indexed shipmentId);
    event EscrowConfirmed(uint256 indexed shipmentId, address indexed confirmedBy, string role);
    event EscrowReleased(uint256 indexed shipmentId, address indexed carrier, uint256 amount, address releasedBy);

    modifier onlyVerifiedUser() {
        // require(isRegistered[msg.sender], "Not registered");
        // require(userKYC[msg.sender].status == UserStatus.APPROVED, "Not verified");
        // require(
        //     block.timestamp <= userKYC[msg.sender].verifiedAt + KYC_VALIDITY_PERIOD,
        //     "KYC expired"
        // );
        _;
    }

    modifier validShipment(uint256 _shipmentId) {
        require(_shipmentId < _shipmentIds.current(), "Invalid ID");
        require(shipments[_shipmentId].sender != address(0), "Not exist");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function registerUser(
        string memory _fullName,
        string memory _email,
        string memory _phoneNumber,
        string memory _nationalId,
        string memory _homeAddress,
        string memory _idDocumentHash,
        string memory _addressProofHash,
        string memory _profileImageHash
    ) external whenNotPaused {
        require(!isRegistered[msg.sender], "Registered");
        require(bytes(_fullName).length > 0 && bytes(_fullName).length <= 100, "Invalid name");
        require(bytes(_email).length > 0 && bytes(_email).length <= 100, "Invalid email");
        require(bytes(_phoneNumber).length > 0, "Phone required");
        require(bytes(_nationalId).length > 0, "ID required");
        require(bytes(_idDocumentHash).length > 0, "ID doc required");
        require(bytes(_addressProofHash).length > 0, "Address proof required");

        userKYC[msg.sender] = KYCDetails({
            fullName: _fullName,
            email: _email,
            phoneNumber: _phoneNumber,
            nationalId: _nationalId,
            homeAddress: _homeAddress,
            idDocumentHash: _idDocumentHash,
            addressProofHash: _addressProofHash,
            profileImageHash: _profileImageHash,
            submittedAt: block.timestamp,
            verifiedAt: 0,
            status: UserStatus.PENDING,
            rejectionReason: ""
        });

        isRegistered[msg.sender] = true;
        
        pendingKYCUsers.push(msg.sender);
        pendingKYCIndex[msg.sender] = pendingKYCUsers.length - 1;
        inPendingKYC[msg.sender] = true;

        emit UserRegistered(msg.sender, block.timestamp);
    }

    function approveKYC(address _user) external onlyRole(ADMIN_ROLE) {
        require(isRegistered[_user], "Not registered");
        require(userKYC[_user].status == UserStatus.PENDING, "Processed");

        userKYC[_user].status = UserStatus.APPROVED;
        userKYC[_user].verifiedAt = block.timestamp;

        _removePendingKYC(_user);

        emit KYCApproved(_user, msg.sender, block.timestamp);
    }

    function rejectKYC(address _user, string memory _reason) external onlyRole(ADMIN_ROLE) {
        require(isRegistered[_user], "Not registered");
        require(userKYC[_user].status == UserStatus.PENDING, "Processed");
        require(bytes(_reason).length > 0, "Reason required");

        userKYC[_user].status = UserStatus.REJECTED;
        userKYC[_user].rejectionReason = _reason;

        _removePendingKYC(_user);

        emit KYCRejected(_user, _reason, block.timestamp);
    }

    function createShipment(
        address _receiver,
        address _carrier,
        uint256 _pickupTime,
        uint256 _estimatedDelivery,
        bool _requireInsurance,
        ShipmentDetails memory _details
    ) external payable nonReentrant whenNotPaused onlyVerifiedUser {
        require(isUserVerified(_receiver), "Receiver not verified");
        require(isUserVerified(_carrier), "Carrier not verified");
        
        TrackingLib.validateShipmentData(
            _receiver,
            _carrier,
            _pickupTime,
            _estimatedDelivery,
            _details.declaredValue,
            _details.imageHashes.length,
            _details.title
        );

        // Only require payment equal to declared value (no fees)
        require(msg.value >= _details.declaredValue, "Insufficient payment");

        uint256 shipmentId = _shipmentIds.current();
        _shipmentIds.increment();

        Shipment storage newShipment = shipments[shipmentId];
        newShipment.id = shipmentId;
        newShipment.sender = msg.sender;
        newShipment.receiver = _receiver;
        newShipment.carrier = _carrier;
        newShipment.pickupTime = _pickupTime;
        newShipment.price = _details.declaredValue;
        newShipment.status = ShipmentStatus.PENDING;
        newShipment.isInsured = _requireInsurance;
        newShipment.details = _details;
        newShipment.createdAt = block.timestamp;
        newShipment.estimatedDelivery = _estimatedDelivery;
        newShipment.lastUpdated = block.timestamp;

        senderShipments[msg.sender].push(shipmentId);
        receiverShipments[_receiver].push(shipmentId);
        carrierShipments[_carrier].push(shipmentId);
        
        activeShipments.push(shipmentId);
        activeShipmentIndex[shipmentId] = activeShipments.length - 1;
        isActiveShipment[shipmentId] = true;

        trackingHistory[shipmentId].push(TrackingInfo({
            timestamp: block.timestamp,
            location: "Origin",
            status: "Created",
            notes: "Package prepared",
            imageHash: "",
            updatedBy: msg.sender
        }));

        // Refund excess payment if any
        if (msg.value > _details.declaredValue) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - _details.declaredValue}("");
            require(success, "Refund failed");
        }

        emit ShipmentCreated(shipmentId, msg.sender, _receiver, _carrier, _details.title, _details.declaredValue, _requireInsurance);
    }

    function startShipment(
        uint256 _shipmentId,
        string memory _location,
        string memory _notes,
        string memory _imageHash
    ) external validShipment(_shipmentId) onlyVerifiedUser {
        Shipment storage shipment = shipments[_shipmentId];
        require(msg.sender == shipment.carrier, "Only carrier");
        require(shipment.status == ShipmentStatus.PENDING, "Invalid status");

        ShipmentStatus oldStatus = shipment.status;
        shipment.status = ShipmentStatus.IN_TRANSIT;
        shipment.lastUpdated = block.timestamp;

        _addTracking(_shipmentId, _location, "In Transit", _notes, _imageHash);

        emit ShipmentStatusChanged(_shipmentId, oldStatus, ShipmentStatus.IN_TRANSIT);
    }

    function updateTracking(
        uint256 _shipmentId,
        string memory _location,
        string memory _status,
        string memory _notes,
        string memory _imageHash
    ) external validShipment(_shipmentId) onlyVerifiedUser {
        Shipment storage shipment = shipments[_shipmentId];
        require(msg.sender == shipment.carrier, "Only carrier");
        require(shipment.status == ShipmentStatus.IN_TRANSIT, "Not in transit");

        _addTracking(_shipmentId, _location, _status, _notes, _imageHash);
    }

    function completeShipment(
        uint256 _shipmentId,
        string memory _deliveryLocation,
        string memory _notes,
        string memory _proofImageHash
    ) external validShipment(_shipmentId) nonReentrant onlyVerifiedUser {
        Shipment storage shipment = shipments[_shipmentId];
        require(msg.sender == shipment.carrier, "Only carrier");
        require(shipment.status == ShipmentStatus.IN_TRANSIT, "Invalid status");
        require(!shipment.isPaid, "Already paid");

        ShipmentStatus oldStatus = shipment.status;
        shipment.status = ShipmentStatus.DELIVERED;
        shipment.deliveryTime = block.timestamp;
        shipment.isPaid = true;
        shipment.lastUpdated = block.timestamp;

        _addTracking(_shipmentId, _deliveryLocation, "Delivered", _notes, _proofImageHash);
        _removeActiveShipment(_shipmentId);

        // Pay the full declared value to carrier (no fees deducted)
        uint256 carrierPayment = shipment.price;
        (bool success, ) = payable(shipment.carrier).call{value: carrierPayment}("");
        require(success, "Payment failed");

        emit ShipmentStatusChanged(_shipmentId, oldStatus, ShipmentStatus.DELIVERED);
        emit ShipmentDelivered(_shipmentId, block.timestamp);
    }

    function cancelShipment(uint256 _shipmentId, string memory _reason) 
        external 
        validShipment(_shipmentId) 
        nonReentrant 
    {
        Shipment storage shipment = shipments[_shipmentId];
        require(msg.sender == shipment.sender, "Only sender");
        require(shipment.status == ShipmentStatus.PENDING, "Only pending");

        ShipmentStatus oldStatus = shipment.status;
        shipment.status = ShipmentStatus.CANCELLED;
        shipment.lastUpdated = block.timestamp;

        _addTracking(_shipmentId, "Origin", "Cancelled", _reason, "");
        _removeActiveShipment(_shipmentId);

        // Refund full amount to sender (no cancellation fees)
        uint256 refundAmount = shipment.price;
        (bool success, ) = payable(shipment.sender).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit ShipmentStatusChanged(_shipmentId, oldStatus, ShipmentStatus.CANCELLED);
        emit ShipmentCancelled(_shipmentId);
    }

    // ── Escrow: Carrier or Receiver records their on-chain confirmation ──
    function confirmEscrow(uint256 _shipmentId)
        external
        validShipment(_shipmentId)
    {
        Shipment storage shipment = shipments[_shipmentId];
        require(shipment.status == ShipmentStatus.IN_TRANSIT, "Not in transit");
        require(!shipment.isPaid, "Already paid");

        if (msg.sender == shipment.carrier) {
            require(!escrowCarrierConfirmed[_shipmentId], "Already confirmed");
            escrowCarrierConfirmed[_shipmentId] = true;
            emit EscrowConfirmed(_shipmentId, msg.sender, "carrier");
        } else if (msg.sender == shipment.receiver) {
            require(!escrowReceiverConfirmed[_shipmentId], "Already confirmed");
            escrowReceiverConfirmed[_shipmentId] = true;
            emit EscrowConfirmed(_shipmentId, msg.sender, "receiver");
        } else {
            revert("Only carrier or receiver");
        }
    }

    // ── Admin releases payment to carrier after both parties confirm ──
    function adminReleasePayment(uint256 _shipmentId)
        external
        validShipment(_shipmentId)
        nonReentrant
        onlyRole(ADMIN_ROLE)
    {
        Shipment storage shipment = shipments[_shipmentId];
        require(shipment.status == ShipmentStatus.IN_TRANSIT, "Not in transit");
        require(!shipment.isPaid, "Already paid");
        require(escrowCarrierConfirmed[_shipmentId], "Carrier has not confirmed");
        require(escrowReceiverConfirmed[_shipmentId], "Receiver has not confirmed");

        ShipmentStatus oldStatus = shipment.status;
        shipment.status = ShipmentStatus.DELIVERED;
        shipment.deliveryTime = block.timestamp;
        shipment.isPaid = true;
        shipment.lastUpdated = block.timestamp;

        _addTracking(_shipmentId, "Admin", "Delivered", "Admin released escrow payment after mutual confirmation", "");
        _removeActiveShipment(_shipmentId);

        uint256 payment = shipment.price;
        (bool success, ) = payable(shipment.carrier).call{value: payment}("");
        require(success, "Payment failed");

        emit ShipmentStatusChanged(_shipmentId, oldStatus, ShipmentStatus.DELIVERED);
        emit ShipmentDelivered(_shipmentId, block.timestamp);
        emit EscrowReleased(_shipmentId, shipment.carrier, payment, msg.sender);
    }

    // View functions
    function getShipment(uint256 _shipmentId) external view validShipment(_shipmentId) returns (Shipment memory) {
        return shipments[_shipmentId];
    }

    function getTrackingHistory(uint256 _shipmentId) external view validShipment(_shipmentId) returns (TrackingInfo[] memory) {
        return trackingHistory[_shipmentId];
    }

    function getUserKYC(address _user) external view returns (KYCDetails memory) {
        return userKYC[_user];
    }

    function getPendingKYCUsers() external view returns (address[] memory) {
        return pendingKYCUsers;
    }

    function getActiveShipments() external view returns (uint256[] memory) {
        return activeShipments;
    }

    function getUserShipments(address _user, string memory _type) external view returns (uint256[] memory) {
        if (keccak256(abi.encodePacked(_type)) == keccak256(abi.encodePacked("sender"))) {
            return senderShipments[_user];
        } else if (keccak256(abi.encodePacked(_type)) == keccak256(abi.encodePacked("receiver"))) {
            return receiverShipments[_user];
        } else if (keccak256(abi.encodePacked(_type)) == keccak256(abi.encodePacked("carrier"))) {
            return carrierShipments[_user];
        }
        revert("Invalid type");
    }

    function isUserVerified(address _user) public view returns (bool) {
        return true;
    }

    // Admin functions
    function suspendUser(address _user, string memory _reason) external onlyRole(ADMIN_ROLE) {
        require(isRegistered[_user], "Not registered");
        require(bytes(_reason).length > 0, "Reason required");
        
        userKYC[_user].status = UserStatus.SUSPENDED;
        userKYC[_user].rejectionReason = _reason;

        emit UserSuspended(_user, _reason, block.timestamp);
    }

    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function emergencyUnpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Internal functions
    function _addTracking(
        uint256 _shipmentId,
        string memory _location,
        string memory _status,
        string memory _notes,
        string memory _imageHash
    ) internal {
        require(trackingHistory[_shipmentId].length < 30, "Too many updates");
        
        trackingHistory[_shipmentId].push(TrackingInfo({
            timestamp: block.timestamp,
            location: _location,
            status: _status,
            notes: _notes,
            imageHash: _imageHash,
            updatedBy: msg.sender
        }));

        shipments[_shipmentId].lastUpdated = block.timestamp;

        emit TrackingUpdated(_shipmentId, _location, _status);
    }

    function _removePendingKYC(address _user) internal {
        if (inPendingKYC[_user]) {
            uint256 index = pendingKYCIndex[_user];
            uint256 lastIndex = pendingKYCUsers.length - 1;
            
            if (index != lastIndex) {
                address lastUser = pendingKYCUsers[lastIndex];
                pendingKYCUsers[index] = lastUser;
                pendingKYCIndex[lastUser] = index;
            }
            
            pendingKYCUsers.pop();
            delete pendingKYCIndex[_user];
            inPendingKYC[_user] = false;
        }
    }

    function _removeActiveShipment(uint256 _shipmentId) internal {
        if (isActiveShipment[_shipmentId]) {
            uint256 index = activeShipmentIndex[_shipmentId];
            uint256 lastIndex = activeShipments.length - 1;
            
            if (index != lastIndex) {
                uint256 lastShipmentId = activeShipments[lastIndex];
                activeShipments[index] = lastShipmentId;
                activeShipmentIndex[lastShipmentId] = index;
            }
            
            activeShipments.pop();
            delete activeShipmentIndex[_shipmentId];
            isActiveShipment[_shipmentId] = false;
        }
    }

    receive() external payable {}

    function emergencyWithdraw(uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Withdrawal failed");
    }
}