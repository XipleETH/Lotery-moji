// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LottoMojiRandom
 * @dev Chainlink VRF v2.5 for secure random number generation (0-24 for 25 emojis)
 */
contract LottoMojiRandom is VRFConsumerBaseV2, Ownable {
    VRFCoordinatorV2Interface COORDINATOR;
    
    // Base Sepolia VRF Coordinator
    address constant VRF_COORDINATOR = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;
    
    // Base Sepolia 200 gwei key hash
    bytes32 constant KEY_HASH = 0x8077df514608a09f83e4e8d300645594e5d7cd9f1e39beb9b8ebb88c6f4bb2e4;
    
    // VRF Configuration
    uint64 public subscriptionId;
    uint32 constant CALLBACK_GAS_LIMIT = 200000;
    uint16 constant REQUEST_CONFIRMATIONS = 3;
    uint32 constant NUM_WORDS = 4; // We need 4 random numbers for 4 emojis
    
    // Lottery contract reference
    address public immutable lotteryContract;
    
    // Request tracking
    struct RandomRequest {
        uint256 requestId;
        uint256 gameDay;
        address requester;
        uint256 timestamp;
        bool fulfilled;
        uint8[4] randomNumbers;
    }
    
    mapping(uint256 => RandomRequest) public randomRequests;
    mapping(uint256 => uint256) public gameDayToRequestId;
    
    uint256 public lastRequestId;
    uint8[4] public lastWinningNumbers;
    uint256 public lastDrawTime;
    
    // Events
    event RandomNumbersRequested(
        uint256 indexed requestId,
        uint256 indexed gameDay,
        address requester
    );
    
    event RandomNumbersFulfilled(
        uint256 indexed requestId,
        uint256 indexed gameDay,
        uint8[4] randomNumbers
    );
    
    event WinningNumbersGenerated(
        uint256 indexed gameDay,
        uint8[4] winningNumbers,
        uint256 timestamp
    );
    
    modifier onlyLottery() {
        require(msg.sender == lotteryContract, "Only lottery contract");
        _;
    }
    
    constructor(uint64 _subscriptionId, address _lotteryContract) 
        VRFConsumerBaseV2(VRF_COORDINATOR) 
    {
        COORDINATOR = VRFCoordinatorV2Interface(VRF_COORDINATOR);
        subscriptionId = _subscriptionId;
        lotteryContract = _lotteryContract;
    }
    
    /**
     * @dev Request random numbers from Chainlink VRF
     */
    function requestRandomNumbers(uint256 gameDay) external onlyLottery returns (uint256 requestId) {
        require(gameDayToRequestId[gameDay] == 0, "Already requested for this game day");
        
        // Request random words from Chainlink VRF
        requestId = COORDINATOR.requestRandomWords(
            KEY_HASH,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
        
        // Store request details
        randomRequests[requestId] = RandomRequest({
            requestId: requestId,
            gameDay: gameDay,
            requester: msg.sender,
            timestamp: block.timestamp,
            fulfilled: false,
            randomNumbers: [0, 0, 0, 0]
        });
        
        gameDayToRequestId[gameDay] = requestId;
        lastRequestId = requestId;
        
        emit RandomNumbersRequested(requestId, gameDay, msg.sender);
        
        return requestId;
    }
    
    /**
     * @dev Chainlink VRF callback function
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        require(randomRequests[requestId].requestId == requestId, "Invalid request ID");
        require(!randomRequests[requestId].fulfilled, "Request already fulfilled");
        require(randomWords.length == NUM_WORDS, "Invalid number of random words");
        
        // Convert random words to numbers 0-24 (for 25 emojis)
        uint8[4] memory randomNumbers;
        for (uint256 i = 0; i < NUM_WORDS; i++) {
            randomNumbers[i] = uint8(randomWords[i] % 25);
        }
        
        // Store the results
        randomRequests[requestId].randomNumbers = randomNumbers;
        randomRequests[requestId].fulfilled = true;
        
        lastWinningNumbers = randomNumbers;
        lastDrawTime = block.timestamp;
        
        uint256 gameDay = randomRequests[requestId].gameDay;
        
        emit RandomNumbersFulfilled(requestId, gameDay, randomNumbers);
        emit WinningNumbersGenerated(gameDay, randomNumbers, block.timestamp);
    }
    
    /**
     * @dev Generate winning numbers (main function called by lottery)
     * This is a synchronous version for testing or emergency use
     */
    function generateWinningNumbers() external view onlyLottery returns (uint8[4] memory) {
        // Return last generated numbers if available
        if (lastDrawTime > 0) {
            return lastWinningNumbers;
        }
        
        // Fallback: use block-based pseudo-randomness (not recommended for production)
        uint8[4] memory numbers;
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            block.number,
            msg.sender
        )));
        
        for (uint256 i = 0; i < 4; i++) {
            numbers[i] = uint8((seed >> (i * 8)) % 25);
        }
        
        return numbers;
    }
    
    /**
     * @dev Get winning numbers for specific game day
     */
    function getWinningNumbers(uint256 gameDay) external view returns (uint8[4] memory) {
        uint256 requestId = gameDayToRequestId[gameDay];
        require(requestId != 0, "No request for this game day");
        require(randomRequests[requestId].fulfilled, "Random numbers not fulfilled yet");
        
        return randomRequests[requestId].randomNumbers;
    }
    
    /**
     * @dev Check if random numbers are ready for game day
     */
    function areRandomNumbersReady(uint256 gameDay) external view returns (bool) {
        uint256 requestId = gameDayToRequestId[gameDay];
        if (requestId == 0) return false;
        return randomRequests[requestId].fulfilled;
    }
    
    /**
     * @dev Get request status
     */
    function getRequestStatus(uint256 requestId) external view returns (
        bool fulfilled,
        uint8[4] memory randomNumbers,
        uint256 gameDay
    ) {
        require(randomRequests[requestId].requestId == requestId, "Invalid request ID");
        
        RandomRequest memory request = randomRequests[requestId];
        return (request.fulfilled, request.randomNumbers, request.gameDay);
    }
    
    /**
     * @dev Get last generated numbers
     */
    function getLastWinningNumbers() external view returns (uint8[4] memory, uint256) {
        return (lastWinningNumbers, lastDrawTime);
    }
    
    /**
     * @dev Convert numbers to emoji display string (for testing/display)
     */
    function numbersToEmojis(uint8[4] memory numbers) external pure returns (string memory) {
        string[25] memory EMOJIS = [
            "💰", "💎", "🚀", "🎰", "🎲", "🃏", "💸", "🏆", "🎯", "🔥",
            "⚡", "🌙", "⭐", "💫", "🎪", "🎨", "🦄", "🌈", "🍀", "🎭", 
            "🎢", "🎮", "🏅", "🎊", "🎈"
        ];
        
        return string(abi.encodePacked(
            EMOJIS[numbers[0]], " ",
            EMOJIS[numbers[1]], " ",
            EMOJIS[numbers[2]], " ",
            EMOJIS[numbers[3]]
        ));
    }
    
    /**
     * @dev Validate that numbers are in valid range (0-24)
     */
    function validateNumbers(uint8[4] memory numbers) external pure returns (bool) {
        for (uint256 i = 0; i < 4; i++) {
            if (numbers[i] > 24) return false;
        }
        return true;
    }
    
    /**
     * @dev Get current VRF configuration
     */
    function getVRFConfig() external view returns (
        address coordinator,
        bytes32 keyHash,
        uint64 subId,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    ) {
        return (
            VRF_COORDINATOR,
            KEY_HASH,
            subscriptionId,
            CALLBACK_GAS_LIMIT,
            REQUEST_CONFIRMATIONS
        );
    }
    
    /**
     * @dev Emergency function to set new subscription ID
     */
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }
    
    /**
     * @dev Emergency function to manually set winning numbers (admin only)
     */
    function emergencySetWinningNumbers(uint8[4] memory numbers) external onlyOwner {
        require(validateNumbers(numbers), "Invalid numbers");
        lastWinningNumbers = numbers;
        lastDrawTime = block.timestamp;
        
        emit WinningNumbersGenerated(block.timestamp / 1 days, numbers, block.timestamp);
    }
    
    /**
     * @dev Get request history for analytics
     */
    function getRequestHistory(uint256 requestId) external view returns (
        uint256 gameDay,
        address requester,
        uint256 timestamp,
        bool fulfilled,
        uint8[4] memory randomNumbers
    ) {
        require(randomRequests[requestId].requestId == requestId, "Invalid request ID");
        
        RandomRequest memory request = randomRequests[requestId];
        return (
            request.gameDay,
            request.requester,
            request.timestamp,
            request.fulfilled,
            request.randomNumbers
        );
    }
    
    /**
     * @dev Check if we can request new random numbers
     */
    function canRequestRandom(uint256 gameDay) external view returns (bool) {
        return gameDayToRequestId[gameDay] == 0;
    }
    
    /**
     * @dev Get total requests made
     */
    function getTotalRequests() external view returns (uint256) {
        return lastRequestId;
    }
} 