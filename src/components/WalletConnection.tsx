import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface WalletConnectionProps {
  className?: string;
}

export default function WalletConnection({ className = '' }: WalletConnectionProps) {
  const { 
    wallet, 
    loading, 
    error, 
    connect, 
    disconnect, 
    switchChain,
    getWalletStatus,
    formatAddress,
    getNetworkName,
    isWalletAvailable 
  } = useWallet();

  const walletStatus = getWalletStatus();

  // Render install prompt if Coinbase Wallet not available
  if (!isWalletAvailable) {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-400/30">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-orange-400" />
            <div className="flex-1">
              <h3 className="text-orange-400 font-semibold">Coinbase Wallet Necesario</h3>
              <p className="text-gray-300 text-sm mt-1">
                Instala la extensión de Coinbase Wallet para continuar
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <a
              href="https://www.coinbase.com/es/wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <span>Instalar Coinbase Wallet</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render connection button if not connected
  if (!wallet.isConnected) {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/30">
          <div className="text-center">
            <Wallet className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-blue-400 font-semibold mb-2">Conectar Coinbase Wallet</h3>
            <p className="text-gray-300 text-sm mb-4">
              Conecta tu Coinbase Wallet para comprar tickets
            </p>
            
            <button
              onClick={connect}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Conectar Wallet</span>
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-3 text-red-400 text-sm bg-red-500/10 rounded p-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render connected wallet info
  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Wallet Conectado</span>
          </div>
          
          <button
            onClick={disconnect}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            Desconectar
          </button>
        </div>

        {/* Wallet Info */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Dirección:</span>
            <span className="text-white font-mono">{formatAddress(wallet.address)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Red:</span>
            <span className="text-white">{getNetworkName()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">ETH Balance:</span>
            <span className="text-white">{wallet.balance?.toFixed(4)} ETH</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">USDC Balance:</span>
            <span className="text-green-400 font-semibold">
              {wallet.usdcBalance?.toFixed(2)} USDC
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {walletStatus.status !== 'ready' && (
          <div className="mt-4">
            {walletStatus.status === 'wrong-network' && (
              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Red Incorrecta</p>
                    <p className="text-gray-300 text-xs mt-1">Cambia a Base Sepolia</p>
                  </div>
                  <button
                    onClick={switchChain}
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Cambiar Red
                  </button>
                </div>
              </div>
            )}
            
            {walletStatus.status === 'insufficient-usdc' && (
              <div className="bg-red-500/10 border border-red-400/30 rounded p-3">
                <p className="text-red-400 text-sm font-medium">USDC Insuficiente</p>
                <p className="text-gray-300 text-xs mt-1">
                  Necesitas al menos 2 USDC para comprar tickets
                </p>
                <a
                  href="https://www.coinbase.com/es/price/usd-coin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-400 text-xs mt-2 hover:text-blue-300"
                >
                  <span>Obtener USDC</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Ready Status */}
        {walletStatus.status === 'ready' && (
          <div className="mt-4 bg-green-500/10 border border-green-400/30 rounded p-2 text-center">
            <p className="text-green-400 text-sm font-medium">
              ✅ Listo para comprar tickets
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 