// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LottoMojiTickets.sol";
import "./LottoMojiReserves.sol";
import "./LottoMojiRandomV25.sol";

/**
 * @title LottoMojiMain
 * @dev Main lottery contract with automatic reserve system
 * NEW SYSTEM: 20% always goes to reserves, pools accumulate when no winners
 */
contract LottoMojiMain is ReentrancyGuard, Ownable {
    // 25 crypto/gambling themed emojis
    string[25] public EMOJIS = [
        "MONEY", "DIAMOND", "ROCKET", "SLOT", "DICE", "JOKER", "CASH", "TROPHY", "TARGET", "FIRE",
        "LIGHTNING", "MOON", "STAR", "SPARKLE", "CIRCUS", "ART", "UNICORN", "RAINBOW", "CLOVER", "THEATER", 
        "ROLLER", "GAME", "MEDAL", "CONFETTI", "BALLOON"
    ];
    
    // Constants for new reserve system
    uint256 public constant DAILY_RESERVE_PERCENTAGE = 20; // 20% goes to reserve DAILY
    uint256 public constant MAIN_POOL_PERCENTAGE = 80;     // 80% stays in main pools
    uint256 public constant TICKET_PRICE = 2 * 10**6;     // 2 USDC (6 decimals)
    
    // Prize distribution percentages (applied to the 80% main pool portion)
    uint256 public constant FIRST_PRIZE_PERCENTAGE = 80;
    uint256 public constant SECOND_PRIZE_PERCENTAGE = 10;
    uint256 public constant THIRD_PRIZE_PERCENTAGE = 5;
    uint256 public constant DEVELOPMENT_PERCENTAGE = 5;
    
    // Contract references
    IERC20 public immutable usdcToken;
    LottoMojiTickets public immutable ticketNFT;
    LottoMojiReserves public immutable reserveContract;
    LottoMojiRandomV25 public immutable randomContract;
    
    // Game state
    uint256 public currentGameDay;
    uint256 public lastDrawTime;
    bool public gameActive = true;
    
    // NEW: Accumulated main pools (accumulate when no winners)
    struct AccumulatedPools {
        uint256 firstPrizeAccumulated;   // Accumulates when no first prize winners
        uint256 secondPrizeAccumulated;  // Accumulates when no second prize winners
        uint256 thirdPrizeAccumulated;   // Accumulates when no third prize winners
        uint256 developmentAccumulated;  // Always gets paid to development
    }
    
    AccumulatedPools public mainPools;
    
    // Daily pool structure (now represents daily contributions)
    struct DailyPool {
        uint256 totalCollected;          // Total USDC collected this day
        uint256 mainPoolPortion;         // 80% portion that goes to main pools
        uint256 reservePortion;          // 20% portion that goes to reserves
        uint256 firstPrizeDaily;         // Daily contribution to first prize
        uint256 secondPrizeDaily;        // Daily contribution to second prize
        uint256 thirdPrizeDaily;         // Daily contribution to third prize
        uint256 developmentDaily;        // Daily contribution to development
        bool distributed;
        uint256 distributionTime;
        uint8[4] winningNumbers;
        bool drawn;
        bool reservesSent;               // NEW: Track if 20% sent to reserves
    }
    
    // Ticket structure
    struct Ticket {
        uint256 tokenId;
        address owner;
        uint8[4] numbers; // Indices 0-24 for the 25 emojis
        uint256 gameDay;
        bool isActive;
        uint256 purchaseTime;
        bool eligibleForReserve;
    }
    
    // Mappings
    mapping(uint256 => DailyPool) public dailyPools;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256[]) public gameDayTickets;
    mapping(address => uint256[]) public userTickets;
    
    // Counters
    uint256 public ticketCounter;
    
    // Events
    event TicketPurchased(
        uint256 indexed ticketId,
        address indexed buyer,
        uint8[4] numbers,
        uint256 gameDay
    );
    
    event DailyReservesSent(
        uint256 indexed gameDay,
        uint256 firstReserveAmount,
        uint256 secondReserveAmount,
        uint256 thirdReserveAmount,
        uint256 totalSent
    );
    
    event DrawExecuted(
        uint256 indexed gameDay,
        uint8[4] winningNumbers,
        uint256 totalMainPools
    );
    
    event PoolsAccumulated(
        uint256 indexed gameDay,
        uint8 prizeLevel,
        uint256 accumulatedAmount,
        uint256 newTotalAccumulated
    );
    
    event PrizeClaimed(
        uint256 indexed ticketId,
        address indexed winner,
        uint256 amount,
        uint8 prizeLevel,
        bool reserveUsedForRefill
    );
    
    event PoolsRefilledFromReserves(
        uint256 indexed gameDay,
        uint8 prizeLevel,
        uint256 amountUsed,
        uint256 remainingReserve
    );
    
    constructor(
        address _usdcToken,
        address _ticketNFT,
        address _reserveContract,
        address _randomContract
    ) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        ticketNFT = LottoMojiTickets(_ticketNFT);
        reserveContract = LottoMojiReserves(_reserveContract);
        randomContract = LottoMojiRandomV25(_randomContract);
        
        currentGameDay = getCurrentDay();
        lastDrawTime = block.timestamp;
    }
    
    /**
     * @dev Buy ticket with 4 emoji selection (0-24 indices)
     */
    function buyTicket(uint8[4] memory _numbers) external nonReentrant {
        require(gameActive, "Game not active");
        require(validateEmojiSelection(_numbers), "Invalid emoji selection");
        
        // Transfer USDC from user
        require(
            usdcToken.transferFrom(msg.sender, address(this), TICKET_PRICE),
            "USDC transfer failed"
        );
        
        uint256 gameDay = getCurrentDay();
        ticketCounter++;
        
        // Create ticket
        tickets[ticketCounter] = Ticket({
            tokenId: ticketCounter,
            owner: msg.sender,
            numbers: _numbers,
            gameDay: gameDay,
            isActive: true,
            purchaseTime: block.timestamp,
            eligibleForReserve: true
        });
        
        // Update arrays
        gameDayTickets[gameDay].push(ticketCounter);
        userTickets[msg.sender].push(ticketCounter);
        
        // Update daily pool
        dailyPools[gameDay].totalCollected += TICKET_PRICE;
        _updateDailyPoolDistribution(gameDay);
        
        // Mint NFT ticket
        ticketNFT.mintTicket(msg.sender, ticketCounter, _numbers, gameDay);
        
        emit TicketPurchased(ticketCounter, msg.sender, _numbers, gameDay);
    }
    
    /**
     * @dev NEW: Send daily reserves BEFORE draw (20% of each pool goes to reserves)
     */
    function sendDailyReservesToContract(uint256 gameDay) external {
        _sendDailyReservesToContract(gameDay);
    }
    
    /**
     * @dev Internal function to send daily reserves
     */
    function _sendDailyReservesToContract(uint256 gameDay) internal {
        require(!dailyPools[gameDay].reservesSent, "Reserves already sent for this day");
        require(dailyPools[gameDay].totalCollected > 0, "No funds collected this day");
        
        DailyPool storage pool = dailyPools[gameDay];
        
        // Calculate 20% for reserves from each prize pool
        uint256 firstReserveAmount = (pool.firstPrizeDaily * DAILY_RESERVE_PERCENTAGE) / 100;
        uint256 secondReserveAmount = (pool.secondPrizeDaily * DAILY_RESERVE_PERCENTAGE) / 100;
        uint256 thirdReserveAmount = (pool.thirdPrizeDaily * DAILY_RESERVE_PERCENTAGE) / 100;
        
        uint256 totalReserveAmount = firstReserveAmount + secondReserveAmount + thirdReserveAmount;
        
        // Transfer to reserve contract
        require(
            usdcToken.transfer(address(reserveContract), totalReserveAmount),
            "Reserve transfer failed"
        );
        
        // Update daily pool to reflect 80% remaining
        pool.firstPrizeDaily = pool.firstPrizeDaily - firstReserveAmount;
        pool.secondPrizeDaily = pool.secondPrizeDaily - secondReserveAmount;
        pool.thirdPrizeDaily = pool.thirdPrizeDaily - thirdReserveAmount;
        pool.reservesSent = true;
        
        // Send reserves to reserve contract
        reserveContract.receiveDailyReserves(
            gameDay,
            firstReserveAmount,
            secondReserveAmount,
            thirdReserveAmount
        );
        
        emit DailyReservesSent(
            gameDay,
            firstReserveAmount,
            secondReserveAmount,
            thirdReserveAmount,
            totalReserveAmount
        );
    }
    
    /**
     * @dev Execute draw with automatic pool management
     */
    function executeDrawWithChainlink() external {
        require(canExecuteDraw(), "Cannot execute draw yet");
        
        uint256 gameDay = getCurrentDay() - 1; // Draw for previous day
        require(!dailyPools[gameDay].drawn, "Already drawn");
        
        // FIRST: Send daily reserves if not sent yet
        if (!dailyPools[gameDay].reservesSent && dailyPools[gameDay].totalCollected > 0) {
            _sendDailyReservesToContract(gameDay);
        }
        
        // Get random numbers from Chainlink
        uint8[4] memory winningNumbers = randomContract.generateWinningNumbers();
        
        dailyPools[gameDay].winningNumbers = winningNumbers;
        dailyPools[gameDay].drawn = true;
        lastDrawTime = block.timestamp;
        
        // Process winners and accumulate pools
        _processDrawResults(gameDay, winningNumbers);
        
        emit DrawExecuted(gameDay, winningNumbers, _getTotalMainPools());
    }
    
    /**
     * @dev Process draw results - accumulate pools when no winners
     */
    function _processDrawResults(uint256 gameDay, uint8[4] memory winningNumbers) internal {
        uint256[] memory ticketIds = gameDayTickets[gameDay];
        
        // Count winners by prize level
        uint256 firstCount = 0;
        uint256 secondCount = 0;
        uint256 thirdCount = 0;
        
        for (uint256 i = 0; i < ticketIds.length; i++) {
            uint256 ticketId = ticketIds[i];
            uint8 prizeLevel = checkPrizeLevel(tickets[ticketId].numbers, winningNumbers);
            
            if (prizeLevel == 1) firstCount++;
            else if (prizeLevel == 2) secondCount++;
            else if (prizeLevel == 3) thirdCount++;
        }
        
        // Add daily contributions to main pools
        mainPools.firstPrizeAccumulated += dailyPools[gameDay].firstPrizeDaily;
        mainPools.secondPrizeAccumulated += dailyPools[gameDay].secondPrizeDaily;
        mainPools.thirdPrizeAccumulated += dailyPools[gameDay].thirdPrizeDaily;
        mainPools.developmentAccumulated += dailyPools[gameDay].developmentDaily;
        
        // If no winners, pools automatically accumulate (already added above)
        if (firstCount == 0) {
            emit PoolsAccumulated(gameDay, 1, dailyPools[gameDay].firstPrizeDaily, mainPools.firstPrizeAccumulated);
        }
        if (secondCount == 0) {
            emit PoolsAccumulated(gameDay, 2, dailyPools[gameDay].secondPrizeDaily, mainPools.secondPrizeAccumulated);
        }
        if (thirdCount == 0) {
            emit PoolsAccumulated(gameDay, 3, dailyPools[gameDay].thirdPrizeDaily, mainPools.thirdPrizeAccumulated);
        }
        
        // Development always gets paid
        if (mainPools.developmentAccumulated > 0) {
            require(
                usdcToken.transfer(owner(), mainPools.developmentAccumulated),
                "Development payment failed"
            );
            mainPools.developmentAccumulated = 0;
        }
        
        dailyPools[gameDay].distributed = true;
        dailyPools[gameDay].distributionTime = block.timestamp;
    }
    
    /**
     * @dev Claim prize with automatic reserve refill if needed
     */
    function claimPrize(uint256 ticketId) external nonReentrant {
        require(tickets[ticketId].owner == msg.sender, "Not ticket owner");
        require(tickets[ticketId].isActive, "Ticket already claimed");
        
        uint256 gameDay = tickets[ticketId].gameDay;
        require(dailyPools[gameDay].drawn, "Draw not executed");
        require(dailyPools[gameDay].distributed, "Prizes not distributed");
        
        uint8 prizeLevel = checkPrizeLevel(
            tickets[ticketId].numbers,
            dailyPools[gameDay].winningNumbers
        );
        
        require(prizeLevel > 0, "Not a winning ticket");
        
        tickets[ticketId].isActive = false;
        
        // Calculate prize amount and check if refill needed
        uint256 prizeAmount;
        bool reserveUsedForRefill = false;
        
        if (prizeLevel == 1) {
            uint256 winnerCount = _getPrizeCount(gameDay, 1);
            prizeAmount = mainPools.firstPrizeAccumulated / winnerCount;
            
            // Check if we need to refill from reserves
            if (prizeAmount > mainPools.firstPrizeAccumulated) {
                reserveUsedForRefill = _refillPoolFromReserve(1, prizeAmount - mainPools.firstPrizeAccumulated);
            }
            
            mainPools.firstPrizeAccumulated = mainPools.firstPrizeAccumulated > prizeAmount 
                ? mainPools.firstPrizeAccumulated - prizeAmount 
                : 0;
                
        } else if (prizeLevel == 2) {
            uint256 winnerCount = _getPrizeCount(gameDay, 2);
            prizeAmount = mainPools.secondPrizeAccumulated / winnerCount;
            
            if (prizeAmount > mainPools.secondPrizeAccumulated) {
                reserveUsedForRefill = _refillPoolFromReserve(2, prizeAmount - mainPools.secondPrizeAccumulated);
            }
            
            mainPools.secondPrizeAccumulated = mainPools.secondPrizeAccumulated > prizeAmount 
                ? mainPools.secondPrizeAccumulated - prizeAmount 
                : 0;
                
        } else if (prizeLevel == 3) {
            uint256 winnerCount = _getPrizeCount(gameDay, 3);
            prizeAmount = mainPools.thirdPrizeAccumulated / winnerCount;
            
            if (prizeAmount > mainPools.thirdPrizeAccumulated) {
                reserveUsedForRefill = _refillPoolFromReserve(3, prizeAmount - mainPools.thirdPrizeAccumulated);
            }
            
            mainPools.thirdPrizeAccumulated = mainPools.thirdPrizeAccumulated > prizeAmount 
                ? mainPools.thirdPrizeAccumulated - prizeAmount 
                : 0;
        }
        
        require(usdcToken.transfer(msg.sender, prizeAmount), "Prize transfer failed");
        
        emit PrizeClaimed(ticketId, msg.sender, prizeAmount, prizeLevel, reserveUsedForRefill);
    }
    
    /**
     * @dev Refill pool from reserves when needed
     */
    function _refillPoolFromReserve(uint8 prizeLevel, uint256 amountNeeded) internal returns (bool) {
        try reserveContract.refillMainPool(prizeLevel, amountNeeded) {
            emit PoolsRefilledFromReserves(getCurrentDay(), prizeLevel, amountNeeded, reserveContract.getReserveTotal(prizeLevel));
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Update daily pool distribution
     */
    function _updateDailyPoolDistribution(uint256 gameDay) internal {
        uint256 total = dailyPools[gameDay].totalCollected;
        
        // Split: 80% to main pools, 20% will go to reserves
        dailyPools[gameDay].mainPoolPortion = (total * MAIN_POOL_PERCENTAGE) / 100;
        dailyPools[gameDay].reservePortion = (total * DAILY_RESERVE_PERCENTAGE) / 100;
        
        // Distribute main pool portion according to percentages
        uint256 mainPortion = dailyPools[gameDay].mainPoolPortion;
        dailyPools[gameDay].firstPrizeDaily = (mainPortion * FIRST_PRIZE_PERCENTAGE) / 100;
        dailyPools[gameDay].secondPrizeDaily = (mainPortion * SECOND_PRIZE_PERCENTAGE) / 100;
        dailyPools[gameDay].thirdPrizeDaily = (mainPortion * THIRD_PRIZE_PERCENTAGE) / 100;
        dailyPools[gameDay].developmentDaily = (mainPortion * DEVELOPMENT_PERCENTAGE) / 100;
    }
    
    /**
     * @dev Get total accumulated main pools
     */
    function _getTotalMainPools() internal view returns (uint256) {
        return mainPools.firstPrizeAccumulated + 
               mainPools.secondPrizeAccumulated + 
               mainPools.thirdPrizeAccumulated + 
               mainPools.developmentAccumulated;
    }
    
    /**
     * @dev Validate emoji selection (0-24 indices)
     */
    function validateEmojiSelection(uint8[4] memory emojis) public pure returns (bool) {
        for (uint256 i = 0; i < 4; i++) {
            if (emojis[i] > 24) return false;
        }
        return true;
    }
    
    /**
     * @dev Check prize level for ticket
     */
    function checkPrizeLevel(uint8[4] memory ticket, uint8[4] memory winning) public pure returns (uint8) {
        // Check first prize: 4 exact in order
        bool exactOrder = true;
        for (uint256 i = 0; i < 4; i++) {
            if (ticket[i] != winning[i]) {
                exactOrder = false;
                break;
            }
        }
        if (exactOrder) return 1;
        
        // Check second prize: 4 exact any order
        if (_hasAllNumbers(ticket, winning)) return 2;
        
        // Check third prize: 3 exact in order
        uint256 exactOrderCount = 0;
        for (uint256 i = 0; i < 4; i++) {
            if (ticket[i] == winning[i]) exactOrderCount++;
        }
        if (exactOrderCount >= 3) return 3;
        
        // Check free ticket: 3 exact any order
        if (_countMatches(ticket, winning) >= 3) return 4;
        
        return 0;
    }
    
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }
    
    function canExecuteDraw() public view returns (bool) {
        return block.timestamp >= lastDrawTime + 24 hours;
    }
    
    function _hasAllNumbers(uint8[4] memory ticket, uint8[4] memory winning) internal pure returns (bool) {
        for (uint256 i = 0; i < 4; i++) {
            bool found = false;
            for (uint256 j = 0; j < 4; j++) {
                if (ticket[i] == winning[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        return true;
    }
    
    function _countMatches(uint8[4] memory ticket, uint8[4] memory winning) internal pure returns (uint256) {
        uint256 matches = 0;
        for (uint256 i = 0; i < 4; i++) {
            for (uint256 j = 0; j < 4; j++) {
                if (ticket[i] == winning[j]) {
                    matches++;
                    break;
                }
            }
        }
        return matches;
    }
    
    function _getPrizeCount(uint256 gameDay, uint8 prizeLevel) internal view returns (uint256) {
        uint256[] memory ticketIds = gameDayTickets[gameDay];
        uint256 count = 0;
        
        for (uint256 i = 0; i < ticketIds.length; i++) {
            if (checkPrizeLevel(tickets[ticketIds[i]].numbers, dailyPools[gameDay].winningNumbers) == prizeLevel) {
                count++;
            }
        }
        return count;
    }
    
    // View functions
    function getUserTickets(address user) external view returns (uint256[] memory) {
        return userTickets[user];
    }
    
    function getGameDayTickets(uint256 gameDay) external view returns (uint256[] memory) {
        return gameDayTickets[gameDay];
    }
    
    function getCurrentPool() external view returns (DailyPool memory) {
        return dailyPools[getCurrentDay()];
    }
    
    function getAccumulatedPools() external view returns (AccumulatedPools memory) {
        return mainPools;
    }
    
    function getTicket(uint256 ticketId) external view returns (Ticket memory) {
        return tickets[ticketId];
    }
    
    // Admin functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(usdcToken.transfer(owner(), balance), "Withdrawal failed");
    }
    
    function setGameActive(bool _active) external onlyOwner {
        gameActive = _active;
    }
} 