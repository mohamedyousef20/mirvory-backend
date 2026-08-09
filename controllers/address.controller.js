// import createError from '../utils/error.js';
// import Address from '../models/address.model.js';
// import User from '../models/user.model.js';
// // @desc    Add a new address
// // @route   POST /api/addresses
// // @access  Private
// export const addAddress = async (req, res, next) => {
//     try {
//         const userId = req.user.id;
//         const addressData = { ...req.body, user: userId };

//         // If this is the first address, set it as default
//         const addressCount = await Address.countDocuments({ user: userId });
//         if (addressCount === 0) {
//             addressData.isDefault = true;
//         } else if (addressData.isDefault) {
//             // If setting as default, update other addresses
//             await Address.updateMany(
//                 { user: userId, isDefault: true },
//                 { $set: { isDefault: false } }
//             );
//         }

//         const address = await Address.create(addressData);

//         // Add address to user's addresses array
//         await User.findByIdAndUpdate(userId, {
//             $addToSet: { addresses: address._id }
//         });

//         res.status(201).json({
//             success: true,
//             data: address
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // @desc    Get all addresses for a user
// // @route   GET /api/addresses
// // @access  Private
// export const getAddresses = async (req, res, next) => {
//     try {
//         const addresses = await Address.find({ user: req.user.id });
//         res.status(200).json({
//             success: true,
//             count: addresses.length,
//             data: addresses
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // @desc    Get single address
// // @route   GET /api/addresses/:id
// // @access  Private
// export const getAddress = async (req, res, next) => {
//     try {
//         const address = await Address.findOne({
//             _id: req.params.id,
//             user: req.user.id
//         });

//         if (!address) {
//             return next(new createError('Address not found', 404));
//         }

//         res.status(200).json({
//             success: true,
//             data: address
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // @desc    Update address
// // @route   PUT /api/addresses/:id
// // @access  Private
// export const updateAddress = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         const userId = req.user.id;
//         const updateData = { ...req.body };

//         // If setting as default, update other addresses
//         if (updateData.isDefault) {
//             await Address.updateMany(
//                 { user: userId, isDefault: true, _id: { $ne: id } },
//                 { $set: { isDefault: false } }
//             );
//         }

//         const address = await Address.findOneAndUpdate(
//             { _id: id, user: userId },
//             updateData,
//             { new: true, runValidators: true }
//         );

//         if (!address) {
//             return next(new createError('Address not found', 404));
//         }

//         res.status(200).json({
//             success: true,
//             data: address
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // @desc    Delete address
// // @route   DELETE /api/addresses/:id
// // @access  Private
// export const deleteAddress = async (req, res, next) => {
//     console.log(req.body.id)
//     try {
//         const address = await Address.findOneAndDelete({
//             _id: req.body.id,
//             user: req.user.id
//         });

//         if (!address) {
//             return next(new createError('Address not found', 404));
//         }

//         // Remove address from user's addresses array
//         await User.findByIdAndUpdate(req.user.id, {
//             $pull: { addresses: address._id }
//         });

//         // If deleted address was default, set another address as default
//         if (address.isDefault) {
//             const anotherAddress = await Address.findOne({ user: req.user.id });
//             if (anotherAddress) {
//                 anotherAddress.isDefault = true;
//                 await anotherAddress.save();
//             }
//         }

//         res.status(200).json({
//             success: true,
//             data: {}
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // @desc    Set default address
// // @route   PATCH /api/addresses/:id/set-default
// // @access  Private
// export const setDefaultAddress = async (req, res, next) => {
//     try {
//         const { id } = req.body;
//         const userId = req.user.id;

//         // Set all addresses to not default
//         await Address.updateMany(
//             { user: userId, isDefault: true },
//             { $set: { isDefault: false } }
//         );

//         // Set the selected address as default
//         const address = await Address.findOneAndUpdate(
//             { _id: id, user: userId },
//             { $set: { isDefault: true } },
//             { new: true }
//         );

//         if (!address) {
//             return next(new createError('Address not found', 404));
//         }

//         res.status(200).json({
//             success: true,
//             data: address
//         });
//     } catch (error) {
//         next(error);
//     }
// };
