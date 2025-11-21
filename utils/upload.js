import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../storage/screenshots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Middleware to process and optimize uploaded images
const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filePath = req.file.path;
    const outputPath = `${filePath}.webp`;
    
    // Convert and optimize image to WebP
    await sharp(filePath)
      .webp({ quality: 80, effort: 6 })
      .toFile(outputPath);
    
    // Remove original file
    fs.unlinkSync(filePath);
    
    // Update file info
    req.file.filename = `${path.basename(filePath)}.webp`;
    req.file.path = outputPath;
    req.file.mimetype = 'image/webp';
    
    // Get file stats
    const stats = fs.statSync(outputPath);
    req.file.size = stats.size;
    
    next();
  } catch (error) {
    logger.error('Error processing image:', error);
    // Clean up if there was an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Export the multer instance and processImage middleware
export { upload, processImage };

export default {
  upload,
  processImage
};
