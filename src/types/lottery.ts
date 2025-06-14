/**
 * LottoMoji Types - Complete TypeScript definitions
 * NEW SYSTEM: 20% daily to reserves + accumulating pools + reserve refills
 */

// Blockchain constants
export const LOTTERY_CONSTANTS = {
  EMOJIS: [
    "💰", "💎", "🚀", "🎰", "🎲", "🃏", "💸", "🏆", "🎯", "🔥",
    "⚡", "🌙", "⭐", "💫", "🎪", "🎨", "🦄", "🌈", "🍀", "🎭", 
    "🎢", "🎮", "🏅", "🎊", "🎈"
  ] as const,
  TICKET_PRICE: 2_000_000, // 2 USDC (6 decimals)
  DAILY_RESERVE_PERCENTAGE: 20,
  MAIN_POOL_PERCENTAGE: 80,
  FIRST_PRIZE_PERCENTAGE: 80,
  SECOND_PRIZE_PERCENTAGE: 10,
  THIRD_PRIZE_PERCENTAGE: 5,
  DEVELOPMENT_PERCENTAGE: 5,
  DRAW_TIME_HOURS: 24,
  SAO_PAULO_TIMEZONE: 'America/Sao_Paulo',
  RARITY_LEVELS: {
    ULTRA_RARE: ['💎', '🚀', '🏆', '🦄', '💫'],
    RARE: ['💰', '🔥', '⚡', '🌈', '🍀'],
    UNCOMMON: ['🎰', '🎲', '🎯', '🌙', '⭐', '🎪', '🎭', '🏅'],
    COMMON: ['🃏', '💸', '🎨', '🎢', '🎮', '🎊', '🎈']
  }
} as const;

// NEW: Accumulated main pools structure
export interface AccumulatedPools {
  firstPrizeAccumulated: bigint;   // Accumulates when no first prize winners
  secondPrizeAccumulated: bigint;  // Accumulates when no second prize winners
  thirdPrizeAccumulated: bigint;   // Accumulates when no third prize winners
  developmentAccumulated: bigint;  // Always gets paid to development
}

// Updated daily pool structure - now represents daily contributions
export interface DailyPool {
  totalCollected: bigint;          // Total USDC collected this day
  mainPoolPortion: bigint;         // 80% portion that goes to main pools
  reservePortion: bigint;          // 20% portion that goes to reserves
  firstPrizeDaily: bigint;         // Daily contribution to first prize
  secondPrizeDaily: bigint;        // Daily contribution to second prize
  thirdPrizeDaily: bigint;         // Daily contribution to third prize
  developmentDaily: bigint;        // Daily contribution to development
  distributed: boolean;
  distributionTime: bigint;
  winningNumbers: [number, number, number, number];
  drawn: boolean;
  reservesSent: boolean;           // NEW: Track if 20% sent to reserves
}

// Reserve system types - NEW STRUCTURE
export interface ReservePools {
  firstPrizeReserve1: bigint;     // Accumulates 20% of first prize daily
  secondPrizeReserve2: bigint;    // Accumulates 20% of second prize daily
  thirdPrizeReserve3: bigint;     // Accumulates 20% of third prize daily
}

// NEW: Daily reserve contribution tracking
export interface DailyReserveContribution {
  gameDay: bigint;
  firstContribution: bigint;
  secondContribution: bigint;
  thirdContribution: bigint;
  totalContribution: bigint;
  timestamp: bigint;
}

// NEW: Reserve statistics
export interface ReserveStatistics {
  totalReceived: bigint;
  totalUsedForRefills: bigint;
  currentTotalReserves: bigint;
  lastContribution: bigint;
  totalDays: bigint;
  averageDailyContribution: bigint;
}

// NEW: Reserve efficiency metrics
export interface ReserveEfficiency {
  utilizationPercentage: bigint;
  currentCoveragePercentage: bigint;
}

// NEW: Reserve coverage analysis
export interface ReserveCoverage {
  firstPrizeCoverage: bigint;
  secondPrizeCoverage: bigint;
  thirdPrizeCoverage: bigint;
  canCoverTypicalPrizes: boolean;
}

// NEW: Reserve state summary
export interface ReserveStateSummary {
  totalReserves: bigint;
  daysSinceLastContribution: bigint;
  allReservesHealthy: boolean;
  status: string;
}

// NEW: Future reserve predictions
export interface FutureReservePrediction {
  predictedFirstReserve: bigint;
  predictedSecondReserve: bigint;
  predictedThirdReserve: bigint;
  predictedTotal: bigint;
}

// Lottery System Types
export interface Emoji {
  id: number;
  symbol: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare';
  category: 'crypto' | 'gambling' | 'luck' | 'celebration';
}

export interface TicketNumbers {
  numbers: number[]; // Array of 4 numbers (0-24)
  emojis: string[];  // Array of 4 emoji symbols
}

