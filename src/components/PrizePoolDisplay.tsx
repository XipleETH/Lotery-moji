import React from 'react';
import { motion } from 'framer-motion';
import { DailyPool, ReservePools, AccumulatedPools } from '@/types/lottery';
import { cn } from '@/utils/cn';
import { Trophy, Zap, Target, Gift } from 'lucide-react';

interface PrizePoolDisplayProps {
  dailyPool: DailyPool;
  accumulatedPools?: AccumulatedPools;
  reserves: ReservePools;
  loading?: boolean;
  showDetails?: boolean;
  className?: string;
}

const PrizePoolDisplay: React.FC<PrizePoolDisplayProps> = ({
  dailyPool,
  accumulatedPools,
  reserves,
  loading = false,
  showDetails = true,
  className = ''
}) => {
  // Prize configurations
  const prizeConfigs = [
    {
      id: 'first',
      name: 'First Prize',
      description: '4 exact in order',
      icon: Trophy,
      poolAmount: dailyPool.firstPrize,
      reserveAmount: reserves.firstPrizeReserve1,
      potentialAmount: accumulatedPools?.firstPrizeAccumulated || BigInt(0),
      color: 'from-yellow-500 to-orange-500',
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      percentage: '80%',
      emoji: '🏆',
    },
    {
      id: 'second',
      name: 'Second Prize',
      description: '4 exact any order',
      icon: Zap,
      poolAmount: dailyPool.secondPrize,
      reserveAmount: reserves.secondPrizeReserve2,
      potentialAmount: accumulatedPools?.secondPrizeAccumulated || BigInt(0),
      color: 'from-purple-500 to-pink-500',
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      percentage: '10%',
      emoji: '⚡',
    },
    {
      id: 'third',
      name: 'Third Prize',
      description: '3 exact in order',
      icon: Target,
      poolAmount: dailyPool.thirdPrize,
      reserveAmount: reserves.thirdPrizeReserve3,
      potentialAmount: accumulatedPools?.thirdPrizeAccumulated || BigInt(0),
      color: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      percentage: '5%',
      emoji: '🎯',
    },
    {
      id: 'free',
      name: 'Free Ticket',
      description: '3 exact any order',
      icon: Gift,
      poolAmount: 0,
      reserveAmount: 0,
      potentialAmount: 1, // 1 free ticket
      color: 'from-green-500 to-emerald-500',
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      percentage: '0%',
      emoji: '🎁',
    },
  ];

  // Format USDC amount (6 decimals)
  const formatUSDC = (amount: bigint | number): string => {
    const value = typeof amount === 'bigint' ? Number(amount) : amount;
    return (value / 1_000_000).toFixed(2);
  };

  // Calculate total potential winnings (accumulated pools)
  const getTotalPotentialWinning = (prizeLevel: 1 | 2 | 3): string => {
    switch (prizeLevel) {
      case 1:
        return formatUSDC(accumulatedPools?.firstPrizeAccumulated || 0);
      case 2:
        return formatUSDC(accumulatedPools?.secondPrizeAccumulated || 0);
      case 3:
        return formatUSDC(accumulatedPools?.thirdPrizeAccumulated || 0);
      default:
        return '0.00';
    }
  };

  // Calculate daily contributions
  const getDailyContribution = (prizeLevel: 1 | 2 | 3): string => {
    switch (prizeLevel) {
      case 1:
        return formatUSDC(dailyPool.firstPrize);
      case 2:
        return formatUSDC(dailyPool.secondPrize);
      case 3:
        return formatUSDC(dailyPool.thirdPrize);
      default:
        return '0.00';
    }
  };

  // Calculate reserve amounts
  const getReserveAmount = (prizeLevel: 1 | 2 | 3): string => {
    switch (prizeLevel) {
      case 1:
        return formatUSDC(reserves.firstPrizeReserve1);
      case 2:
        return formatUSDC(reserves.secondPrizeReserve2);
      case 3:
        return formatUSDC(reserves.thirdPrizeReserve3);
      default:
        return '0.00';
    }
  };

  // Calculate what goes to reserves today (20% of daily)
  const getDailyToReserve = (prizeLevel: 1 | 2 | 3): string => {
    const daily = getDailyContribution(prizeLevel);
    return (parseFloat(daily) * 0.2).toFixed(2);
  };

  // Calculate what stays in main pool today (80% of daily)
  const getDailyToMainPool = (prizeLevel: 1 | 2 | 3): string => {
    const daily = getDailyContribution(prizeLevel);
    return (parseFloat(daily) * 0.8).toFixed(2);
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-300/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">
            💰 Pools de Premios
          </h2>
          <p className="text-gray-300 text-sm">
            Nuevo Sistema: 20% diario a reservas + Acumulación de pools principales
          </p>
        </div>

        <div className="space-y-6">
          {/* First Prize */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                <h3 className="text-lg font-bold text-purple-400">
                  🏆 Primer Premio (80%)
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">
                  {getTotalPotentialWinning(1)} USDC
                </div>
                <div className="text-xs text-gray-400">Pool Acumulado</div>
              </div>
            </div>
            
            {showDetails && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-green-400 font-semibold">+{getDailyToMainPool(1)}</div>
                  <div className="text-gray-400">Hoy al Pool (80%)</div>
                </div>
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-blue-400 font-semibold">{getReserveAmount(1)}</div>
                  <div className="text-gray-400">Reserva Total</div>
                </div>
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-yellow-400 font-semibold">+{getDailyToReserve(1)}</div>
                  <div className="text-gray-400">Hoy a Reserva (20%)</div>
                </div>
              </div>
            )}
          </div>

          {/* Second Prize */}
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-400">
                  🥈 Segundo Premio (10%)
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {getTotalPotentialWinning(2)} USDC
                </div>
                <div className="text-xs text-gray-400">Pool Acumulado</div>
              </div>
            </div>
            
            {showDetails && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-green-400 font-semibold">+{getDailyToMainPool(2)}</div>
                  <div className="text-gray-400">Hoy al Pool (80%)</div>
                </div>
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-blue-400 font-semibold">{getReserveAmount(2)}</div>
                  <div className="text-gray-400">Reserva Total</div>
                </div>
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-yellow-400 font-semibold">+{getDailyToReserve(2)}</div>
                  <div className="text-gray-400">Hoy a Reserva (20%)</div>
                </div>
              </div>
            )}
          </div>

          {/* Third Prize */}
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-400/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
                <h3 className="text-lg font-bold text-orange-400">
                  🥉 Tercer Premio (5%)
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400">
                  {getTotalPotentialWinning(3)} USDC
                </div>
                <div className="text-xs text-gray-400">Pool Acumulado</div>
              </div>
            </div>
            
            {showDetails && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-green-400 font-semibold">+{getDailyToMainPool(3)}</div>
                  <div className="text-gray-400">Hoy al Pool (80%)</div>
                </div>
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-blue-400 font-semibold">{getReserveAmount(3)}</div>
                  <div className="text-gray-400">Reserva Total</div>
                </div>
                <div className="bg-black/20 rounded p-2 text-center">
                  <div className="text-yellow-400 font-semibold">+{getDailyToReserve(3)}</div>
                  <div className="text-gray-400">Hoy a Reserva (20%)</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Summary */}
        <div className="mt-6 pt-4 border-t border-gray-600/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-gray-400 mb-1">Pool Diario Total</div>
              <div className="text-xl font-bold text-green-400">
                {formatUSDC(dailyPool.totalCollected)} USDC
              </div>
              <div className="text-xs text-gray-500">
                Colectado hoy
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-gray-400 mb-1">Reservas Totales</div>
              <div className="text-xl font-bold text-blue-400">
                {formatUSDC(
                  reserves.firstPrizeReserve1 + 
                  reserves.secondPrizeReserve2 + 
                  reserves.thirdPrizeReserve3
                )} USDC
              </div>
              <div className="text-xs text-gray-500">
                Disponible para recargas
              </div>
            </div>
          </div>

          {/* New System Explanation */}
          <div className="mt-4 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-yellow-400 mb-2">
              📈 Nuevo Sistema de Crecimiento Dual
            </h4>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• <span className="text-green-400">Pools principales</span>: Se acumulan cuando no hay ganadores</div>
              <div>• <span className="text-blue-400">Reservas</span>: Crecen 20% diariamente sin excepción</div>
              <div>• <span className="text-purple-400">Respaldo automático</span>: Reservas recargan pools si es necesario</div>
              <div>• <span className="text-yellow-400">Liquidez garantizada</span>: Siempre hay fondos para premios</div>
            </div>
          </div>

          {/* Reserve Status Indicator */}
          <div className="mt-3 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">Sistema Activo</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-400">Reservas: Activas</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-400">Sorteo: {dailyPool.drawn ? 'Ejecutado' : 'Pendiente'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizePoolDisplay; 
