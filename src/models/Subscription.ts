import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: "nehilak_4_months";
  status: "active" | "paused" | "cancelled" | "completed";
  startDate: Date;
  endDate: Date;
  paymentInfo: {
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
  };
  progress: {
    currentWeek: number;
    completedModules: mongoose.Types.ObjectId[];
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    plan: {
      type: String,
      enum: ["nehilak_4_months"],
      default: "nehilak_4_months",
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "completed"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentInfo: {
      amount: { type: Number, required: true },
      currency: { type: String, default: "USD" },
      paymentMethod: { type: String, required: true },
      transactionId: { type: String, required: true },
    },
    progress: {
      currentWeek: { type: Number, default: 1 },
      completedModules: [{ type: Schema.Types.ObjectId, ref: "Module" }],
      lastActivity: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
