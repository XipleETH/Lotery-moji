import { ethers } from 'ethers';
import { ContractConfig, TransactionStatus, DailyPool, ReservePools, Ticket } from '@/types/lottery';

// Contract ABIs (simplified for key functions)
export const LOTTERY_ABI = [
  'function buyTicket(uint8[4] memory _numbers) external payable',
  'function claimPrize(uint256 ticketId) external',
  'function getCurrentPool() external view returns (tuple(uint256 totalCollected, uint256 firstPrize, uint256 secondPrize, uint256 thirdPrize, uint256 development, bool distributed, uint256 distributionTime, uint8[4] winningNumbers, bool drawn))',
  'function getTicket(uint256 ticketId) external view returns (tuple(uint256 tokenId, address owner, uint8[4] numbers, uint256 gameDay, bool isActive, uint256 purchaseTime, bool eligibleForReserve))',
  'function getUserTickets(address user) external view returns (uint256[] memory)',
  'function getCurrentDay() external view returns (uint256)',
  'function canExecuteDraw() external view returns (bool)',
  'function validateEmojiSelection(uint8[4] memory emojis) external pure returns (bool)',
  'function checkPrizeLevel(uint8[4] memory ticket, uint8[4] memory winning) external pure returns (uint8)',
  'event TicketPurchased(uint256 indexed ticketId, address indexed buyer, uint8[4] numbers, uint256 gameDay)',
  'event PrizeClaimed(uint256 indexed ticketId, address indexed winner, uint256 amount, uint8 prizeLevel, bool reserveActivated)',
  'event DrawExecuted(uint256 indexed gameDay, uint8[4] winningNumbers, uint256 totalPrizePool)'
];

export const RESERVES_ABI = [
  'function getAllReserves() external view returns (uint256 firstReserve, uint256 secondReserve, uint256 thirdReserve, uint256 totalReserves)',
  'function getReserveStatistics() external view returns (uint256 totalAccumulated, uint256 totalPaid, uint256 lastActivation, uint256 currentTotalReserves)',
  'function getDaysAccumulating() external view returns (uint256 firstDays, uint256 secondDays, uint256 thirdDays)',
  'function getReserveActivation(uint256 gameDay) external view returns (tuple(bool firstActivated, bool secondActivated, bool thirdActivated, uint256 activationTimestamp, uint256 firstAmount, uint256 secondAmount, uint256 thirdAmount))',
  'event ReserveAccumulated(uint8 indexed prizeLevel, uint256 amount, uint256 newTotal, uint256 gameDay)',
  'event ReserveActivated(uint8 indexed prizeLevel, uint256 reserveAmount, uint256 poolAmount, address[] winners, uint256 gameDay)'
];

export const USDC_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)'
];

export const TICKETS_ABI = [
  'function getTicketMetadata(uint256 tokenId) external view returns (tuple(uint256 tokenId, uint8[4] numbers, uint256 gameDay, uint256 purchaseTime, bool eligibleForReserve, string cryptoTheme, uint256 rarityScore))',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function getAllEmojis() external view returns (string[25] memory emojis, string[25] memory names, string[] memory rarities)'
];

export const AUTOMATION_ABI = [
  'function getAutomationStatus() external view returns (bool active, bool paused, uint8 phase, uint256 nextDrawTime, uint256 totalDraws, uint256 totalReserves)',
  'function getTimeUntilNextDraw() external view returns (uint256)',
  'function isAutomationHealthy() external view returns (bool healthy, string memory status)'
];

// Base Sepolia Configuration
export const BASE_SEPOLIA_CONFIG = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Contract addresses (will be set after deployment)
export const getContractConfig = (): ContractConfig => ({
  lotteryAddress: process.env.NEXT_PUBLIC_LOTTERY_ADDRESS || '',
  ticketsAddress: process.env.NEXT_PUBLIC_TICKETS_ADDRESS || '',
  reservesAddress: process.env.NEXT_PUBLIC_RESERVES_ADDRESS || '',
  randomAddress: process.env.NEXT_PUBLIC_RANDOM_ADDRESS || '',
  automationAddress: process.env.NEXT_PUBLIC_AUTOMATION_ADDRESS || '',
  usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
});

// Web3 Provider setup
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback RPC provider
  return new ethers.JsonRpcProvider(BASE_SEPOLIA_CONFIG.rpcUrl);
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

// Contract instances
export const getLotteryContract = async (signerRequired = false) => {
  const config = getContractConfig();
  if (!config.lotteryAddress) throw new Error('Lottery contract not deployed');
  
  if (signerRequired) {
    const signer = await getSigner();
    return new ethers.Contract(config.lotteryAddress, LOTTERY_ABI, signer);
  } else {
    const provider = getProvider();
    return new ethers.Contract(config.lotteryAddress, LOTTERY_ABI, provider);
  }
};

