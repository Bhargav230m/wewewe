// @ts-check

// import "dotenv/config";
import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import bycrypt from "bcrypt";
import mongoose from "mongoose";
import MerchantData, { DMSchema, ProductSchema } from "./schemas/merchant.js";
import CustomerData from "./schemas/customer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

if (!port) {
  throw Error("Couldn't detect port");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
await mongoose.connect("mongodb://localhost:27017/litfestest");
console.log("Connected to MongoDB.");

/**
 *
 * @param {string} PREFIX
 * @returns
 */
function uniqueID(PREFIX) {
  return PREFIX + "_" + crypto.randomBytes(8).toString("hex");
}

/**
 *
 * @param {string} userpass
 * @param {string} storedpass
 */
async function comparePasswords(userpass, storedpass) {
  return await bycrypt.compare(userpass, storedpass);
}

app.listen(port, () => {
  console.log(`Digital Chaupal is open at http://localhost:${port}`);
});

app.post("/create_order_post", async (req, res) => {
  let { merchant_username, merchant_password, productName, price } = req.body;

  if (!merchant_username || !merchant_password) {
    return res
      .status(400)
      .json({ error: "Merchant username or password isn't there." });
  }

  const merchant = await MerchantData.findOne({
    merchantUsername: merchant_username,
  }).select("merchantUsername merchantPassword");

  if (!merchant) {
    return res.status(400).json({ error: "This merchant doesn't exist." });
  }

  if (await comparePasswords(merchant_password, merchant.merchantPassword)) {
    console.log(`Authentication successful with ${merchant_username}`);

    const id = uniqueID("PRODUCT");
    const date = new Date();
    merchant.createdProducts.push({
      product_id: id,
      product_name: productName,
      price: price,
      dateCreated: date,
      dms: [],
    });

    await merchant.save();

    return res.status(201).json({
      message: "Successfully created product",
      data: {
        product_id: id,
        product_name: productName,
        price: price,
        dateCreated: date,
        dms: [],
      },
    });
  } else {
    return res.status(400).json({ error: "unable to authenticate" });
  }
});

app.post("/create_order_customer", async (req, res) => {
  let { customer_username, customer_password, merchant_username, productId } =
    req.body;

  if (!customer_username || !merchant_username) {
    return res.status(400).json({ error: "Customer username is required" });
  }

  const customer = await CustomerData.findOne({
    customerUsername: customer_username,
  }).select("customerUsername customerPassword");
  if (!customer) {
    return res.status(400).json({ error: "This customer doesn't exist." });
  }

  if (await comparePasswords(customer_password, customer.customerPassword)) {
    console.log(`Authentication successful with ${customer_username}`);

    const merchant = await MerchantData.findOne({
      merchantUsername: merchant_username,
    });

    if (!merchant) {
      return res.status(400).json({ error: "This merchant doesn't exist" });
    }

    const foundProduct = merchant.createdProducts.find(
      (data) => data.product_id === productId,
    );
    if (!foundProduct) {
      return res.status(400).json({ error: "This product does not exist." });
    }

    foundProduct.dms.push({ customer_username, messages: [] });
    merchant.markModified("createdProducts");
    await merchant.save();

    res.status(201).json({
      message: "Created order",
      data: {
        customer_username: customer_username,
        messages: [],
      },
    });
  } else {
    return res.status(400).json({ error: "Unable to authenticate" });
  }
});

app.post("/fetch_merchant", async (req, res) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username or password is missing." });
  }

  const merchant = await MerchantData.findOne({
    merchantUsername: username,
  }).select("merchantUsername merchantPassword createdProducts");

  if (!merchant) {
    return res.status(400).json({ error: "This user does not exist." });
  }

  if (await comparePasswords(password, merchant.merchantPassword)) {
    console.log(`${username} log in successful`);
    return res.status(201).json({
      message: "successful login",
      data: {
        username: merchant.merchantUsername,
        displayName: merchant.merchantDisplayName,
        createdProducts: merchant.createdProducts,
      },
    });
  } else {
    return res.status(400).json({ error: "Username or Password is wrong." });
  }
});

app.post("/sign_up_merchant", async (req, res) => {
  let { username, password, displayName, avatarData } = req.body;

  displayName = displayName || "Default_Merchant"; // schema already handles default cases, but being explicit is betttter
  /** @type {import("mongoose").InferSchemaType<typeof ProductSchema>[]} */
  const createdProducts = [];

  if (!username || !password) {
    return res.status(400).json({ error: "Username or password is missing." });
  }

  const merchant = await MerchantData.findOne({ merchantUsername: username });
  if (merchant) {
    return res
      .status(400)
      .json({ error: "This username already exists, pick something else!" });
  }

  try {
    const merchant = await MerchantData.create({
      merchantDisplayName: displayName,
      merchantUsername: username,
      createdProducts: createdProducts,
      merchantPassword: await bycrypt.hash(password, 12),
    });

    return res.status(201).json({
      message: "successful signup!",
      data: {
        username: merchant.merchantUsername,
        displayName: merchant.merchantDisplayName,
        createdProducts: createdProducts,
      },
    });
  } catch (err) {
    // @ts-ignore
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "This username already exists, pick something else!" });
    }
    return res.status(500).json({ error: "Something went wrong." });
  }
});