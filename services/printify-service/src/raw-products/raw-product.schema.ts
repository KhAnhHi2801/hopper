import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RawProductDocument = HydratedDocument<RawProduct>;

/**
 * Mongoose schema for the `raw_products` collection — one collection shared
 * across all source platforms (not one collection per platform), using
 * `platform` as a discriminator field. Owned solely by printify-service (and
 * future source adapters); never written to directly by other services.
 */
@Schema({ timestamps: true })
export class RawProduct {
  @Prop({ required: true })
  platform!: string; // discriminator: 'printify' | 'printway' | 'shineon'

  @Prop({ required: true })
  sourceProductId!: string;

  @Prop({ type: Object, required: true })
  raw!: Record<string, unknown>; // Raw data returned from Printify API
}

export const RawProductSchema = SchemaFactory.createForClass(RawProduct);
