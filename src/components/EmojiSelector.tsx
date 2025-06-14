import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiSelectorProps, EMOJIS } from '@/types/lottery';
import { cn } from '@/utils/cn';

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  selectedEmojis,
  onEmojiSelect,
  disabled = false,
  maxSelection = 4,
}) => {
  const [hoveredEmoji, setHoveredEmoji] = useState<number | null>(null);
  const [animatingEmojis, setAnimatingEmojis] = useState<Set<number>>(new Set());

  // Handle emoji click with animation
  const handleEmojiClick = useCallback((emojiIndex: number) => {
    if (disabled) return;

    // Add animation
    setAnimatingEmojis(prev => new Set([...prev, emojiIndex]));
    setTimeout(() => {
      setAnimatingEmojis(prev => {
        const next = new Set(prev);
        next.delete(emojiIndex);
        return next;
      });
    }, 300);

    onEmojiSelect(emojiIndex);
  }, [disabled, onEmojiSelect]);

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Ultra Rare':
        return 'from-purple-500 to-pink-500';
      case 'Rare':
        return 'from-blue-500 to-cyan-500';
      case 'Uncommon':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Get rarity glow
  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'Ultra Rare':
        return 'shadow-purple-500/50';
      case 'Rare':
        return 'shadow-blue-500/50';
      case 'Uncommon':
        return 'shadow-green-500/50';
      default:
        return 'shadow-gray-500/50';
    }
  };

  // Check if emoji is selected
  const isSelected = (index: number) => selectedEmojis.includes(index);

  // Get selection order
  const getSelectionOrder = (index: number) => {
    return selectedEmojis.indexOf(index) + 1;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Lucky Emojis
        </h2>
        <p className="text-gray-400">
          Select {maxSelection} crypto emojis for your ticket ({selectedEmojis.length}/{maxSelection})
        </p>
      </div>

      {/* Emoji Grid (5x5) */}
      <div className="grid grid-cols-5 gap-3 p-6 bg-crypto-dark rounded-2xl border border-crypto-gold/20">
        {EMOJIS.map((emoji, index) => {
          const selected = isSelected(index);
          const selectionOrder = getSelectionOrder(index);
          const isAnimating = animatingEmojis.has(index);
          const isHovered = hoveredEmoji === index;
          const canSelect = !selected && selectedEmojis.length < maxSelection;
          const isClickable = selected || canSelect;

          return (
            <motion.div
              key={emoji.id}
              className={cn(
                "relative aspect-square rounded-xl cursor-pointer overflow-hidden",
                "transition-all duration-200 transform-gpu",
                selected 
                  ? `bg-gradient-to-br ${getRarityColor(emoji.rarity)} shadow-lg ${getRarityGlow(emoji.rarity)}`
                  : "bg-crypto-dark-light hover:bg-crypto-dark-light/80",
                !isClickable && "opacity-50 cursor-not-allowed",
                isHovered && !selected && "scale-105 shadow-crypto-gold/30 shadow-lg",
                disabled && "opacity-30 cursor-not-allowed"
              )}
              onClick={() => isClickable && handleEmojiClick(index)}
              onHoverStart={() => !disabled && setHoveredEmoji(index)}
              onHoverEnd={() => setHoveredEmoji(null)}
              whileHover={!disabled && isClickable ? { scale: 1.05 } : {}}
              whileTap={!disabled && isClickable ? { scale: 0.95 } : {}}
              animate={isAnimating ? { 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Emoji Display */}
              <div className="flex items-center justify-center h-full">
                <span className="text-emoji select-none">
                  {emoji.symbol}
                </span>
              </div>

              {/* Selection Indicator */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-crypto-gold rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-xs font-bold text-crypto-dark">
                      {selectionOrder}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rarity Indicator */}
              <div className="absolute bottom-1 left-1 right-1">
                <div className={cn(
                  "h-1 rounded-full bg-gradient-to-r",
                  getRarityColor(emoji.rarity),
                  !selected && "opacity-60"
                )} />
              </div>

              {/* Hover Tooltip */}
              <AnimatePresence>
                {isHovered && !disabled && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <div className="bg-crypto-dark border border-crypto-gold/30 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                      <div className="text-white font-medium">{emoji.name}</div>
                      <div className={cn(
                        "text-xs capitalize",
                        emoji.rarity === 'Ultra Rare' && "text-purple-400",
                        emoji.rarity === 'Rare' && "text-blue-400",
                        emoji.rarity === 'Uncommon' && "text-green-400",
                        emoji.rarity === 'Common' && "text-gray-400"
                      )}>
                        {emoji.rarity} • {emoji.category}
                      </div>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-crypto-dark" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Emojis Preview */}
      <div className="mt-6 p-4 bg-crypto-dark-light rounded-xl border border-crypto-gold/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Your Selection</h3>
          {selectedEmojis.length > 0 && (
            <button
              onClick={() => selectedEmojis.forEach(index => onEmojiSelect(index))}
              className="text-crypto-red hover:text-crypto-red-light text-sm transition-colors"
              disabled={disabled}
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-center min-h-[60px] gap-4">
          {selectedEmojis.length === 0 ? (
            <p className="text-gray-500 text-sm">No emojis selected</p>
          ) : (
            <>
              {selectedEmojis.map((emojiIndex, position) => (
                <motion.div
                  key={`selected-${emojiIndex}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="relative"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-crypto-gold to-crypto-gold-dark rounded-lg flex items-center justify-center shadow-crypto">
                    <span className="text-xl">
                      {EMOJIS[emojiIndex].symbol}
                    </span>
                  </div>
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-crypto-blue rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {position + 1}
                  </div>
                </motion.div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: maxSelection - selectedEmojis.length }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-12 h-12 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
                >
                  <span className="text-gray-600 text-sm">
                    {selectedEmojis.length + i + 1}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
          <span className="text-purple-400">Ultra Rare</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 rounded bg-gradient-to-r from-blue-500 to-cyan-500" />
          <span className="text-blue-400">Rare</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 rounded bg-gradient-to-r from-green-500 to-emerald-500" />
          <span className="text-green-400">Uncommon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 rounded bg-gradient-to-r from-gray-500 to-gray-600" />
          <span className="text-gray-400">Common</span>
        </div>
      </div>
    </div>
  );
};

export default EmojiSelector; 