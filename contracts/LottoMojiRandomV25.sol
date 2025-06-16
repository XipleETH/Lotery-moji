// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract LottoMojiRandomV25 is VRFConsumerBaseV2Plus {
    
    // Base Sepolia VRF v2.5 Coordinator
    address constant VRF_COORDINATOR = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;
    
    // Base Sepolia key hash for VRF v2.5
    bytes32 constant KEY_HASH = 0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71;
    
    // VRF Configuration
    uint256 public subscriptionId; // uint256 for VRF v2.5
    uint32 constant CALLBACK_GAS_LIMIT = 200000;
    uint16 constant REQUEST_CONFIRMATIONS = 3;
    uint32 constant NUM_WORDS = 4;
    
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
    event RandomNumbersRequested(uint256 indexed requestId, uint256 indexed gameDay, address requester);
    event RandomNumbersFulfilled(uint256 indexed requestId, uint256 indexed gameDay, uint8[4] randomNumbers);
    event WinningNumbersGenerated(uint256 indexed gameDay, uint8[4] winningNumbers, uint256 timestamp);
    
    modifier onlyLottery() {
        require(msg.sender == lotteryContract, "Only lottery contract");
        _;
    }
    
    constructor(uint256 _subscriptionId, address _lotteryContract)
        VRFConsumerBaseV2Plus(VRF_COORDINATOR)
    {
        subscriptionId = _subscriptionId;
        lotteryContract = _lotteryContract;
        // Note: Ownership is automatically set by VRFConsumerBaseV2Plus constructor
    }
    
    function requestRandomNumbers(uint256 gameDay) external onlyLottery returns (uint256 requestId) {
        require(gameDayToRequestId[gameDay] == 0, "Already requested for this game day");
        
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: KEY_HASH,
                subId: subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: CALLBACK_GAS_LIMIT,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );
        
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
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        require(randomRequests[requestId].requestId == requestId, "Invalid request ID");
        require(!randomRequests[requestId].fulfilled, "Request already fulfilled");
        require(randomWords.length == NUM_WORDS, "Invalid number of random words");
        
        uint8[4] memory randomNumbers;
        for (uint256 i = 0; i < NUM_WORDS; i++) {
            randomNumbers[i] = uint8(randomWords[i] % 25);
        }
        
        randomRequests[requestId].randomNumbers = randomNumbers;
        randomRequests[requestId].fulfilled = true;
        
        lastWinningNumbers = randomNumbers;
        lastDrawTime = block.timestamp;
        
        uint256 gameDay = randomRequests[requestId].gameDay;
        
        emit RandomNumbersFulfilled(requestId, gameDay, randomNumbers);
        emit WinningNumbersGenerated(gameDay, randomNumbers, block.timestamp);
    }
    
    function generateWinningNumbers() external view onlyLottery returns (uint8[4] memory) {
        if (lastDrawTime > 0) {
            return lastWinningNumbers;
        }
        
        uint8[4] memory numbers;
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.number,
            msg.sender
        )));
        
        for (uint256 i = 0; i < 4; i++) {
            numbers[i] = uint8((seed >> (i * 8)) % 25);
        }
        
        return numbers;
    }
    
    function getWinningNumbers(uint256 gameDay) external view returns (uint8[4] memory) {
        uint256 requestId = gameDayToRequestId[gameDay];
        require(requestId != 0, "No request for this game day");
        require(randomRequests[requestId].fulfilled, "Random numbers not fulfilled yet");
        
        return randomRequests[requestId].randomNumbers;
    }
    
    function areRandomNumbersReady(uint256 gameDay) external view returns (bool) {
        uint256 requestId = gameDayToRequestId[gameDay];
        if (requestId == 0) return false;
        return randomRequests[requestId].fulfilled;
    }
    
    function getRequestStatus(uint256 requestId) external view returns (
        bool fulfilled,
        uint8[4] memory randomNumbers,
        uint256 gameDay
    ) {
        require(randomRequests[requestId].requestId == requestId, "Invalid request ID");
        
        RandomRequest memory request = randomRequests[requestId];
        return (request.fulfilled, request.randomNumbers, request.gameDay);
    }
    
    function getLastWinningNumbers() external view returns (uint8[4] memory, uint256) {
        return (lastWinningNumbers, lastDrawTime);
    }
    
    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }
    
    function emergencySetWinningNumbers(uint8[4] memory numbers) external onlyOwner {
        require(_validateNumbers(numbers), "Invalid numbers");
        lastWinningNumbers = numbers;
        lastDrawTime = block.timestamp;
        
        emit WinningNumbersGenerated(block.timestamp / 1 days, numbers, block.timestamp);
    }
    
    function _validateNumbers(uint8[4] memory numbers) internal pure returns (bool) {
        for (uint256 i = 0; i < 4; i++) {
            if (numbers[i] > 24) return false;
        }
        return true;
    }
    
    function getVRFConfig() external view returns (
        address coordinator,
        bytes32 keyHash,
        uint256 subId,
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
} 