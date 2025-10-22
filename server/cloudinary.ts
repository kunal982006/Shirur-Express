import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Yeh code Replit Secrets se keys uthaakar Cloudinary se connection banayega
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Yeh function file buffer lega aur usko Cloudinary par upload karega
export const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        // Hum har photo ko optimize kar rahe hain taaki space bache
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto:good' }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result) {
          resolve(result.secure_url); // Upload hone ke baad photo ka URL return karega
        }
      }
    );

    // Buffer ko stream me convert karke upload stream me bhej do
    const readableStream = new Readable();
    readableStream._read = () => {};
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};