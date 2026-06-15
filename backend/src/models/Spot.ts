import mongoose, { Schema, Document } from "mongoose";

export interface ISpot extends Document {
  waterId: mongoose.Types.ObjectId;
  name: string;
  location: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  isFavorite: boolean;
  notes?: string;
}

const spotSchema = new Schema<ISpot>(
  {
    waterId: { type: Schema.Types.ObjectId, ref: "Water", required: true },
    name: { type: String, required: true },
    location: { type: String, default: "GPS Spot" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

// KORREKTUR: Falls ts-node-dev die Datei neu lädt, nutzen wir das bereits registrierte Modell,
// anstatt zu versuchen, es illegal ein zweites Mal zu erstellen.
const Spot = mongoose.models.Spot || mongoose.model<ISpot>("Spot", spotSchema);

export default Spot;
