// utils/uploadBuktiTransferUtils.js
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const BASE_STORAGE_PATH = process.env.STORAGE_PATH || 'public/images';
const BUKTI_TRANSFER_PATH = path.join(process.cwd(), BASE_STORAGE_PATH, 'bukti-transfer');

// Buat direktori jika belum ada
if (!fs.existsSync(BUKTI_TRANSFER_PATH)) {
  fs.mkdirSync(BUKTI_TRANSFER_PATH, { recursive: true });
}

// Konfigurasi storage untuk bukti transfer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BUKTI_TRANSFER_PATH);
  },
  filename: (req, file, cb) => {
    // Gunakan ID pembayaran untuk nama file
    const paymentId = req.params.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `bukti-transfer-${paymentId}-${uniqueSuffix}${ext}`);
  }
});

// Konfigurasi upload
export const uploadBuktiTransfer = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak valid. Hanya JPEG, JPG dan PNG yang diizinkan.'));
    }
  }
});

// Helper untuk membuat URL bukti transfer
export const createBuktiTransferUrl = (filename) => {
  if (!filename) return null;
  return `${process.env.BASE_URL || 'http://localhost:3000'}/images/bukti-transfer/${filename}`;
};