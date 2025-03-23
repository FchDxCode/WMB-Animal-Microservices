// src/routes/userRoutes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = Router();

// Setup path untuk penyimpanan profile image
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILE_IMAGE_PATH = process.env.STORAGE_PATH || 'public/storage/folderprofile';

// Konfigurasi multer untuk file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PROFILE_IMAGE_PATH);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     summary: Mendapatkan data profil user yang sedang login
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data profil user berhasil didapatkan
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @openapi
 * /api/user/profile:
 *   put:
 *     summary: Update profil user (name, email, password)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *               email:
 *                 type: string
 *                 example: "jane@example.com"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
 *       400:
 *         description: Validasi gagal
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @openapi
 * /api/user/profile/image:
 *   put:
 *     summary: Update profile image user (hanya update, tidak membuat record baru)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image berhasil diperbarui
 *       400:
 *         description: Validasi gagal atau record tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.put('/profile/image', authMiddleware, upload.single('profile_image'), updateProfileImage);

/**
 * @openapi
 * /api/user/change-password:
 *   put:
 *     summary: Ganti password dengan validasi password lama
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               old_password:
 *                 type: string
 *                 example: "oldpassword123"
 *               new_password:
 *                 type: string
 *                 example: "newpassword456"
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Password lama tidak sesuai
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.put('/change-password', authMiddleware, changePassword);

export default router;
