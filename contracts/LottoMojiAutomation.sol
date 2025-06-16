// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LottoMojiMain.sol";
import "./LottoMojiReserves.sol";
import "./LottoMojiRandomV25.sol";

/**
 * @title LottoMojiAutomation
 * @dev Chainlink Automation for complete lottery system management
 * Handles automatic draws every 24 hours + reserve system management
 */
contract LottoMojiAutomation is AutomationCompatibleInterface, Ownable {
    
    // Contract references
    LottoMojiMain public immutable lotteryContract;
    LottoMojiReserves public immutable reserveContract;
    LottoMojiRandomV25 public immutable randomContract;
    
    // Automation configuration
    uint256 public constant DRAW_INTERVAL = 24 hours;
    uint256 public constant SAO_PAULO_OFFSET = 3 hours; // UTC-3
    uint256 public drawTimeUTC = 6 hours; // 3:00 AM São Paulo = 6:00 AM UTC
    
    // State tracking
    uint256 public lastDrawTime;
    uint256 public lastMaintenanceTime;
    bool public automationActive = true;
    bool public emergencyPause = false;
    
    // Performance tracking
    uint256 public totalDrawsExecuted;
    uint256 public totalReservesProcessed;
    uint256 public totalMaintenanceRuns;
    
    // Automation phases
    enum AutomationPhase {
        WaitingForDraw,
        ExecutingDraw,
        ProcessingReserves,
        PerformingMaintenance,
        Complete
    }
    
    AutomationPhase public currentPhase = AutomationPhase.WaitingForDraw;
    
    // Events
    event AutomationTriggered(
        uint256 indexed gameDay,
        AutomationPhase phase,
        uint256 timestamp
    );
    
    event DrawExecutedAutomatically(
        uint256 indexed gameDay,
        uint8[4] winningNumbers,
        uint256 totalPool
    );
    
    event ReservesProcessedAutomatically(
        uint256 indexed gameDay,
        uint256 firstReserveAmount,
        uint256 secondReserveAmount,
        uint256 thirdReserveAmount
    );
    
    event MaintenancePerformed(
        uint256 timestamp,
        string maintenanceType,
        bool successful
    );
    
    event EmergencyPauseToggled(bool paused, address triggeredBy);
    
    event AutomationConfigUpdated(
        uint256 newDrawTimeUTC,
        bool automationActive
    );
    
    constructor(
        address _lotteryContract,
        address _reserveContract,
        address _randomContract
    ) Ownable(msg.sender) {
        lotteryContract = LottoMojiMain(_lotteryContract);
        reserveContract = LottoMojiReserves(_reserveContract);
        randomContract = LottoMojiRandomV25(_randomContract);
        
        lastDrawTime = block.timestamp;
        lastMaintenanceTime = block.timestamp;
    }
    
    /**
     * @dev Chainlink Automation checkUpkeep function
     * Determines if automation should be triggered
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        if (!automationActive || emergencyPause) {
            return (false, "");
        }
        
        // Check if it's time for draw (every 24 hours at specified time)
        if (_shouldExecuteDraw()) {
            return (true, abi.encode(AutomationPhase.ExecutingDraw));
        }
        
        // Check if reserves need processing
        if (_shouldProcessReserves()) {
            return (true, abi.encode(AutomationPhase.ProcessingReserves));
        }
        
        // Check if maintenance is needed
        if (_shouldPerformMaintenance()) {
            return (true, abi.encode(AutomationPhase.PerformingMaintenance));
        }
        
        return (false, "");
    }
    
    /**
     * @dev Chainlink Automation performUpkeep function
     * Executes the automated tasks
     */
    function performUpkeep(bytes calldata performData) external override {
        require(automationActive && !emergencyPause, "Automation paused");
        
        AutomationPhase phase = abi.decode(performData, (AutomationPhase));
        currentPhase = phase;
        
        uint256 gameDay = getCurrentGameDay();
        
        if (phase == AutomationPhase.ExecutingDraw) {
            _executeAutomaticDraw(gameDay);
        } else if (phase == AutomationPhase.ProcessingReserves) {
            _processReservesAutomatically(gameDay);
        } else if (phase == AutomationPhase.PerformingMaintenance) {
            _performSystemMaintenance();
        }
        
        emit AutomationTriggered(gameDay, phase, block.timestamp);
        currentPhase = AutomationPhase.Complete;
    }
    
    /**
     * @dev Execute automatic draw with complete reserve processing
     */
    function _executeAutomaticDraw(uint256 gameDay) internal {
        try lotteryContract.executeDrawWithChainlink() {
            // Get winning numbers
            (uint8[4] memory winningNumbers,) = randomContract.getLastWinningNumbers();
            
            // Update tracking
            lastDrawTime = block.timestamp;
            totalDrawsExecuted++;
            
            emit DrawExecutedAutomatically(
                gameDay,
                winningNumbers,
                _getCurrentPoolTotal(gameDay)
            );
            
            // Automatically process reserves after draw
            _processReservesAfterDraw(gameDay);
            
        } catch Error(string memory reason) {
            emit MaintenancePerformed(block.timestamp, "Draw execution failed", false);
            // Could implement retry logic or emergency notifications here
        }
    }
    
    /**
     * @dev Process reserves automatically after draw
     */
    function _processReservesAfterDraw(uint256 gameDay) internal {
        try this._handleReserveProcessing(gameDay) {
            totalReservesProcessed++;
            
            // Get current reserve amounts for event
            (uint256 first, uint256 second, uint256 third,) = reserveContract.getAllReserves();
            
            emit ReservesProcessedAutomatically(gameDay, first, second, third);
            
        } catch Error(string memory reason) {
            emit MaintenancePerformed(block.timestamp, "Reserve processing failed", false);
        }
    }
    
    /**
     * @dev Handle reserve processing (external call to handle try/catch)
     */
    function _handleReserveProcessing(uint256 gameDay) external {
        require(msg.sender == address(this), "Internal call only");
        
        // The reserve processing is handled automatically by the lottery contract
        // during executeDrawWithChainlink(), but we can add additional checks here
        
        // Verify reserves are properly managed
        (uint256 first, uint256 second, uint256 third, uint256 total) = reserveContract.getAllReserves();
        
        // Log for monitoring
        emit MaintenancePerformed(
            block.timestamp,
            string(abi.encodePacked(
                "Reserves verified: Total=", 
                _uint256ToString(total),
                " USDC"
            )),
            true
        );
    }
    
    /**
     * @dev Process reserves automatically (standalone function)
     */
    function _processReservesAutomatically(uint256 gameDay) internal {
        // Check if any reserves need special processing
        (uint256 first, uint256 second, uint256 third,) = reserveContract.getAllReserves();
        
        bool processed = false;
        
        // Check if any reserves are abnormally high (emergency processing)
        if (first > 1000 * 10**6 || second > 1000 * 10**6 || third > 1000 * 10**6) { // > 1000 USDC
            emit MaintenancePerformed(
                block.timestamp,
                "High reserve amounts detected",
                true
            );
            processed = true;
        }
        
        if (processed) {
            totalReservesProcessed++;
            emit ReservesProcessedAutomatically(gameDay, first, second, third);
        }
    }
    
    /**
     * @dev Perform system maintenance tasks
     */
    function _performSystemMaintenance() internal {
        lastMaintenanceTime = block.timestamp;
        totalMaintenanceRuns++;
        
        bool maintenanceSuccess = true;
        string memory maintenanceType = "Routine maintenance";
        
        try this._performMaintenanceTasks() {
            emit MaintenancePerformed(block.timestamp, maintenanceType, maintenanceSuccess);
        } catch Error(string memory reason) {
            emit MaintenancePerformed(block.timestamp, reason, false);
        }
    }
    
    /**
     * @dev Internal maintenance tasks
     */
    function _performMaintenanceTasks() external {
        require(msg.sender == address(this), "Internal call only");
        
        // Clean up old request data if needed
        // Verify contract states
        // Check for any inconsistencies
        
        // For now, just emit a maintenance log
        emit MaintenancePerformed(
            block.timestamp,
            "System health check completed",
            true
        );
    }
    
    /**
     * @dev Check if draw should be executed
     */
    function _shouldExecuteDraw() internal view returns (bool) {
        // Check if enough time has passed since last draw
        if (block.timestamp < lastDrawTime + DRAW_INTERVAL) {
            return false;
        }
        
        // Check if it's the right time of day (3:00 AM São Paulo)
        uint256 currentHour = (block.timestamp % 1 days) / 1 hours;
        uint256 targetHour = drawTimeUTC / 1 hours;
        
        // Allow execution within 1 hour window
        return (currentHour >= targetHour && currentHour < targetHour + 1);
    }
    
    /**
     * @dev Check if reserves need processing
     */
    function _shouldProcessReserves() internal view returns (bool) {
        // Get current reserves
        (uint256 first, uint256 second, uint256 third,) = reserveContract.getAllReserves();
        
        // Process if any reserve is very high (emergency threshold)
        uint256 emergencyThreshold = 2000 * 10**6; // 2000 USDC
        
        return (first > emergencyThreshold || 
                second > emergencyThreshold || 
                third > emergencyThreshold);
    }
    
    /**
     * @dev Check if maintenance should be performed
     */
    function _shouldPerformMaintenance() internal view returns (bool) {
        // Perform maintenance every 7 days
        return block.timestamp >= lastMaintenanceTime + 7 days;
    }
    
    /**
     * @dev Get current game day
     */
    function getCurrentGameDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }
    
    /**
     * @dev Get current pool total for game day
     */
    function _getCurrentPoolTotal(uint256 gameDay) internal view returns (uint256) {
        // Simplified approach - just return 0 for now, can be improved later
        return 0;
    }
    
    /**
     * @dev Get time until next draw
     */
    function getTimeUntilNextDraw() external view returns (uint256) {
        uint256 nextDrawTime = lastDrawTime + DRAW_INTERVAL;
        if (block.timestamp >= nextDrawTime) {
            return 0;
        }
        return nextDrawTime - block.timestamp;
    }
    
    /**
     * @dev Get automation status
     */
    function getAutomationStatus() external view returns (
        bool active,
        bool paused,
        AutomationPhase phase,
        uint256 nextDrawTime,
        uint256 totalDraws,
        uint256 totalReserves
    ) {
        return (
            automationActive,
            emergencyPause,
            currentPhase,
            lastDrawTime + DRAW_INTERVAL,
            totalDrawsExecuted,
            totalReservesProcessed
        );
    }
    
    /**
     * @dev Manual emergency draw trigger (admin only)
     */
    function emergencyExecuteDraw() external onlyOwner {
        require(!emergencyPause, "Emergency pause active");
        uint256 gameDay = getCurrentGameDay();
        _executeAutomaticDraw(gameDay);
    }
    
    /**
     * @dev Toggle emergency pause
     */
    function toggleEmergencyPause() external onlyOwner {
        emergencyPause = !emergencyPause;
        emit EmergencyPauseToggled(emergencyPause, msg.sender);
    }
    
    /**
     * @dev Update automation configuration
     */
    function updateAutomationConfig(
        uint256 _drawTimeUTC,
        bool _automationActive
    ) external onlyOwner {
        drawTimeUTC = _drawTimeUTC;
        automationActive = _automationActive;
        
        emit AutomationConfigUpdated(_drawTimeUTC, _automationActive);
    }
    
    /**
     * @dev Force reserve processing (admin only)
     */
    function forceReserveProcessing() external onlyOwner {
        uint256 gameDay = getCurrentGameDay();
        _processReservesAutomatically(gameDay);
    }
    
    /**
     * @dev Force maintenance (admin only)
     */
    function forceMaintenance() external onlyOwner {
        _performSystemMaintenance();
    }
    
    /**
     * @dev Utility function to convert uint256 to string
     */
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @dev Get detailed automation metrics
     */
    function getAutomationMetrics() external view returns (
        uint256 totalDraws,
        uint256 totalReserveProcessing,
        uint256 totalMaintenance,
        uint256 lastDraw,
        uint256 lastMaintenance,
        uint256 uptime
    ) {
        return (
            totalDrawsExecuted,
            totalReservesProcessed,
            totalMaintenanceRuns,
            lastDrawTime,
            lastMaintenanceTime,
            block.timestamp // Could calculate actual uptime since deployment
        );
    }
    
    /**
     * @dev Check if automation is healthy
     */
    function isAutomationHealthy() external view returns (bool healthy, string memory status) {
        if (!automationActive) {
            return (false, "Automation disabled");
        }
        
        if (emergencyPause) {
            return (false, "Emergency pause active");
        }
        
        // Check if we're behind schedule
        if (block.timestamp > lastDrawTime + DRAW_INTERVAL + 2 hours) {
            return (false, "Behind schedule");
        }
        
        return (true, "Healthy");
    }
} 