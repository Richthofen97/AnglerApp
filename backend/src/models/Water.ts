import mongoose, { Schema, Document } from "mongoose";

export interface IWater extends Document {
  name: string;
  location: string;
  lat: number;
  lng: number;
}

const waterSchema = new Schema<IWater>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model<IWater>("Water", waterSchema);
