// In-memory store for items, prompts, and help requests

const STORES = [
  { id: "store-123", name: "Main Street Store" }
];

const DEPARTMENTS = [
  {
    id: "dept-produce",
    name: "Produce",
    description: "Fresh fruits and vegetables"
  },
  {
    id: "dept-electronics",
    name: "Electronics",
    description: "TVs, headphones, computers, and tech accessories"
  },
  {
    id: "dept-bakery",
    name: "Bakery",
    description: "Fresh breads, cakes, and pastries"
  },
  {
    id: "dept-clothing",
    name: "Clothing",
    description: "Apparel and accessories for the whole family"
  }
];

const PRODUCTS = [
  {
    id: "prod-apples",
    departmentId: "dept-produce",
    storeId: "store-123",
    name: "Organic Apples",
    description: "Fresh organic apples, perfect for snacking or baking. Crisp and sweet.",
    sku: "APL-001",
    aisle: "Aisle 4"
  },
  {
    id: "prod-bananas",
    departmentId: "dept-produce",
    storeId: "store-123",
    name: "Bananas",
    description: "Ripe yellow bananas, great source of potassium and energy.",
    sku: "BAN-001",
    aisle: "Aisle 4"
  },
  {
    id: "prod-headphones",
    departmentId: "dept-electronics",
    storeId: "store-123",
    name: "Wireless Headphones",
    description: "Premium wireless headphones with noise cancellation and 30-hour battery life.",
    sku: "TECH-001",
    aisle: "Electronics - Aisle 12"
  },
  {
    id: "prod-laptop",
    departmentId: "dept-electronics",
    storeId: "store-123",
    name: "15-inch Laptop",
    description: "Powerful laptop with fast processor, perfect for work and entertainment.",
    sku: "TECH-002",
    aisle: "Electronics - Aisle 11"
  },
  {
    id: "prod-bread",
    departmentId: "dept-bakery",
    storeId: "store-123",
    name: "Sourdough Bread",
    description: "Artisan sourdough bread baked fresh daily.",
    sku: "BAK-001",
    aisle: "Bakery - Aisle 2"
  },
  {
    id: "prod-tshirt",
    departmentId: "dept-clothing",
    storeId: "store-123",
    name: "Cotton T-Shirt",
    description: "Comfortable 100% cotton t-shirt, available in multiple colors.",
    sku: "CLO-001",
    aisle: "Clothing - Aisle 15"
  }
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
  },

  async listDepartments() {
    return DEPARTMENTS;
  },

  async findDepartmentById(id) {
    return DEPARTMENTS.find(d => d.id === id) || null;
  },

  async listProducts(filters = {}) {
    let results = PRODUCTS;
    if (filters.departmentId) {
      results = results.filter(p => p.departmentId === filters.departmentId);
    }
    if (filters.storeId) {
      results = results.filter(p => p.storeId === filters.storeId);
    }
    return results;
  },

  async findProductById(id) {
    return PRODUCTS.find(p => p.id === id) || null;
  },

  async search(query) {
    if (!query) {
      return { departments: [], products: [] };
    }

    const lowerQuery = query.toLowerCase();
    const departments = DEPARTMENTS.filter(d =>
      d.name.toLowerCase().includes(lowerQuery) ||
      d.description.toLowerCase().includes(lowerQuery)
    );

    const products = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery)
    );

    return { departments, products };
  }
};
