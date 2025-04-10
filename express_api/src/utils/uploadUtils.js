import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const BASE_STORAGE_PATH = process.env.STORAGE_PATH || 'public/images';

// Tambahkan path untuk artikel
export const uploadPaths = {
  userImages: path.join(process.cwd(), BASE_STORAGE_PATH, 'profile-images'),
  petImages: path.join(process.cwd(), BASE_STORAGE_PATH, 'pet-images'),
  artikelImages: path.join(process.cwd(), BASE_STORAGE_PATH, 'artikel-images'),
  mediaSections: path.join(process.cwd(), BASE_STORAGE_PATH, 'media-sections'),
  configImages: path.join(process.cwd(), BASE_STORAGE_PATH, 'config-images'),
  productImages: path.join(process.cwd(), BASE_STORAGE_PATH, 'product-images'),
};

// Buat direktori jika belum ada
Object.values(uploadPaths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Konfigurasi storage untuk tiap jenis upload
const createStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
};

// Tambahkan konfigurasi untuk artikel
export const uploadConfig = {
  userProfile: multer({ 
    storage: createStorage(uploadPaths.userImages),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
      }
    }
  }),
  petProfile: multer({ 
    storage: createStorage(uploadPaths.petImages),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
      }
    }
  }),
  artikelImage: multer({
    storage: createStorage(uploadPaths.artikelImages),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB untuk artikel
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
      }
    }
  }),
  mediaSection: {
    fileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
  configImage: {
    storage: createStorage(uploadPaths.configImages),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit untuk gambar konfigurasi
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/x-icon'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and ICO are allowed.'));
      }
    }
  },
  productImage: {
    storage: createStorage(uploadPaths.productImages),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
      }
    }
  }
};

// Helper untuk membuat URL gambar
export const createImageUrl = (filename, folder) => {
  if (!filename) return null;
  return `${process.env.BASE_URL || 'http://localhost:3000'}/images/${folder}/${filename}`;
};

// Nama folder untuk setiap jenis upload
export const uploadFolders = {
  userImages: 'profile-images',
  petImages: 'pet-images',
  artikelImages: 'artikel-images',
  mediaSections: 'media-sections',
  configImages: 'config-images',
  productImages: 'product-images'
};