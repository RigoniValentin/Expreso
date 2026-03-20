import mongoose, { Schema, Document } from "mongoose";

export interface IPillarVideo {
  key: string;
  youtubeId: string;
}

export interface IProductVideo {
  key: string; // pib, cb, eab
  youtubeId: string;
}

export interface ISiteConfig extends Document {
  pillarVideos: IPillarVideo[];
  productVideos: IProductVideo[];
  createdAt: Date;
  updatedAt: Date;
}

const PillarVideoSchema: Schema = new Schema({
  key: { type: String, required: true },
  youtubeId: { type: String, default: "" },
});

const ProductVideoSchema: Schema = new Schema({
  key: { type: String, required: true },
  youtubeId: { type: String, default: "" },
});

const SiteConfigSchema: Schema = new Schema(
  {
    pillarVideos: {
      type: [PillarVideoSchema],
      default: [
        { key: "biologia", youtubeId: "" },
        { key: "relaciones", youtubeId: "" },
        { key: "conciencia", youtubeId: "" },
        { key: "energia", youtubeId: "" },
      ],
    },
    productVideos: {
      type: [ProductVideoSchema],
      default: [
        { key: "pib", youtubeId: "" },
        { key: "cb", youtubeId: "" },
        { key: "eab", youtubeId: "" },
      ],
    },
  },
  { timestamps: true, versionKey: false }
);

export const SiteConfigModel = mongoose.model<ISiteConfig>("SiteConfig", SiteConfigSchema);
