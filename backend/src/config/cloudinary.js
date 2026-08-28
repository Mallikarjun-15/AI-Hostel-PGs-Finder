const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — buffers are uploaded directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, png, jpg, webp) are allowed.'));
    }
  },
});

// Helper: upload a buffer to Cloudinary and return the secure URL
const uploadToCloudinary = (buffer, mimetype, folder = 'stayfinder_properties') => {
  return new Promise((resolve, reject) => {
    if (process.env.CLOUDINARY_CLOUD_NAME === 'Root' || !process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('Using dummy Cloudinary credentials. Falling back to base64 data URI.');
      const base64Image = `data:${mimetype || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      return resolve(base64Image);
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload failed, falling back to base64:', error);
          const base64Image = `data:${mimetype || 'image/jpeg'};base64,${buffer.toString('base64')}`;
          return resolve(base64Image);
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };
