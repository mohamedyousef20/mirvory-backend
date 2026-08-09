import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

export const uploadImage = async (file) => {
    try {
        console.log('Starting image upload process...');
        console.log('File details:', {
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            buffer: file.buffer ? 'exists' : 'missing'
        });

        if (!file.buffer) {
            throw new Error('File buffer is missing');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'mirvory',
                    resource_type: 'auto',
                    transformation: [
                        { width: 800, height: 600, crop: 'limit' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(new Error('Failed to upload image'));
                    } else {
                        console.log('Image upload successful:', {
                            url: result.secure_url,
                            publicId: result.public_id
                        });
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id
                        });
                    }
                }
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

export const removeImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log('Image removed successfully:', publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image');
    }
};