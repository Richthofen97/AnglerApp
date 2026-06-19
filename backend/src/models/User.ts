import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isVerified: boolean; // NEU: Status ob verifiziert
  verificationCode?: string; // NEU: Der 6-stellige OTP-Code
  verificationCodeExpires?: Date; // NEU: Ablaufzeit des Codes
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    // NEU: Felder für die E-Mail-Verifizierung
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
