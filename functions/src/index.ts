/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest, onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * LottoMoji Firebase Functions
 * Handles blockchain events, statistics, and backend logic
 */

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Update lottery statistics when new tickets are purchased
 * @param {any} request - The request data containing game stats
 * @return {Promise<{success: boolean}>} Success response
 */
export const updateLotteryStats = onCall(async (request) => {
  const {gameDay, ticketCount, poolAmount, reserveAmounts} = request.data;

  try {
    // Update daily stats
    await db.collection("stats").doc(`day-${gameDay}`).set({
      gameDay,
      ticketCount: ticketCount || 0,
      poolAmount: poolAmount || 0,
      reserveAmounts: reserveAmounts || {first: 0, second: 0, third: 0},
      lastUpdated: new Date(),
    }, {merge: true});

    // Update overall stats
    await db.collection("stats").doc("overall").set({
      totalTickets: ticketCount || 0,
      totalPools: poolAmount || 0,
      lastGameDay: gameDay,
      lastUpdated: new Date(),
    }, {merge: true});

    logger.info(`Updated stats for game day ${gameDay}`);
    return {success: true};
  } catch (error) {
    logger.error("Error updating lottery stats:", error);
    throw new Error("Failed to update stats");
  }
});

/**
 * Process blockchain events (ticket purchases, draws, prizes)
 * @param {any} request - The request data containing event info
 * @return {Promise<{success: boolean}>} Success response
 */
export const processBlockchainEvent = onCall(async (request) => {
  const {eventType, data, blockNumber, timestamp, txHash} = request.data;

  try {
    const eventDoc = {
      eventType,
      data,
      blockNumber,
      timestamp: new Date(timestamp * 1000),
      txHash,
      processed: true,
      createdAt: new Date(),
    };

    // Store the event
    await db.collection("events").add(eventDoc);

    // Process specific event types
    switch (eventType) {
    case "TicketPurchased":
      await processTicketPurchase(data);
      break;
    case "DrawExecuted":
      await processDrawExecution(data);
      break;
    case "PrizeClaimed":
      await processPrizeClaim(data);
      break;
    case "DailyReservesSent":
      await processDailyReserves(data);
      break;
    }

    logger.info(`Processed ${eventType} event:`, data);
    return {success: true};
  } catch (error) {
    logger.error("Error processing blockchain event:", error);
    throw new Error("Failed to process event");
  }
});

/**
 * Get lottery statistics for frontend
 * @param {any} req - HTTP request
 * @param {any} res - HTTP response
 */
export const getLotteryStats = onRequest(async (req, res) => {
  try {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Get overall stats
    const overallStats = await db.collection("stats").doc("overall").get();

    // Get last 30 days stats
    const dailyStats = await db.collection("stats")
      .where("gameDay", ">=", Date.now() / 1000 / 86400 - 30)
      .orderBy("gameDay", "desc")
      .limit(30)
      .get();

    const stats = {
      overall: overallStats.exists ? overallStats.data() : {},
      daily: dailyStats.docs.map((doc) => ({id: doc.id, ...doc.data()})),
      lastUpdated: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error) {
    logger.error("Error getting lottery stats:", error);
    res.status(500).json({error: "Failed to get stats"});
  }
});

/**
 * Helper function to process ticket purchases
 * @param {any} data - Ticket purchase data
 */
async function processTicketPurchase(data: any) {
  const {ticketId, buyer, numbers, gameDay} = data;

  await db.collection("tickets").doc(ticketId.toString()).set({
    ticketId,
    buyer,
    numbers,
    gameDay,
    purchased: true,
    claimed: false,
    purchaseTime: new Date(),
  });
}

/**
 * Helper function to process draw executions
 * @param {any} data - Draw execution data
 */
async function processDrawExecution(data: any) {
  const {gameDay, winningNumbers, totalMainPools} = data;

  await db.collection("draws").doc(gameDay.toString()).set({
    gameDay,
    winningNumbers,
    totalMainPools,
    executed: true,
    drawTime: new Date(),
  });
}

/**
 * Helper function to process prize claims
 * @param {any} data - Prize claim data
 */
async function processPrizeClaim(data: any) {
  const {ticketId, winner, amount, prizeLevel, reserveUsedForRefill} = data;

  // Update ticket as claimed
  await db.collection("tickets").doc(ticketId.toString()).update({
    claimed: true,
    claimTime: new Date(),
    prizeAmount: amount,
    prizeLevel,
    reserveUsedForRefill,
  });

  // Record the prize claim
  await db.collection("prizes").add({
    ticketId,
    winner,
    amount,
    prizeLevel,
    reserveUsedForRefill,
    claimTime: new Date(),
  });
}

/**
 * Helper function to process daily reserves
 * @param {any} data - Daily reserves data
 */
async function processDailyReserves(data: any) {
  const {gameDay, firstReserveAmount, secondReserveAmount,
    thirdReserveAmount, totalSent} = data;

  await db.collection("reserves").doc(gameDay.toString()).set({
    gameDay,
    firstReserveAmount,
    secondReserveAmount,
    thirdReserveAmount,
    totalSent,
    sentTime: new Date(),
  });
}

/**
 * Health check endpoint
 * @param {any} req - HTTP request
 * @param {any} res - HTTP response
 */
export const healthCheck = onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json({
    status: "ok",
    service: "LottoMoji Firebase Functions",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});
