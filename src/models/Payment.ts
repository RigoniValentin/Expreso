import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  productType: "pib" | "eab";
  productId: mongoose.Types.ObjectId;
  productName: string;
  amount: number;
  currency: string;
  paymentMethod: "transferencia" | "pago_movil" | "paypal";
  paymentPlan: "full" | "monthly";
  installmentNumber: number; // 1 for full, 1-4 for monthly
  totalInstallments: number; // 1 for full, 4 for monthly
  referenceNumber?: string;
  receiptUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productType: {
      type: String,
      enum: ["pib", "eab"],
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "productRef",
    },
    productName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "VES",
    },
    paymentMethod: {
      type: String,
      enum: ["transferencia", "pago_movil", "paypal"],
      required: true,
    },
    referenceNumber: {
      type: String,
      default: "",
    },
    paymentPlan: {
      type: String,
      enum: ["full", "monthly"],
      default: "full",
    },
    installmentNumber: {
      type: Number,
      default: 1,
    },
    totalInstallments: {
      type: Number,
      default: 1,
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
  }
);

PaymentSchema.virtual("productRef").get(function (this: IPayment) {
  return this.productType === "pib" ? "PIBGroup" : "EAB";
});

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
