import express from "express";
import { claimHelpRequest } from "../services/requestService.js";

const router = express.Router();

/**
 * Helper: extract requestId from action_id
 * Example action_id values:
 *   "claimreq_mi77f3vm_njkkx4"
 *   "on_the_wayreq_mi77f3vm_njkkx4"
 */
function extractRequestIdFromActionId(actionId) {
  if (!actionId || typeof actionId !== "string") return null;

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
  if (!payload || !payload.actionItem) return;

  const { actionItem, userId, userName } = payload;
  const actionText = actionItem.text;        // "Claim" or "On the way"
  const actionId   = actionItem.action_id;   // e.g. "claimreq_mi77f3vm_njkkx4"

  const requestId = extractRequestIdFromActionId(actionId);
  if (!requestId) {
    console.warn("[Zoom webhook] No requestId resolved from action_id:", actionId);
    return;
  }

  // Normalize action (you could also parse from value/action_id prefix)
  const isClaim     = actionText === "Claim";
  const isOnTheWay  = actionText === "On the way";

  if (isClaim && userId) {
    await claimHelpRequest({
      requestId,
      zoomUserId: userId,
      zoomUserName: userName || "Store associate"
    });

    console.log(
      `[Zoom webhook] Request ${requestId} claimed by ${userName || userId}`
    );
  }

  if (isOnTheWay && userId) {
    // TODO: implement "on the way" status if you add it to RequestStatus
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
router.post("/webhook", express.json(), async (req, res) => {
  // NOTE: In production, verify Zoom signatures / tokens here.
  console.log("[Zoom webhook] raw payload:", JSON.stringify(req.body, null, 2));

  const { event, payload } = req.body || {};

  try {
    switch (event) {
      case "interactive_message_actions":
        await handleInteractiveMessageActions(payload);
        break;

      case "bot_notification":
        await handleBotNotification(payload);
        break;

      default:
        // Unknown or unhandled event type
        console.log("[Zoom webhook] Unhandled event type:", event);
        break;
    }
  } catch (err) {
    console.error("[Zoom webhook] Error handling event:", event, err);
    // We still return 200 so Zoom doesn't keep retrying forever.
  }

  // Zoom expects a quick 200
  res.status(200).json({ received: true });
});

export default router;