export interface Ticket {
  tokenId: bigint;
  owner: string;
  numbers: [number, number, number, number];
  gameDay: bigint;
  isActive: boolean;
  purchaseTime: bigint;
  eligibleForReserve: boolean;
  cryptoTheme: string;
  rarityScore: number;
  metadata?: TicketMetadata;
}

export interface TicketMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url: string;
}

// Pool System Types
export interface DailyPool {
  totalCollected: number;
  firstPrize: number;      // 80% base
  secondPrize: number;     // 10% base
  thirdPrize: number;      // 5% base
  development: number;     // 5% base
  distributed: boolean;
  distributionTime: number;
  winningNumbers: number[];
  drawn: boolean;
  gameDay: number;
}

// Reserve System Types
export interface ReservePools {
  firstPrizeReserve1: number;     // Pool 1: First prize reserve
  secondPrizeReserve2: number;    // Pool 2: Second prize reserve
  thirdPrizeReserve3: number;     // Pool 3: Third prize reserve
  firstReserve1Activated: boolean;
  secondReserve2Activated: boolean;
  thirdReserve3Activated: boolean;
}

export interface ReserveActivation {
  firstActivated: boolean;
  secondActivated: boolean;
  thirdActivated: boolean;
  activationTimestamp: number;
  firstAmount: number;
  secondAmount: number;
  thirdAmount: number;
  gameDay: number;
}

export interface ReserveStatistics {
  totalAccumulated: number;
  totalPaid: number;
  lastActivation: number;
  currentTotalReserves: number;
  daysAccumulating: {
    first: number;
    second: number;
    third: number;
  };
}

// Game State Types
export interface GameState {
  currentGameDay: number;
  lastDrawTime: number;
  gameActive: boolean;
  nextDrawTime: number;
  canExecuteDraw: boolean;
  timeUntilNextDraw: number;
}

// Prize System Types
export type PrizeLevel = 0 | 1 | 2 | 3 | 4;

export interface PrizeInfo {
  level: PrizeLevel;
  name: string;
  description: string;
  basePercentage: number;
  includesReserve: boolean;
}

export interface WinnerInfo {
  ticketId: number;
  owner: string;
  prizeLevel: PrizeLevel;
  amount: number;
  reserveAmount: number;
  totalAmount: number;
  claimed: boolean;
}

// Potential Winnings (Pool + Reserve)
export interface PotentialWinnings {
  firstPrize: number;    // Pool actual + Reserve1
  secondPrize: number;   // Pool actual + Reserve2
  thirdPrize: number;    // Pool actual + Reserve3
}

// Contract Interaction Types
export interface ContractConfig {
  lotteryAddress: string;
  ticketsAddress: string;
  reservesAddress: string;
  randomAddress: string;
  automationAddress: string;
  usdcAddress: string;
}

export interface TransactionStatus {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
}

// Wallet Connection Types
export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  balance?: number;
  usdcBalance?: number;
  usdcAllowance?: number;
}

// User Data Types
export interface UserTickets {
  active: Ticket[];
  won: Ticket[];
  claimed: Ticket[];
  total: number;
}

export interface UserStats {
  totalTickets: number;
  totalSpent: number;
  totalWon: number;
  winRate: number;
  favoriteEmojis: number[];
  longestStreak: number;
}

