import mongoose from 'mongoose';

const pickupPointSchema = new mongoose.Schema({
  stationName: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  address: { type: String, required: true },
  phone: { type: String }, workingHours: { type: String },
  status: { type: String, default: 'active' }
}, { timestamps: true });

pickupPointSchema.index({ location: '2dsphere' });

export default mongoose.model('PickupPoint', pickupPointSchema);