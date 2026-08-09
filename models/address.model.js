// import mongoose from 'mongoose';

// const addressSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: [true, 'User reference is required']
//     },

//     governorate: { // المحافظة
//         type: String,
//         required: [true, 'Governorate is required'],
//         trim: true
//     },

//     city: { // المدينة
//         type: String,
//         required: [true, 'City is required'],
//         trim: true
//     },

//     district: { // الحي
//         type: String,
//         required: [true, 'District is required'],
//         trim: true
//     },

//     street: { // الشارع
//         type: String,
//         required: [true, 'Street is required'],
//         trim: true
//     },

//     postalCode: { // الرمز البريدي اختياري
//         type: String,
//         trim: true
//     },

//     isDefault: { // العنوان الافتراضي
//         type: Boolean,
//         default: false
//     }
// }, {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true }
// });

// // Ensure a user can only have one default address
// addressSchema.pre('save', async function (next) {
//     if (this.isDefault) {
//         await this.constructor.updateMany(
//             { user: this.user, _id: { $ne: this._id } },
//             { $set: { isDefault: false } }
//         );
//     }
//     next();
// });

// addressSchema.virtual('fullAddress').get(function () {
//     return `${this.governorate}, ${this.city}, ${this.district}, ${this.street}`;
// });

// export default mongoose.model('Address', addressSchema);