// Animation and UI Types
export interface AnimationConfig {
  duration: number;
  delay?: number;
  type: 'bounce' | 'fade' | 'slide' | 'glow' | 'confetti';
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Automation Types
export interface AutomationStatus {
  active: boolean;
  paused: boolean;
  phase: 'WaitingForDraw' | 'ExecutingDraw' | 'ProcessingReserves' | 'PerformingMaintenance' | 'Complete';
  nextDrawTime: number;
  totalDraws: number;
  totalReserves: number;
  healthy: boolean;
  status: string;
}

export interface AutomationMetrics {
  totalDraws: number;
  totalReserveProcessing: number;
  totalMaintenance: number;
  lastDraw: number;
  lastMaintenance: number;
  uptime: number;
}

// Firebase Types
export interface GameStatsDocument {
  gameDay: number;
  totalTickets: number;
  totalPool: number;
  winningNumbers: number[];
  winners: WinnerInfo[];
  reservesActivated: boolean[];
  timestamp: number;
}

export interface UserDocument {
  address: string;
  totalTickets: number;
  totalSpent: number;
  totalWon: number;
  winRate: number;
  joinedAt: number;
  lastActivity: number;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Event Types
export interface LotteryEvent {
  type: 'TicketPurchased' | 'DrawExecuted' | 'PrizeClaimed' | 'ReserveActivated' | 'ReserveAccumulated';
  gameDay: number;
  data: any;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

// Hook Return Types
export interface UseLotteryReturn {
  gameState: GameState;
  dailyPool: DailyPool;
  reserves: ReservePools;
  potentialWinnings: PotentialWinnings;
  buyTicket: (numbers: number[]) => Promise<void>;
  claimPrize: (ticketId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseWalletReturn {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseReservesReturn {
  reserves: ReservePools;
  statistics: ReserveStatistics;
  activations: ReserveActivation[];
  loading: boolean;
  refreshReserves: () => Promise<void>;
}

export interface UseUserTicketsReturn {
  tickets: UserTickets;
  stats: UserStats;
  loading: boolean;
  refreshTickets: () => Promise<void>;
}

// Component Props Types
export interface EmojiSelectorProps {
  selectedEmojis: number[];
  onEmojiSelect: (emojiIndex: number) => void;
  disabled?: boolean;
  maxSelection?: number;
}

export interface PrizePoolDisplayProps {
  pool: DailyPool;
  reserves: ReservePools;
  potentialWinnings: PotentialWinnings;
  className?: string;
}

export interface ReserveTrackerProps {
  reserves: ReservePools;
  statistics: ReserveStatistics;
  showHistory?: boolean;
  className?: string;
}

export interface TicketNFTProps {
  ticket: Ticket;
  showActions?: boolean;
  onClaim?: (ticketId: number) => void;
  className?: string;
}

// Constants
export const EMOJIS: Emoji[] = [
  { id: 0, symbol: '💰', name: 'Money Bag', rarity: 'Ultra Rare', category: 'crypto' },
  { id: 1, symbol: '💎', name: 'Diamond', rarity: 'Ultra Rare', category: 'crypto' },
  { id: 2, symbol: '🚀', name: 'Rocket', rarity: 'Ultra Rare', category: 'crypto' },
  { id: 3, symbol: '🎰', name: 'Slot Machine', rarity: 'Uncommon', category: 'gambling' },
  { id: 4, symbol: '🎲', name: 'Dice', rarity: 'Uncommon', category: 'gambling' },
  { id: 5, symbol: '🃏', name: 'Joker', rarity: 'Uncommon', category: 'gambling' },
  { id: 6, symbol: '💸', name: 'Flying Money', rarity: 'Common', category: 'crypto' },
  { id: 7, symbol: '🏆', name: 'Trophy', rarity: 'Uncommon', category: 'celebration' },
  { id: 8, symbol: '🎯', name: 'Target', rarity: 'Common', category: 'gambling' },
  { id: 9, symbol: '🔥', name: 'Fire', rarity: 'Common', category: 'crypto' },
  { id: 10, symbol: '⚡', name: 'Lightning', rarity: 'Rare', category: 'crypto' },
  { id: 11, symbol: '🌙', name: 'Moon', rarity: 'Rare', category: 'crypto' },
  { id: 12, symbol: '⭐', name: 'Star', rarity: 'Common', category: 'luck' },
  { id: 13, symbol: '💫', name: 'Dizzy Star', rarity: 'Common', category: 'luck' },
  { id: 14, symbol: '🎪', name: 'Circus', rarity: 'Common', category: 'celebration' },
  { id: 15, symbol: '🎨', name: 'Art Palette', rarity: 'Rare', category: 'crypto' },
  { id: 16, symbol: '🦄', name: 'Unicorn', rarity: 'Rare', category: 'crypto' },
  { id: 17, symbol: '🌈', name: 'Rainbow', rarity: 'Common', category: 'luck' },
  { id: 18, symbol: '🍀', name: 'Four Leaf Clover', rarity: 'Common', category: 'luck' },
  { id: 19, symbol: '🎭', name: 'Theater Masks', rarity: 'Common', category: 'celebration' },
  { id: 20, symbol: '🎢', name: 'Roller Coaster', rarity: 'Common', category: 'celebration' },
  { id: 21, symbol: '🎮', name: 'Video Game', rarity: 'Common', category: 'gambling' },
  { id: 22, symbol: '🏅', name: 'Medal', rarity: 'Common', category: 'celebration' },
  { id: 23, symbol: '🎊', name: 'Confetti', rarity: 'Common', category: 'celebration' },
  { id: 24, symbol: '🎈', name: 'Balloon', rarity: 'Common', category: 'celebration' },
];

export const PRIZE_LEVELS: Record<PrizeLevel, PrizeInfo> = {
  0: { level: 0, name: 'No Prize', description: 'Better luck next time!', basePercentage: 0, includesReserve: false },
  1: { level: 1, name: 'First Prize', description: '4 exact in order', basePercentage: 80, includesReserve: true },
  2: { level: 2, name: 'Second Prize', description: '4 exact any order', basePercentage: 10, includesReserve: true },
  3: { level: 3, name: 'Third Prize', description: '3 exact in order', basePercentage: 5, includesReserve: true },
  4: { level: 4, name: 'Free Ticket', description: '3 exact any order', basePercentage: 0, includesReserve: false },
};

export const RESERVE_CONFIG = {
  PERCENTAGE: 20,
  MAIN_POOL_PERCENTAGE: 80,
  EMERGENCY_THRESHOLD: 2000, // USDC
  DISPLAY_DECIMALS: 2,
} as const; 