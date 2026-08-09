import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // false علشان البث العام
    },

    role: {
      type: String,
      enum: ["user", "seller", "admin", "super_admin"],
      required: false,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: [

        "ORDER_PLACED",
        "ORDER_CONFIRMED",
        "ORDER_PAID",
        "ORDER_PACKED",
        "ORDER_SHIPPED",
        "ORDER_OUT_FOR_DELIVERY",
        "ORDER_DELIVERED",
        "ORDER_COMPLETED",
        "ORDER_CANCELLED",
        "ORDER_RETURN_APPROVED",
        "ORDER_RETURN_REJECTED",
        "ORDER_REFUNDED",
        "ORDER_PREPARED",
        "PAYOUT_COMPLETED",

        "COMPLAINT_CREATED",
        "COMPLAINT_STATUS_UPDATED",
        "COMPLAINT_REPLY",

        "RETURN_REQUESTED",
        "RETURN_STATUS_UPDATED",

        "PRODUCT_SUBMITTED",
        "PRODUCT_APPROVED",
        "PRODUCT_REJECTED",
        "PRODUCT_UPDATED",
        "PRODUCT_OUT_OF_STOCK",
        "PRODUCT_BACK_IN_STOCK",

        "WALLET_UPDATED",
        "WALLET_CREDITED",
        "WALLET_DEBITED",
        "PAYMENT_FAILED",

        "USER_REGISTERED",
        "USER_VERIFIED",
        "USER_SUSPENDED",
        

        "ANNOUNCEMENT",
        "CUSTOM",
        "ALL_USERS"

      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    link: String,

    seen: {
      type: Boolean,
      default: false,
    },

    deleteAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, seen: 1 });
notificationSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Notification", notificationSchema);