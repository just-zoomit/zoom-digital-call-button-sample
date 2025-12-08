import express from "express";
import { db } from "../db/mockDb.js";
import { createHelpRequest, getHelpRequest } from "../services/requestService.js";
import { ChatbotService } from "../services/chatbotService.js";

const router = express.Router();
const chatbot = new ChatbotService();

/**
 * GET /call?storeId=store-123&itemId=item-apples
 * Renders the "digital call button" page.
 * Supports both legacy ITEMS (item-xxx) and new PRODUCTS (prod-xxx)
 */
router.get("/call", async (req, res, next) => {
  try {
    const { storeId, itemId } = req.query;

    if (!storeId || !itemId) {
      return res.status(400).send("Missing storeId or itemId");
    }

    const store = await db.findStoreById(storeId);

    let item = await db.findItemById(storeId, itemId);

    if (!item && itemId.startsWith("prod-")) {
      const product = await db.findProductById(itemId);
      if (product) {
        item = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          aisle: product.aisle
        };
      }
    }

    if (!store || !item) {
      return res.status(404).send("Store or item not found");
    }

    const prompts = await db.listPromptsForItem(itemId);

    res.render("call", {
      store,
      item,
      prompts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /call-request
 * Body: storeId, itemId, promptId?, customQuestion?
 * Supports both legacy ITEMS (item-xxx) and new PRODUCTS (prod-xxx)
 */
router.post("/call-request", express.urlencoded({ extended: true }), async (req, res, next) => {
  try {
    const { storeId, itemId, promptId, customQuestion } = req.body;

    if (!storeId || !itemId) {
      return res.status(400).send("Missing storeId or itemId");
    }

    const store = await db.findStoreById(storeId);

    let item = await db.findItemById(storeId, itemId);

    if (!item && itemId.startsWith("prod-")) {
      const product = await db.findProductById(itemId);
      if (product) {
        item = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          aisle: product.aisle
        };
      }
    }

    if (!store || !item) {
      return res.status(404).send("Store or item not found");
    }

    const prompts = await db.listPromptsForItem(itemId);
    const prompt = prompts.find(p => p.id === promptId) || null;
    const promptLabel = prompt ? prompt.label : null;

    const request = await createHelpRequest({
      storeId,
      itemId,
      promptId: promptId || null,
      customQuestion
    });

    // Fire-and-forget send to Zoom
    chatbot.sendNewRequestMessage({ request, store, item, promptLabel });

    // Render status page
    res.render("call-status", { requestId: request.id });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /call-status/:requestId
 * Renders a page that polls /api/status/:requestId
 */
router.get("/call-status/:requestId", async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const request = await getHelpRequest(requestId);

    if (!request) {
      return res.status(404).send("Request not found");
    }

    res.render("call-status", { requestId });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/status/:requestId
 * Returns JSON status for polling
 */
router.get("/api/status/:requestId", async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const request = await getHelpRequest(requestId);

    if (!request) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      id: request.id,
      status: request.status,
      claimedByDisplayName: request.claimedByName || request.onTheWayByName || null
    });
  } catch (err) {
    next(err);
  }
});

export default router;
