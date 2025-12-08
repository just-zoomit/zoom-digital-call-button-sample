import express from "express";
import QRCode from "qrcode";
import { db } from "../db/mockDb.js";
import { env } from "../config/env.js";

const router = express.Router();

// Home page - redirect to search
router.get("/", (_, res) => {
  res.redirect("/search");
});

router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.render("search", {
        query: "",
        departments: [],
        products: []
      });
    }

    const results = await db.search(q);

    res.render("search", {
      query: q,
      departments: results.departments,
      products: results.products
    });
  } catch (err) {
    next(err);
  }
});

router.get("/departments/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await db.findDepartmentById(id);

    if (!department) {
      return res.status(404).send("Department not found");
    }

    const products = await db.listProducts({ departmentId: id });

    res.render("department", {
      department,
      products
    });
  } catch (err) {
    next(err);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await db.findProductById(id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const department = await db.findDepartmentById(product.departmentId);
    const store = await db.findStoreById(product.storeId);

    const baseUrl = env.nodeEnv === "production"
      ? `https://${req.get("host")}`
      : `http://${req.get("host")}`;

    const callUrl = `${baseUrl}/call?storeId=${product.storeId}&itemId=${product.id}`;

    const qrCodeDataUrl = await QRCode.toDataURL(callUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    res.render("product", {
      product,
      department,
      store,
      qrCodeDataUrl,
      callUrl
    });
  } catch (err) {
    next(err);
  }
});

export default router;
