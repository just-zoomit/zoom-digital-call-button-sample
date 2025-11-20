import express from "express";
import { claimHelpRequest, onTheWayHelpRequest } from "../services/requestService.js";

const router = express.Router();

/**
 * Helper: extract requestId from action_id or value
 * Example action_id values:
 *   "claimreq_mi77f3vm_njkkx4"
 *   "on_the_wayreq_mi77f3vm_njkkx4"
 * Example value format from chatbot:
 *   "claim-req_mi77f3vm_njkkx4"
 *   "on_the_way-req_mi77f3vm_njkkx4"
 */
function extractRequestIdFromActionId(actionId) {
  if (!actionId || typeof actionId !== "string") return null;

  // Try format: "action-req_id" (from chatbot service)
  const dashIndex = actionId.indexOf("-");
  if (dashIndex > -1) {
    const afterDash = actionId.slice(dashIndex + 1);
    if (afterDash.startsWith("req_")) {
      return afterDash;
    }
  }

  // Try legacy format: "actionreq_id"
  const marker = "req_";
  const idx = actionId.indexOf(marker);
  if (idx === -1) return null;

  // everything from "req_" onward is the request id
  return actionId.slice(idx); // e.g. "req_mi77f3vm_njkkx4"
}

/**
 * Handle interactive_message_actions events
 * (button clicks like Claim / On the way)
 */
async function handleInteractiveMessageActions(payload) {
  console.log("[Zoom webhook] handleInteractiveMessageActions payload:", JSON.stringify(payload, null, 2));
  
  if (!payload || !payload.actionItem) {
    console.warn("[Zoom webhook] Missing actionItem in payload");
    return;
  }

  const { actionItem, userId, userName } = payload;
  const actionText = actionItem.text;        // "Claim" or "On the way"
  const actionId   = actionItem.action_id;   // e.g. "claimreq_mi77f3vm_njkkx4"
  const actionValue = actionItem.value;      // e.g. "claim-req_mi77f3vm_njkkx4"

  console.log("[Zoom webhook] Action details:", {
    actionText,
    actionId,
    actionValue,
    userId,
    userName
  });

  const requestId = extractRequestIdFromActionId(actionId) || extractRequestIdFromActionId(actionValue);
  if (!requestId) {
    console.warn("[Zoom webhook] No requestId resolved from action_id:", actionId, "or value:", actionValue);
    return;
  }

  console.log("[Zoom webhook] Extracted requestId:", requestId);

  // Normalize action (you could also parse from value/action_id prefix)
  const isClaim     = actionText === "Claim";
  const isOnTheWay  = actionText === "On the way" || actionText === "On my way";

  if (isClaim && userId) {
    console.log(`[Zoom webhook] Processing CLAIM action for requestId: ${requestId}`);
    try {
      const result = await claimHelpRequest({
        requestId,
        zoomUserId: userId,
        zoomUserName: userName || "Store associate"
      });
      console.log(`[Zoom webhook] CLAIM successful:`, result);
    } catch (error) {
      console.error(`[Zoom webhook] CLAIM failed:`, error);
    }

    console.log(
      `[Zoom webhook] Request ${requestId} claimed by ${userName || userId}`
    );
  }

  if (isOnTheWay && userId) {
    console.log(`[Zoom webhook] Processing ON_THE_WAY action for requestId: ${requestId}`);
    try {
      const result = await onTheWayHelpRequest({
        requestId,
        zoomUserId: userId,
        zoomUserName: userName || "Store associate"
      });
      console.log(`[Zoom webhook] ON_THE_WAY successful:`, result);
    } catch (error) {
      console.error(`[Zoom webhook] ON_THE_WAY failed:`, error);
    }

    console.log(
      `[Zoom webhook] Request ${requestId} marked 'on the way' by ${userName || userId}`
    );
  }

  // You can expand here with more button types later if needed.
}

/**
 * Handle bot_notification events
 * (general notifications sent to the bot)
 */
async function handleBotNotification(payload) {
  if (!payload) return;

  // For now just log; later you might:
  // - handle subscription verification
  // - react to system events
  console.log("[Zoom webhook] bot_notification payload:", payload);
}

/**
 * POST /zoom/webhook
 * Central entry point for Zoom bot events.
 */
/**
 * GET /zoom/test-claim/:requestId
 * Test endpoint to manually trigger claim (for debugging)
 */
router.get("/test-claim/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`[Test] Manual claim test for requestId: ${requestId}`);
    
    const result = await claimHelpRequest({
      requestId,
      zoomUserId: "test-user",
      zoomUserName: "Test User"
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error("[Test] Manual claim test failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /zoom/test-ontheway/:requestId
 * Test endpoint to manually trigger on the way (for debugging)
 */
router.get("/test-ontheway/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`[Test] Manual on-the-way test for requestId: ${requestId}`);
    
    const result = await onTheWayHelpRequest({
      requestId,
      zoomUserId: "test-user",
      zoomUserName: "Test User"
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error("[Test] Manual on-the-way test failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /zoom/webhook
 * Central entry point for Zoom bot events.
 */
router.post("/webhook", express.json(), async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[Zoom webhook] ${timestamp} - Webhook called!`);
  console.log("[Zoom webhook] Headers:", req.headers);
  console.log("[Zoom webhook] Raw payload:", JSON.stringify(req.body, null, 2));

  // Handle webhook verification if needed
  if (req.headers['authorization']) {
    console.log("[Zoom webhook] Authorization header present:", req.headers['authorization']);
  }

  const { event, payload } = req.body || {};
  console.log("[Zoom webhook] Event type:", event);

  try {
    switch (event) {
      case "interactive_message_actions":
        console.log("[Zoom webhook] Processing interactive_message_actions");
        await handleInteractiveMessageActions(payload);
        break;

      case "bot_notification":
        console.log("[Zoom webhook] Processing bot_notification");
        await handleBotNotification(payload);
        break;

      default:
        // Unknown or unhandled event type
        console.log("[Zoom webhook] Unhandled event type:", event);
        console.log("[Zoom webhook] Full payload for debugging:", JSON.stringify(req.body, null, 2));
        break;
    }
  } catch (err) {
    console.error("[Zoom webhook] Error handling event:", event, err);
    // We still return 200 so Zoom doesn't keep retrying forever.
  }

  console.log("[Zoom webhook] Sending 200 response");
  // Zoom expects a quick 200
  res.status(200).json({ received: true, timestamp });
});

export default router;
