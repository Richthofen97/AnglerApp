import mongoose, { Schema, Document } from "mongoose";

// Interface für einen einzelnen Kommentar
interface IComment {
  userId: mongoose.Types.ObjectId;
  userName: string; // Praktisch, um den Namen direkt ohne extra Populate anzuzeigen
  text: string;
  createdAt: Date;
}

export interface ICatch extends Document {
  userId: mongoose.Types.ObjectId;
  spotId: mongoose.Types.ObjectId;
  species: string;
  weight?: number;
  length?: number;
  imageUrl?: string;
  notes?: string;
  caughtAt: Date;
  isPublic: boolean;
  likes: mongoose.Types.ObjectId[]; // NEU: Liste von User-IDs, die geliked haben
  dislikes: mongoose.Types.ObjectId[]; // NEU: Liste von User-IDs, die gedisliked haben
  comments: IComment[]; // NEU: Liste von Kommentaren
}

const commentSchema = new Schema<IComment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const catchSchema = new Schema<ICatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    spotId: { type: Schema.Types.ObjectId, ref: "Spot", required: true },
    species: { type: String, required: true },
    weight: { type: Number },
    length: { type: Number },
    imageUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    caughtAt: { type: Date, default: Date.now },
    isPublic: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // NEU
    dislikes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // NEU
    comments: { type: [commentSchema], default: [] }, // NEU
  },
  { timestamps: true },
);

const Catch =
  mongoose.models.Catch || mongoose.model<ICatch>("Catch", catchSchema);
export default Catch;