export const getReservesContract = async (signerRequired = false) => {
  const config = getContractConfig();
  if (!config.reservesAddress) throw new Error('Reserves contract not deployed');
  
  if (signerRequired) {
    const signer = await getSigner();
    return new ethers.Contract(config.reservesAddress, RESERVES_ABI, signer);
  } else {
    const provider = getProvider();
    return new ethers.Contract(config.reservesAddress, RESERVES_ABI, provider);
  }
};

export const getUSDCContract = async (signerRequired = false) => {
  const config = getContractConfig();
  
  if (signerRequired) {
    const signer = await getSigner();
    return new ethers.Contract(config.usdcAddress, USDC_ABI, signer);
  } else {
    const provider = getProvider();
    return new ethers.Contract(config.usdcAddress, USDC_ABI, provider);
  }
};

export const getTicketsContract = async (signerRequired = false) => {
  const config = getContractConfig();
  if (!config.ticketsAddress) throw new Error('Tickets contract not deployed');
  
  if (signerRequired) {
    const signer = await getSigner();
    return new ethers.Contract(config.ticketsAddress, TICKETS_ABI, signer);
  } else {
    const provider = getProvider();
    return new ethers.Contract(config.ticketsAddress, TICKETS_ABI, provider);
  }
};

export const getAutomationContract = async () => {
  const config = getContractConfig();
  if (!config.automationAddress) throw new Error('Automation contract not deployed');
  
  const provider = getProvider();
  return new ethers.Contract(config.automationAddress, AUTOMATION_ABI, provider);
};

// Utility functions
export const formatUSDC = (amount: bigint | string | number): string => {
  const amountBN = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
  return ethers.formatUnits(amountBN, 6); // USDC has 6 decimals
};

export const parseUSDC = (amount: string): bigint => {
  return ethers.parseUnits(amount, 6);
};

export const formatEther = (amount: bigint | string | number): string => {
  const amountBN = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
  return ethers.formatEther(amountBN);
};

export const parseEther = (amount: string): bigint => {
  return ethers.parseEther(amount);
};

// Transaction helpers
export const waitForTransaction = async (
  hash: string,
  confirmations = 1
): Promise<ethers.TransactionReceipt | null> => {
  const provider = getProvider();
  return await provider.waitForTransaction(hash, confirmations);
};

