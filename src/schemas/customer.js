import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CustomerData = new Schema(
  {
    customerDisplayName: {
      type: String,
      default: "Default_Customer",
    },
    customerUsername: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    customerPassword: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

export default model("CustomerData", CustomerData);
