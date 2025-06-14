import { useState, useEffect, useCallback, useRef } from 'react';
import { UseLotteryReturn, DailyPool, ReservePools, PotentialWinnings, GameState } from '@/types/lottery';
import { 
  getCurrentPool, 
  getAllReserves, 
  buyTicket as buyTicketContract,
  claimPrize as claimPrizeContract,
  subscribeToTicketPurchases,
  subscribeToDrawExecutions,
  subscribeToReserveActivations,
  handleContractError,
  getLotteryContract
} from '@/utils/blockchain';
import { useWallet } from './useWallet';
import toast from 'react-hot-toast';

export const useLottery = (): UseLotteryReturn => {
  const { wallet, refreshWallet } = useWallet();
  
  // State
  const [gameState, setGameState] = useState<GameState>({
    currentGameDay: 0,
    lastDrawTime: 0,
    gameActive: true,
    nextDrawTime: 0,
    canExecuteDraw: false,
    timeUntilNextDraw: 0,
  });
  
  const [dailyPool, setDailyPool] = useState<DailyPool>({
    totalCollected: 0,
    firstPrize: 0,
    secondPrize: 0,
    thirdPrize: 0,
    development: 0,
    distributed: false,
    distributionTime: 0,
    winningNumbers: [],
    drawn: false,
    gameDay: 0,
  });
  
  const [reserves, setReserves] = useState<ReservePools>({
    firstPrizeReserve1: 0,
    secondPrizeReserve2: 0,
    thirdPrizeReserve3: 0,
    firstReserve1Activated: false,
    secondReserve2Activated: false,
    thirdReserve3Activated: false,
  });
  
  const [potentialWinnings, setPotentialWinnings] = useState<PotentialWinnings>({
    firstPrize: 0,
    secondPrize: 0,
    thirdPrize: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for intervals
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and start data fetching
  useEffect(() => {
    loadInitialData();
    setupEventListeners();
    startDataRefresh();
    startCountdownTimer();
    
    return () => {
      cleanup();
    };
  }, []);

  // Cleanup function
  const cleanup = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshGameState(),
        refreshDailyPool(),
        refreshReserves(),
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load lottery data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh game state
  const refreshGameState = async () => {
    try {
      const lotteryContract = await getLotteryContract();
      
      const [currentDay, canDraw] = await Promise.all([
        lotteryContract.getCurrentDay(),
        lotteryContract.canExecuteDraw(),
      ]);
      
      const currentGameDay = Number(currentDay);
      const nextDrawTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Next 24 hours approximation
      
      setGameState(prev => ({
        ...prev,
        currentGameDay,
        canExecuteDraw: canDraw,
        nextDrawTime,
        gameActive: true,
      }));
      
    } catch (err) {
      console.error('Error refreshing game state:', err);
    }
  };

  // Refresh daily pool
  const refreshDailyPool = async () => {
    try {
      const pool = await getCurrentPool();
      setDailyPool(pool);
    } catch (err) {
      console.error('Error refreshing daily pool:', err);
    }
  };

  // Refresh reserves
  const refreshReserves = async () => {
    try {
      const reserveData = await getAllReserves();
      setReserves(reserveData);
    } catch (err) {
      console.error('Error refreshing reserves:', err);
    }
  };

  // Calculate potential winnings (pool + reserves)
  useEffect(() => {
    setPotentialWinnings({
      firstPrize: dailyPool.firstPrize + reserves.firstPrizeReserve1,
      secondPrize: dailyPool.secondPrize + reserves.secondPrizeReserve2,
      thirdPrize: dailyPool.thirdPrize + reserves.thirdPrizeReserve3,
    });
  }, [dailyPool, reserves]);

  // Setup event listeners
  const setupEventListeners = () => {
    // Listen for ticket purchases
    subscribeToTicketPurchases((event) => {
      toast.success('New ticket purchased!');
      refreshDailyPool();
    });

    // Listen for draws
    subscribeToDrawExecutions((event) => {
      toast.success('🎉 Draw executed! Check your tickets!');
      refreshDailyPool();
      refreshGameState();
    });

    // Listen for reserve activations
    subscribeToReserveActivations((event) => {
      toast.success('💰 Reserve activated! Someone won big!');
      refreshReserves();
    });
  };

  // Start automatic data refresh
  const startDataRefresh = () => {
    updateIntervalRef.current = setInterval(() => {
      refreshDailyPool();
      refreshReserves();
      refreshGameState();
    }, 30000); // Refresh every 30 seconds
  };

  // Start countdown timer
  const startCountdownTimer = () => {
    countdownIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = prev.nextDrawTime - now;
        
        return {
          ...prev,
          timeUntilNextDraw: Math.max(0, timeLeft),
        };
      });
    }, 1000); // Update every second
  };

  // Buy ticket function
  const buyTicket = useCallback(async (selectedNumbers: number[]) => {
    if (!wallet.isConnected) {
      throw new Error('Please connect your wallet first');
    }

    if (!wallet.address) {
      throw new Error('Wallet address not found');
    }

    if (selectedNumbers.length !== 4) {
      throw new Error('Please select exactly 4 emojis');
    }

    if (selectedNumbers.some(n => n < 0 || n > 24)) {
      throw new Error('Invalid emoji selection');
    }

    setLoading(true);
    setError(null);

    try {
      // Check USDC balance
      if (!wallet.usdcBalance || wallet.usdcBalance < 2) {
        throw new Error('Insufficient USDC balance. You need at least 2 USDC.');
      }

      const txHash = await buyTicketContract(selectedNumbers);
      
      toast.success('Ticket purchase initiated!', {
        icon: '🎫',
        duration: 4000,
      });

      // Wait for transaction and refresh data
      setTimeout(() => {
        refreshDailyPool();
        refreshWallet();
        toast.success('Ticket purchased successfully!', {
          icon: '✅',
          duration: 4000,
        });
      }, 3000);

    } catch (err: any) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      toast.error(errorMessage, {
        icon: '❌',
        duration: 6000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, refreshWallet]);

  // Claim prize function
  const claimPrize = useCallback(async (ticketId: number) => {
    if (!wallet.isConnected) {
      throw new Error('Please connect your wallet first');
    }

    setLoading(true);
    setError(null);

    try {
      const txHash = await claimPrizeContract(ticketId);
      
      toast.success('Prize claim initiated!', {
        icon: '💰',
        duration: 4000,
      });

      // Wait for transaction and refresh data
      setTimeout(() => {
        refreshWallet();
        refreshReserves(); // Reserves might have been used
        toast.success('Prize claimed successfully!', {
          icon: '🎉',
          duration: 6000,
        });
      }, 3000);

    } catch (err: any) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      toast.error(errorMessage, {
        icon: '❌',
        duration: 6000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, refreshWallet]);

  // Manual refresh function
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshGameState(),
        refreshDailyPool(),
        refreshReserves(),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get formatted time until next draw
  const getTimeUntilNextDrawFormatted = useCallback(() => {
    const timeLeft = gameState.timeUntilNextDraw;
    
    if (timeLeft <= 0) {
      return 'Drawing now...';
    }
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [gameState.timeUntilNextDraw]);

  // Check if reserves are available
  const hasActiveReserves = useCallback(() => {
    return reserves.firstPrizeReserve1 > 0 || 
           reserves.secondPrizeReserve2 > 0 || 
           reserves.thirdPrizeReserve3 > 0;
  }, [reserves]);

  // Get total reserve amount
  const getTotalReserves = useCallback(() => {
    return reserves.firstPrizeReserve1 + 
           reserves.secondPrizeReserve2 + 
           reserves.thirdPrizeReserve3;
  }, [reserves]);

  // Calculate potential payout for specific prize level
  const getPotentialPayout = useCallback((prizeLevel: 1 | 2 | 3, winnerCount: number = 1) => {
    let baseAmount = 0;
    let reserveAmount = 0;
    
    switch (prizeLevel) {
      case 1:
        baseAmount = dailyPool.firstPrize;
        reserveAmount = reserves.firstPrizeReserve1;
        break;
      case 2:
        baseAmount = dailyPool.secondPrize;
        reserveAmount = reserves.secondPrizeReserve2;
        break;
      case 3:
        baseAmount = dailyPool.thirdPrize;
        reserveAmount = reserves.thirdPrizeReserve3;
        break;
    }
    
    return (baseAmount + reserveAmount) / winnerCount;
  }, [dailyPool, reserves]);

  return {
    gameState,
    dailyPool,
    reserves,
    potentialWinnings,
    buyTicket,
    claimPrize,
    loading,
    error,
    // Additional utilities
    refreshAll,
    getTimeUntilNextDrawFormatted,
    hasActiveReserves,
    getTotalReserves,
    getPotentialPayout,
  };
}; 