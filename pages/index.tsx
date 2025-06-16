import React from 'react';
import Head from 'next/head';
import WalletConnection from '../src/components/WalletConnection';

export default function Home() {
  return (
    <>
      <Head>
        <title>LottoMoji - Blockchain Emoji Lottery</title>
        <meta name="description" content="The first emoji-based blockchain lottery on Base Sepolia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">
              🎰 LottoMoji 🎯
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The first emoji-based blockchain lottery on Base Sepolia
            </p>
            <p className="text-lg text-gray-400 mt-2">
              Pick 4 emojis, win USDC prizes! 💰
            </p>
          </header>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {/* Wallet Connection */}
            <div className="mb-8">
              <WalletConnection />
            </div>

            {/* Game Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Ticket Price */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-6 border border-green-400/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎟️</div>
                  <h3 className="text-green-400 font-semibold mb-2">Ticket Price</h3>
                  <p className="text-2xl text-white font-bold">2 USDC</p>
                </div>
              </div>

              {/* How to Play */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-6 border border-blue-400/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎮</div>
                  <h3 className="text-blue-400 font-semibold mb-2">How to Play</h3>
                  <p className="text-white">Pick 4 emojis from 25 options</p>
                </div>
              </div>

              {/* Next Draw */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-400/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">⏰</div>
                  <h3 className="text-purple-400 font-semibold mb-2">Next Draw</h3>
                  <p className="text-white">8-9 PM Los Angeles</p>
                </div>
              </div>
            </div>

            {/* Prize Structure */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-6 border border-yellow-400/30 mb-8">
              <h3 className="text-yellow-400 font-semibold text-xl mb-4 text-center">🏆 Prize Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🥇</div>
                  <p className="text-white font-semibold">1st Prize</p>
                  <p className="text-yellow-400">80% of pool</p>
                  <p className="text-gray-400 text-sm">4 emojis match</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🥈</div>
                  <p className="text-white font-semibold">2nd Prize</p>
                  <p className="text-yellow-400">10% of pool</p>
                  <p className="text-gray-400 text-sm">3 emojis match</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🥉</div>
                  <p className="text-white font-semibold">3rd Prize</p>
                  <p className="text-yellow-400">5% of pool</p>
                  <p className="text-gray-400 text-sm">2 emojis match</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-lg p-6 border border-gray-400/30">
                <h3 className="text-gray-300 font-semibold text-lg mb-3">🔗 Blockchain Features</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✅ Fully on-chain lottery</li>
                  <li>✅ Chainlink VRF for randomness</li>
                  <li>✅ Automated daily draws</li>
                  <li>✅ Transparent and fair</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-lg p-6 border border-gray-400/30">
                <h3 className="text-gray-300 font-semibold text-lg mb-3">🎯 Game Features</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✅ 25 unique emojis to choose</li>
                  <li>✅ Multiple ways to win</li>
                  <li>✅ Reserve system for guaranteed prizes</li>
                  <li>✅ NFT tickets as collectibles</li>
                </ul>
              </div>
            </div>

            {/* Status */}
            <div className="mt-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-6 border border-indigo-400/30">
              <div className="text-center">
                <h3 className="text-indigo-400 font-semibold text-lg mb-2">🚀 System Status</h3>
                <div className="flex justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Smart Contracts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Chainlink Automation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Firebase Backend</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 