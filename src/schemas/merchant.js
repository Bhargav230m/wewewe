import mongoose from "mongoose";
const { Schema, model } = mongoose;

export const MessageSchema = new Schema({
  sender_username: { type: String, required: true },
  replyingToUsername: { type: String, default: null },
  message: { type: String, required: true },
});

export const DMSchema = new Schema({
  customer_username: { type: String, required: true },
  messages: { type: [MessageSchema], default: [] },
});

export const ProductSchema = new Schema(
  {
    product_id: { 
        type: String, 
        required: true,
        unique: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },

    dateCreated: {
      type: Date,
      required: true,
    },
    dms: {
      type: [DMSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const MerchantData = new Schema(
  {
    merchantDisplayName: {
      type: String,
      default: "Default_Merchant",
    },
    merchantUsername: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    merchantPassword: {
      type: String,
      required: true,
      select: false,
    },
    createdProducts: {
      type: [ProductSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default model("MerchantData", MerchantData);
