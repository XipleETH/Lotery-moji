// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title LottoMojiTickets
 * @dev NFT tickets with crypto-themed metadata and reserve tracking
 */
contract LottoMojiTickets is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    // 25 crypto/gambling themed emojis (same as main contract)
    string[25] public EMOJIS = [
        "💰", "💎", "🚀", "🎰", "🎲", "🃏", "💸", "🏆", "🎯", "🔥",
        "⚡", "🌙", "⭐", "💫", "🎪", "🎨", "🦄", "🌈", "🍀", "🎭", 
        "🎢", "🎮", "🏅", "🎊", "🎈"
    ];
    
    // Emoji names for metadata
    string[25] public EMOJI_NAMES = [
        "Money Bag", "Diamond", "Rocket", "Slot Machine", "Dice", "Joker", "Flying Money", "Trophy", "Target", "Fire",
        "Lightning", "Moon", "Star", "Dizzy Star", "Circus", "Art Palette", "Unicorn", "Rainbow", "Four Leaf Clover", "Theater Masks",
        "Roller Coaster", "Video Game", "Medal", "Confetti", "Balloon"
    ];
    
    // Emoji rarity levels (for metadata enhancement)
    mapping(uint8 => string) public emojiRarity;
    
    address public immutable lotteryContract;
    
    // Ticket metadata structure
    struct TicketMetadata {
        uint256 tokenId;
        uint8[4] numbers;
        uint256 gameDay;
        uint256 purchaseTime;
        bool eligibleForReserve;
        string cryptoTheme;
        uint256 rarityScore;
    }
    
    mapping(uint256 => TicketMetadata) public ticketMetadata;
    mapping(uint256 => bool) public ticketBurned;
    
    // Events
    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint8[4] numbers,
        uint256 gameDay,
        string cryptoTheme
    );
    
    event TicketBurned(uint256 indexed tokenId);
    
    modifier onlyLottery() {
        require(msg.sender == lotteryContract, "Only lottery contract");
        _;
    }
    
    constructor(address _lotteryContract) ERC721("LottoMoji Tickets", "LMT") {
        lotteryContract = _lotteryContract;
        _initializeEmojiRarity();
    }
    
    /**
     * @dev Initialize emoji rarity levels
     */
    function _initializeEmojiRarity() internal {
        // Ultra Rare (crypto legends)
        emojiRarity[1] = "Ultra Rare"; // 💎 Diamond
        emojiRarity[2] = "Ultra Rare"; // 🚀 Rocket
        emojiRarity[0] = "Ultra Rare"; // 💰 Money Bag
        
        // Rare (crypto symbols)
        emojiRarity[10] = "Rare"; // ⚡ Lightning
        emojiRarity[11] = "Rare"; // 🌙 Moon
        emojiRarity[16] = "Rare"; // 🦄 Unicorn
        emojiRarity[15] = "Rare"; // 🎨 Art (NFTs)
        
        // Uncommon (gambling)
        emojiRarity[3] = "Uncommon"; // 🎰 Slot Machine
        emojiRarity[4] = "Uncommon"; // 🎲 Dice
        emojiRarity[5] = "Uncommon"; // 🃏 Joker
        emojiRarity[7] = "Uncommon"; // 🏆 Trophy
        
        // Common (rest)
        for (uint8 i = 0; i < 25; i++) {
            if (bytes(emojiRarity[i]).length == 0) {
                emojiRarity[i] = "Common";
            }
        }
    }
    
    /**
     * @dev Mint new ticket NFT
     */
    function mintTicket(
        address to,
        uint256 tokenId,
        uint8[4] memory numbers,
        uint256 gameDay
    ) external onlyLottery {
        require(!_exists(tokenId), "Token already exists");
        
        // Calculate crypto theme and rarity
        string memory cryptoTheme = _determineCryptoTheme(numbers);
        uint256 rarityScore = _calculateRarityScore(numbers);
        
        // Store metadata
        ticketMetadata[tokenId] = TicketMetadata({
            tokenId: tokenId,
            numbers: numbers,
            gameDay: gameDay,
            purchaseTime: block.timestamp,
            eligibleForReserve: true,
            cryptoTheme: cryptoTheme,
            rarityScore: rarityScore
        });
        
        // Mint NFT
        _mint(to, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit TicketMinted(tokenId, to, numbers, gameDay, cryptoTheme);
    }
    
    /**
     * @dev Generate dynamic token URI with crypto theme
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        TicketMetadata memory metadata = ticketMetadata[tokenId];
        
        string memory name = string(abi.encodePacked("LottoMoji Ticket #", tokenId.toString()));
        string memory description = string(abi.encodePacked(
            "Crypto Emoji Lottery Ticket - Game Day ", 
            metadata.gameDay.toString(),
            " - Theme: ",
            metadata.cryptoTheme
        ));
        
        // Build attributes array
        string memory attributes = _buildAttributes(metadata);
        
        // Generate SVG image
        string memory image = _generateSVGImage(metadata);
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "', name, '",',
                        '"description": "', description, '",',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(image)), '",',
                        '"attributes": [', attributes, '],',
                        '"external_url": "https://lottomoji.vercel.app/ticket/', tokenId.toString(), '"}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    /**
     * @dev Build JSON attributes for metadata
     */
    function _buildAttributes(TicketMetadata memory metadata) internal view returns (string memory) {
        string memory emojiList = "";
        for (uint8 i = 0; i < 4; i++) {
            emojiList = string(abi.encodePacked(
                emojiList,
                EMOJIS[metadata.numbers[i]],
                i < 3 ? " " : ""
            ));
        }
        
        return string(abi.encodePacked(
            '{"trait_type": "Game Day", "value": "', metadata.gameDay.toString(), '"},',
            '{"trait_type": "Crypto Theme", "value": "', metadata.cryptoTheme, '"},',
            '{"trait_type": "Rarity Score", "value": ', metadata.rarityScore.toString(), '},',
            '{"trait_type": "Emojis", "value": "', emojiList, '"},',
            '{"trait_type": "Reserve Eligible", "value": "', metadata.eligibleForReserve ? "Yes" : "No", '"},',
            '{"trait_type": "Category", "value": "Lottery Ticket"}'
        ));
    }
    
    /**
     * @dev Generate SVG image for ticket
     */
    function _generateSVGImage(TicketMetadata memory metadata) internal view returns (string memory) {
        string memory emojiDisplay = "";
        
        // Create emoji grid (2x2)
        for (uint8 i = 0; i < 4; i++) {
            uint256 x = 60 + (i % 2) * 80;
            uint256 y = 100 + (i / 2) * 80;
            
            emojiDisplay = string(abi.encodePacked(
                emojiDisplay,
                '<text x="', x.toString(), '" y="', y.toString(), '" ',
                'font-size="40" text-anchor="middle" dominant-baseline="middle">',
                EMOJIS[metadata.numbers[i]],
                '</text>'
            ));
        }
        
        return string(abi.encodePacked(
            '<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#1a1a2e"/>',
            '<stop offset="100%" style="stop-color:#16213e"/>',
            '</linearGradient>',
            '<linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#ffd700"/>',
            '<stop offset="100%" style="stop-color:#ffb347"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="300" height="400" fill="url(#bg)" rx="15"/>',
            '<rect x="10" y="10" width="280" height="380" fill="none" stroke="url(#gold)" stroke-width="2" rx="10"/>',
            '<text x="150" y="40" text-anchor="middle" fill="url(#gold)" font-size="20" font-weight="bold">LOTTO MOJI</text>',
            '<text x="150" y="65" text-anchor="middle" fill="#ffffff" font-size="12">Crypto Emoji Lottery</text>',
            emojiDisplay,
            '<text x="150" y="220" text-anchor="middle" fill="#ffffff" font-size="14">Game Day: ', metadata.gameDay.toString(), '</text>',
            '<text x="150" y="240" text-anchor="middle" fill="#ffd700" font-size="12">', metadata.cryptoTheme, '</text>',
            '<text x="150" y="260" text-anchor="middle" fill="#ffffff" font-size="10">Ticket #', metadata.tokenId.toString(), '</text>',
            '<rect x="50" y="280" width="200" height="30" fill="none" stroke="#ffd700" stroke-width="1" rx="5"/>',
            '<text x="150" y="300" text-anchor="middle" fill="#ffd700" font-size="12">Reserve Eligible</text>',
            '<text x="150" y="340" text-anchor="middle" fill="#888888" font-size="10">Base Sepolia • USDC</text>',
            '<text x="150" y="360" text-anchor="middle" fill="#888888" font-size="8">LottoMoji.io</text>',
            '</svg>'
        ));
    }
    
    /**
     * @dev Determine crypto theme based on emojis
     */
    function _determineCryptoTheme(uint8[4] memory numbers) internal pure returns (string memory) {
        bool hasDiamond = false;
        bool hasRocket = false;
        bool hasMoney = false;
        bool hasGambling = false;
        bool hasLucky = false;
        
        for (uint8 i = 0; i < 4; i++) {
            uint8 num = numbers[i];
            if (num == 1) hasDiamond = true;      // 💎
            if (num == 2) hasRocket = true;       // 🚀
            if (num == 0 || num == 6) hasMoney = true; // 💰💸
            if (num == 3 || num == 4 || num == 5) hasGambling = true; // 🎰🎲🃏
            if (num == 12 || num == 18) hasLucky = true; // ⭐🍀
        }
        
        if (hasDiamond && hasRocket) return "Diamond Hands Rocket";
        if (hasDiamond && hasMoney) return "Diamond Money";
        if (hasRocket && hasMoney) return "Money to the Moon";
        if (hasGambling && hasLucky) return "Lucky Gambler";
        if (hasDiamond) return "Diamond Hands";
        if (hasRocket) return "To the Moon";
        if (hasMoney) return "Money Maker";
        if (hasGambling) return "High Roller";
        if (hasLucky) return "Lucky Charm";
        
        return "Crypto Explorer";
    }
    
    /**
     * @dev Calculate rarity score based on emojis
     */
    function _calculateRarityScore(uint8[4] memory numbers) internal view returns (uint256) {
        uint256 score = 0;
        
        for (uint8 i = 0; i < 4; i++) {
            uint8 num = numbers[i];
            
            // Ultra rare emojis
            if (num == 0 || num == 1 || num == 2) score += 25; // 💰💎🚀
            // Rare emojis  
            else if (num == 10 || num == 11 || num == 15 || num == 16) score += 15; // ⚡🌙🎨🦄
            // Uncommon emojis
            else if (num == 3 || num == 4 || num == 5 || num == 7) score += 10; // 🎰🎲🃏🏆
            // Common emojis
            else score += 5;
        }
        
        // Bonus for special combinations
        bool hasMegaCombo = false;
        for (uint8 i = 0; i < 4; i++) {
            if (numbers[i] == 0 || numbers[i] == 1 || numbers[i] == 2) { // 💰💎🚀
                for (uint8 j = i + 1; j < 4; j++) {
                    if (numbers[j] == 0 || numbers[j] == 1 || numbers[j] == 2) {
                        hasMegaCombo = true;
                        break;
                    }
                }
            }
            if (hasMegaCombo) break;
        }
        
        if (hasMegaCombo) score += 50; // Mega crypto combo bonus
        
        return score;
    }
    
    /**
     * @dev Burn ticket after claim
     */
    function burnTicket(uint256 tokenId) external onlyLottery {
        require(_exists(tokenId), "Token does not exist");
        require(!ticketBurned[tokenId], "Already burned");
        
        ticketBurned[tokenId] = true;
        _burn(tokenId);
        
        emit TicketBurned(tokenId);
    }
    
    /**
     * @dev Update reserve eligibility
     */
    function updateReserveEligibility(uint256 tokenId, bool eligible) external onlyLottery {
        require(_exists(tokenId), "Token does not exist");
        ticketMetadata[tokenId].eligibleForReserve = eligible;
    }
    
    /**
     * @dev Override functions for URI storage
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    // View functions
    function getTicketMetadata(uint256 tokenId) external view returns (TicketMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return ticketMetadata[tokenId];
    }
    
    function getEmojiName(uint8 index) external view returns (string memory) {
        require(index < 25, "Invalid emoji index");
        return EMOJI_NAMES[index];
    }
    
    function getEmojiRarity(uint8 index) external view returns (string memory) {
        require(index < 25, "Invalid emoji index");
        return emojiRarity[index];
    }
    
    function isTicketBurned(uint256 tokenId) external view returns (bool) {
        return ticketBurned[tokenId];
    }
    
    /**
     * @dev Get all emojis and their data
     */
    function getAllEmojis() external view returns (
        string[25] memory emojis,
        string[25] memory names,
        string[] memory rarities
    ) {
        emojis = EMOJIS;
        names = EMOJI_NAMES;
        
        rarities = new string[](25);
        for (uint8 i = 0; i < 25; i++) {
            rarities[i] = emojiRarity[i];
        }
    }
} 