export const getTransactionStatus = async (hash: string): Promise<TransactionStatus> => {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(hash);
    
    if (!receipt) {
      return { hash, status: 'pending' };
    }
    
    return {
      hash,
      status: receipt.status === 1 ? 'success' : 'error',
    };
  } catch (error) {
    return {
      hash,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Lottery-specific functions
export const buyTicket = async (selectedNumbers: number[]): Promise<string> => {
  if (selectedNumbers.length !== 4) {
    throw new Error('Must select exactly 4 emojis');
  }
  
  if (selectedNumbers.some(n => n < 0 || n > 24)) {
    throw new Error('Invalid emoji selection');
  }
  
  const lotteryContract = await getLotteryContract(true);
  const usdcContract = await getUSDCContract(true);
  const config = getContractConfig();
  
  // First approve USDC
  const ticketPrice = parseUSDC('2'); // 2 USDC
  const approveTx = await usdcContract.approve(config.lotteryAddress, ticketPrice);
  await approveTx.wait();
  
  // Then buy ticket
  const numbers = selectedNumbers as [number, number, number, number];
  const tx = await lotteryContract.buyTicket(numbers);
  return tx.hash;
};

export const claimPrize = async (ticketId: number): Promise<string> => {
  const lotteryContract = await getLotteryContract(true);
  const tx = await lotteryContract.claimPrize(ticketId);
  return tx.hash;
};

export const getCurrentPool = async (): Promise<DailyPool> => {
  const lotteryContract = await getLotteryContract();
  const pool = await lotteryContract.getCurrentPool();
  
  return {
    totalCollected: Number(formatUSDC(pool.totalCollected)),
    firstPrize: Number(formatUSDC(pool.firstPrize)),
    secondPrize: Number(formatUSDC(pool.secondPrize)),
    thirdPrize: Number(formatUSDC(pool.thirdPrize)),
    development: Number(formatUSDC(pool.development)),
    distributed: pool.distributed,
    distributionTime: Number(pool.distributionTime),
    winningNumbers: pool.winningNumbers.map(Number),
    drawn: pool.drawn,
    gameDay: Number(await lotteryContract.getCurrentDay()),
  };
};

export const getAllReserves = async (): Promise<ReservePools> => {
  const reservesContract = await getReservesContract();
  const reserves = await reservesContract.getAllReserves();
  
  return {
    firstPrizeReserve1: Number(formatUSDC(reserves.firstReserve)),
    secondPrizeReserve2: Number(formatUSDC(reserves.secondReserve)),
    thirdPrizeReserve3: Number(formatUSDC(reserves.thirdReserve)),
    firstReserve1Activated: false, // Will be determined from events
    secondReserve2Activated: false,
    thirdReserve3Activated: false,
  };
};

export const getUserTickets = async (userAddress: string): Promise<Ticket[]> => {
  const lotteryContract = await getLotteryContract();
  const ticketIds = await lotteryContract.getUserTickets(userAddress);
  
  const tickets: Ticket[] = [];
  for (const ticketId of ticketIds) {
    const ticket = await lotteryContract.getTicket(ticketId);
    tickets.push({
      tokenId: Number(ticket.tokenId),
      owner: ticket.owner,
      numbers: ticket.numbers.map(Number),
      gameDay: Number(ticket.gameDay),
      isActive: ticket.isActive,
      purchaseTime: Number(ticket.purchaseTime),
      eligibleForReserve: ticket.eligibleForReserve,
      cryptoTheme: '', // Will be fetched from tickets contract
      rarityScore: 0,   // Will be fetched from tickets contract
    });
  }
  
  return tickets;
};

export const getUSDCBalance = async (address: string): Promise<number> => {
  const usdcContract = await getUSDCContract();
  const balance = await usdcContract.balanceOf(address);
  return Number(formatUSDC(balance));
};

export const getUSDCAllowance = async (owner: string, spender: string): Promise<number> => {
  const usdcContract = await getUSDCContract();
  const allowance = await usdcContract.allowance(owner, spender);
  return Number(formatUSDC(allowance));
};

export const approveUSDC = async (spender: string, amount: string): Promise<string> => {
  const usdcContract = await getUSDCContract(true);
  const tx = await usdcContract.approve(spender, parseUSDC(amount));
  return tx.hash;
};

// Validation functions
export const validateEmojiSelection = (numbers: number[]): boolean => {
  if (numbers.length !== 4) return false;
  return numbers.every(n => n >= 0 && n <= 24);
};

export const checkPrizeLevel = async (
  ticketNumbers: number[],
  winningNumbers: number[]
): Promise<number> => {
  const lotteryContract = await getLotteryContract();
  const level = await lotteryContract.checkPrizeLevel(ticketNumbers, winningNumbers);
  return Number(level);
};

// Event listening
export const subscribeToTicketPurchases = (callback: (event: any) => void) => {
  const lotteryContract = getLotteryContract();
  lotteryContract.then(contract => {
    contract.on('TicketPurchased', callback);
  });
};

export const subscribeToDrawExecutions = (callback: (event: any) => void) => {
  const lotteryContract = getLotteryContract();
  lotteryContract.then(contract => {
    contract.on('DrawExecuted', callback);
  });
};

export const subscribeToReserveActivations = (callback: (event: any) => void) => {
  const reservesContract = getReservesContract();
  reservesContract.then(contract => {
    contract.on('ReserveActivated', callback);
  });
};

// Error handling
export const handleContractError = (error: any): string => {
  if (error.code === 'ACTION_REJECTED') {
    return 'Transaction rejected by user';
  }
  
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for transaction';
  }
  
  if (error.message?.includes('execution reverted')) {
    const reason = error.message.split('execution reverted: ')[1]?.split('"')[0];
    return reason || 'Transaction failed';
  }
  
  return error.message || 'Unknown error occurred';
};

// Chain validation
export const isCorrectChain = async (): Promise<boolean> => {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    return Number(network.chainId) === BASE_SEPOLIA_CONFIG.chainId;
  } catch {
    return false;
  }
};

export const switchToBaseSepoliaChain = async (): Promise<void> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum provider found');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${BASE_SEPOLIA_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // Chain hasn't been added to MetaMask/wallet yet
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${BASE_SEPOLIA_CONFIG.chainId.toString(16)}`,
            chainName: BASE_SEPOLIA_CONFIG.name,
            nativeCurrency: BASE_SEPOLIA_CONFIG.nativeCurrency,
            rpcUrls: [BASE_SEPOLIA_CONFIG.rpcUrl],
            blockExplorerUrls: [BASE_SEPOLIA_CONFIG.blockExplorer],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}; 