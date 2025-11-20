// In-memory store for items, prompts, and help requests

const STORES = [
  { id: "store-123", name: "Main Street Store" }
];

const ITEMS = [
  {
    id: "item-apples",
    storeId: "store-123",
    name: "Organic Apples",
    sku: "APL-001",
    aisle: "Aisle 4"
  },
  {
    id: "item-headphones",
    storeId: "store-123",
    name: "Wireless Headphones",
    sku: "TECH-001",
    aisle: "Electronics - Aisle 12"
  }
];

const PROMPTS = [
  {
    id: "prompt-find-more",
    label: "I need help finding this item.",
    itemId: null // generic
  },
  {
    id: "prompt-unlock-case",
    label: "I need this item unlocked from a case.",
    itemId: "item-headphones"
  },
  {
    id: "prompt-question",
    label: "I have a question about this product.",
    itemId: null
  }
];

// Map<requestId, requestObject>
const REQUESTS = new Map();

/**
 * CRUD-like helper functions
 */
export const db = {
  async findStoreById(id) {
    return STORES.find(s => s.id === id) || null;
  },

  async findItemById(storeId, itemId) {
    return ITEMS.find(i => i.storeId === storeId && i.id === itemId) || null;
  },

  async listPromptsForItem(itemId) {
    return PROMPTS.filter(p => !p.itemId || p.itemId === itemId);
  },

  async createRequest(request) {
    REQUESTS.set(request.id, request);
    return request;
  },

  async getRequestById(id) {
    return REQUESTS.get(id) || null;
  },

  async updateRequest(id, changes) {
    const existing = REQUESTS.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes };
    REQUESTS.set(id, updated);
    return updated;
  }
};
