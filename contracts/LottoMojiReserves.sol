// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LottoMojiReserves
 * @dev NEW SYSTEM: Reserves receive 20% daily and refill main pools when needed
 */
contract LottoMojiReserves is ReentrancyGuard, Ownable {
    IERC20 public immutable usdcToken;
    address public immutable lotteryContract;
    
    // Reserve constants
    uint256 public constant DAILY_RESERVE_PERCENTAGE = 20;
    
    // Reserve pools for each prize level - NOW ACCUMULATE DAILY
    struct ReservePools {
        uint256 firstPrizeReserve1;     // Accumulates 20% of first prize daily
        uint256 secondPrizeReserve2;    // Accumulates 20% of second prize daily
        uint256 thirdPrizeReserve3;     // Accumulates 20% of third prize daily
    }
    
    // Daily reserve tracking
    struct DailyReserveContribution {
        uint256 gameDay;
        uint256 firstContribution;
        uint256 secondContribution;
        uint256 thirdContribution;
        uint256 totalContribution;
        uint256 timestamp;
    }
    
    // State variables
    ReservePools public reserves;
    mapping(uint256 => DailyReserveContribution) public dailyContributions;
    
    // Statistics
    uint256 public totalReservesReceived;
    uint256 public totalReservesUsedForRefills;
    uint256 public lastContributionTime;
    uint256 public totalDaysWithContributions;
    
    // Events
    event DailyReservesReceived(
        uint256 indexed gameDay,
        uint256 firstAmount,
        uint256 secondAmount,
        uint256 thirdAmount,
        uint256 totalAmount
    );
    
    event ReserveUsedForRefill(
        uint8 indexed prizeLevel,
        uint256 amountUsed,
        uint256 remainingReserve,
        uint256 gameDay
    );
    
    event ReserveStatisticsUpdated(
        uint256 totalReceived,
        uint256 totalUsedForRefills,
        uint256 currentTotalReserves
    );
    
    modifier onlyLottery() {
        require(msg.sender == lotteryContract, "Only lottery contract");
        _;
    }
    
    constructor(address _usdcToken, address _lotteryContract) {
        usdcToken = IERC20(_usdcToken);
        lotteryContract = _lotteryContract;
    }
    
    /**
     * @dev Receive daily reserves (20% of each prize pool)
     */
    function receiveDailyReserves(
        uint256 gameDay,
        uint256 firstAmount,
        uint256 secondAmount,
        uint256 thirdAmount
    ) external onlyLottery nonReentrant {
        require(firstAmount > 0 || secondAmount > 0 || thirdAmount > 0, "No reserves to receive");
        require(dailyContributions[gameDay].gameDay == 0, "Already received reserves for this day");
        
        // Add to reserves
        reserves.firstPrizeReserve1 += firstAmount;
        reserves.secondPrizeReserve2 += secondAmount;
        reserves.thirdPrizeReserve3 += thirdAmount;
        
        uint256 totalAmount = firstAmount + secondAmount + thirdAmount;
        
        // Track daily contribution
        dailyContributions[gameDay] = DailyReserveContribution({
            gameDay: gameDay,
            firstContribution: firstAmount,
            secondContribution: secondAmount,
            thirdContribution: thirdAmount,
            totalContribution: totalAmount,
            timestamp: block.timestamp
        });
        
        // Update statistics
        totalReservesReceived += totalAmount;
        lastContributionTime = block.timestamp;
        totalDaysWithContributions++;
        
        emit DailyReservesReceived(gameDay, firstAmount, secondAmount, thirdAmount, totalAmount);
        emit ReserveStatisticsUpdated(totalReservesReceived, totalReservesUsedForRefills, getTotalReserves());
    }
    
    /**
     * @dev Refill main pool when reserves are needed for prize payments
     */
    function refillMainPool(
        uint8 prizeLevel,
        uint256 amountNeeded
    ) external onlyLottery nonReentrant {
        require(prizeLevel >= 1 && prizeLevel <= 3, "Invalid prize level");
        require(amountNeeded > 0, "Amount must be positive");
        
        uint256 availableReserve = getReserveTotal(prizeLevel);
        require(availableReserve >= amountNeeded, "Insufficient reserve for refill");
        
        // Deduct from specific reserve
        if (prizeLevel == 1) {
            reserves.firstPrizeReserve1 -= amountNeeded;
        } else if (prizeLevel == 2) {
            reserves.secondPrizeReserve2 -= amountNeeded;
        } else if (prizeLevel == 3) {
            reserves.thirdPrizeReserve3 -= amountNeeded;
        }
        
        // Transfer USDC back to lottery contract for prize payment
        require(
            usdcToken.transfer(lotteryContract, amountNeeded),
            "Refill transfer failed"
        );
        
        // Update statistics
        totalReservesUsedForRefills += amountNeeded;
        
        emit ReserveUsedForRefill(
            prizeLevel,
            amountNeeded,
            getReserveTotal(prizeLevel),
            block.timestamp / 1 days
        );
        
        emit ReserveStatisticsUpdated(totalReservesReceived, totalReservesUsedForRefills, getTotalReserves());
    }
    
    /**
     * @dev Get total reserve for specific prize level
     */
    function getReserveTotal(uint8 prizeLevel) public view returns (uint256) {
        if (prizeLevel == 1) return reserves.firstPrizeReserve1;
        if (prizeLevel == 2) return reserves.secondPrizeReserve2;
        if (prizeLevel == 3) return reserves.thirdPrizeReserve3;
        return 0;
    }
    
    /**
     * @dev Get all current reserves
     */
    function getAllReserves() external view returns (
        uint256 firstReserve,
        uint256 secondReserve,
        uint256 thirdReserve,
        uint256 totalReserves
    ) {
        firstReserve = reserves.firstPrizeReserve1;
        secondReserve = reserves.secondPrizeReserve2;
        thirdReserve = reserves.thirdPrizeReserve3;
        totalReserves = firstReserve + secondReserve + thirdReserve;
    }
    
    /**
     * @dev Get total of all reserves
     */
    function getTotalReserves() public view returns (uint256) {
        return reserves.firstPrizeReserve1 + reserves.secondPrizeReserve2 + reserves.thirdPrizeReserve3;
    }
    
    /**
     * @dev Get daily contribution for specific day
     */
    function getDailyContribution(uint256 gameDay) external view returns (DailyReserveContribution memory) {
        return dailyContributions[gameDay];
    }
    
    /**
     * @dev Get reserve statistics
     */
    function getReserveStatistics() external view returns (
        uint256 totalReceived,
        uint256 totalUsedForRefills,
        uint256 currentTotalReserves,
        uint256 lastContribution,
        uint256 totalDays,
        uint256 averageDailyContribution
    ) {
        totalReceived = totalReservesReceived;
        totalUsedForRefills = totalReservesUsedForRefills;
        currentTotalReserves = getTotalReserves();
        lastContribution = lastContributionTime;
        totalDays = totalDaysWithContributions;
        averageDailyContribution = totalDays > 0 ? totalReservesReceived / totalDays : 0;
    }
    
    /**
     * @dev Get reserve efficiency (how much is available vs used)
     */
    function getReserveEfficiency() external view returns (
        uint256 utilizationPercentage,
        uint256 currentCoveragePercentage
    ) {
        if (totalReservesReceived > 0) {
            utilizationPercentage = (totalReservesUsedForRefills * 100) / totalReservesReceived;
        }
        
        uint256 currentReserves = getTotalReserves();
        if (totalReservesReceived > 0) {
            currentCoveragePercentage = (currentReserves * 100) / totalReservesReceived;
        }
    }
    
    /**
     * @dev Get reserves history for multiple days
     */
    function getReservesHistory(uint256 fromDay, uint256 toDay) 
        external 
        view 
        returns (DailyReserveContribution[] memory) 
    {
        require(fromDay <= toDay, "Invalid date range");
        require(toDay - fromDay <= 30, "Range too large"); // Max 30 days
        
        uint256 length = toDay - fromDay + 1;
        DailyReserveContribution[] memory history = new DailyReserveContribution[](length);
        
        for (uint256 i = 0; i < length; i++) {
            history[i] = dailyContributions[fromDay + i];
        }
        
        return history;
    }
    
    /**
     * @dev Check if reserve can cover specific amount for prize level
     */
    function canCoverAmount(uint8 prizeLevel, uint256 amount) external view returns (bool) {
        return getReserveTotal(prizeLevel) >= amount;
    }
    
    /**
     * @dev Get reserve coverage for all prize levels
     */
    function getReserveCoverage() external view returns (
        uint256 firstPrizeCoverage,
        uint256 secondPrizeCoverage,
        uint256 thirdPrizeCoverage,
        bool canCoverTypicalPrizes
    ) {
        firstPrizeCoverage = reserves.firstPrizeReserve1;
        secondPrizeCoverage = reserves.secondPrizeReserve2;
        thirdPrizeCoverage = reserves.thirdPrizeReserve3;
        
        // Assume typical prizes are 100 USDC each level
        uint256 typicalPrize = 100 * 10**6; // 100 USDC
        canCoverTypicalPrizes = (firstPrizeCoverage >= typicalPrize) && 
                               (secondPrizeCoverage >= typicalPrize) && 
                               (thirdPrizeCoverage >= typicalPrize);
    }
    
    /**
     * @dev Get current reserve state summary
     */
    function getReserveStateSummary() external view returns (
        uint256 totalReserves,
        uint256 daysSinceLastContribution,
        bool allReservesHealthy,
        string memory status
    ) {
        totalReserves = getTotalReserves();
        
        if (lastContributionTime > 0) {
            daysSinceLastContribution = (block.timestamp - lastContributionTime) / 1 days;
        }
        
        // Check if all reserves are healthy (> 50 USDC each)
        uint256 healthyThreshold = 50 * 10**6; // 50 USDC
        allReservesHealthy = (reserves.firstPrizeReserve1 >= healthyThreshold) &&
                            (reserves.secondPrizeReserve2 >= healthyThreshold) &&
                            (reserves.thirdPrizeReserve3 >= healthyThreshold);
        
        if (totalReserves == 0) {
            status = "Empty - No reserves accumulated";
        } else if (!allReservesHealthy) {
            status = "Low - Some reserves below healthy threshold";
        } else if (daysSinceLastContribution > 2) {
            status = "Stale - No recent contributions";
        } else {
            status = "Healthy - All reserves active";
        }
    }
    
    /**
     * @dev Predict future reserves based on current daily rate
     */
    function predictFutureReserves(uint256 daysInFuture) 
        external 
        view 
        returns (
            uint256 predictedFirstReserve,
            uint256 predictedSecondReserve,
            uint256 predictedThirdReserve,
            uint256 predictedTotal
        ) 
    {
        if (totalDaysWithContributions == 0) {
            return (reserves.firstPrizeReserve1, reserves.secondPrizeReserve2, reserves.thirdPrizeReserve3, getTotalReserves());
        }
        
        // Calculate average daily contributions
        uint256 avgFirstDaily = 0;
        uint256 avgSecondDaily = 0;
        uint256 avgThirdDaily = 0;
        
        // Simple average based on recent contributions (last 7 days)
        uint256 currentDay = block.timestamp / 1 days;
        uint256 sampleDays = 7;
        uint256 sampleCount = 0;
        
        for (uint256 i = 0; i < sampleDays && currentDay >= i; i++) {
            uint256 day = currentDay - i;
            if (dailyContributions[day].gameDay != 0) {
                avgFirstDaily += dailyContributions[day].firstContribution;
                avgSecondDaily += dailyContributions[day].secondContribution;
                avgThirdDaily += dailyContributions[day].thirdContribution;
                sampleCount++;
            }
        }
        
        if (sampleCount > 0) {
            avgFirstDaily = avgFirstDaily / sampleCount;
            avgSecondDaily = avgSecondDaily / sampleCount;
            avgThirdDaily = avgThirdDaily / sampleCount;
        }
        
        predictedFirstReserve = reserves.firstPrizeReserve1 + (avgFirstDaily * daysInFuture);
        predictedSecondReserve = reserves.secondPrizeReserve2 + (avgSecondDaily * daysInFuture);
        predictedThirdReserve = reserves.thirdPrizeReserve3 + (avgThirdDaily * daysInFuture);
        predictedTotal = predictedFirstReserve + predictedSecondReserve + predictedThirdReserve;
    }
    
    // Admin functions
    function emergencyWithdrawReserves() external onlyOwner {
        uint256 totalReserves = getTotalReserves();
        
        if (totalReserves > 0) {
            // Reset all reserves
            reserves.firstPrizeReserve1 = 0;
            reserves.secondPrizeReserve2 = 0;
            reserves.thirdPrizeReserve3 = 0;
            
            require(
                usdcToken.transfer(owner(), totalReserves),
                "Emergency withdrawal failed"
            );
        }
    }
} 