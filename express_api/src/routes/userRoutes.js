// src/routes/userRoutes.js
import { Router } from 'express';
import { uploadConfig } from '../utils/uploadUtils.js';
import {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik pengguna
 *           example: 1
 *         name:
 *           type: string
 *           description: Nama lengkap pengguna
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Alamat email pengguna
 *           example: "john@example.com"
 *         email_verified_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Waktu verifikasi email (null jika belum diverifikasi)
 *           example: "2025-03-20T10:15:30.000Z"
 *         profile_image:
 *           type: string
 *           nullable: true
 *           description: Nama file gambar profil (null jika belum diupload)
 *           example: "user_123456.jpg"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Waktu pembuatan akun
 *           example: "2025-01-15T08:30:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Waktu terakhir pembaruan profil
 *           example: "2025-03-20T10:15:30.000Z"
 *     
 *     ProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nama lengkap baru
 *           minLength: 3
 *           maxLength: 50
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Alamat email baru (akan memerlukan verifikasi ulang)
 *           example: "jane@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Password baru (opsional)
 *           minLength: 8
 *           example: "newpassword123"
 *     
 *     PasswordChangeRequest:
 *       type: object
 *       required:
 *         - old_password
 *         - new_password
 *       properties:
 *         old_password:
 *           type: string
 *           format: password
 *           description: Password lama untuk verifikasi
 *           example: "oldpassword123"
 *         new_password:
 *           type: string
 *           format: password
 *           description: Password baru (minimal 8 karakter)
 *           minLength: 8
 *           example: "newpassword456"
 *     
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operasi berhasil."
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Terjadi kesalahan pada server."
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Gunakan token JWT yang didapat saat login sebagai Bearer token
 */

/**
 * @openapi
 * tags:
 *   name: Profil Pengguna
 *   description: API untuk manajemen profil pengguna
 */

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     summary: Mendapatkan data profil pengguna yang sedang login
 *     description: Mengambil informasi profil lengkap pengguna berdasarkan token autentikasi
 *     tags: [Profil Pengguna]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data profil pengguna berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Tidak terautentikasi atau token tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token tidak valid atau sudah kadaluarsa."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @openapi
 * /api/user/profile:
 *   put:
 *     summary: Memperbarui profil pengguna
 *     description: |
 *       Memperbarui data profil pengguna seperti nama, email, dan/atau password.
 *       Jika email diubah, status verifikasi akan direset dan pengguna perlu verifikasi ulang melalui OTP.
 *     tags: [Profil Pengguna]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profil berhasil diperbarui. Karena email diubah, silakan verifikasi email baru dengan OTP yang dikirim."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Jane Doe"
 *                     email:
 *                       type: string
 *                       example: "jane@example.com"
 *                     email_verified_at:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Validasi input gagal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email sudah digunakan oleh pengguna lain."
 *       401:
 *         description: Tidak terautentikasi atau token tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token tidak valid atau sudah kadaluarsa."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @openapi
 * /api/user/profile/image:
 *   put:
 *     summary: Mengupdate foto profil pengguna
 *     description: | 
 *       Mengunggah dan memperbarui foto profil pengguna. File lama akan dihapus dari server secara otomatis.
 *       Hanya mengupdate jika record gambar profil sudah ada. Jika belum ada, hubungi administrator.
 *     tags: [Profil Pengguna]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profile_image
 *             properties:
 *               profile_image:
 *                 type: string
 *                 format: binary
 *                 description: File gambar profil (JPG, PNG, GIF, maksimal 2MB)
 *     responses:
 *       200:
 *         description: Foto profil berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image berhasil diperbarui."
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile_image:
 *                       type: string
 *                       example: "user_1234.jpg"
 *       400:
 *         description: Validasi file gagal atau data profil belum ada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File gambar tidak ditemukan atau Data profile image belum ada. Silakan hubungi administrator."
 *       401:
 *         description: Tidak terautentikasi atau token tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token tidak valid atau sudah kadaluarsa."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/profile/image', 
  authMiddleware, 
  uploadConfig.userProfile.single('profile_image'), 
  updateProfileImage
);

/**
 * @openapi
 * /api/user/change-password:
 *   put:
 *     summary: Mengubah password pengguna
 *     description: |
 *       Mengubah password pengguna dengan verifikasi password lama untuk keamanan.
 *       Password baru harus berbeda dengan password lama dan minimal 8 karakter.
 *     tags: [Profil Pengguna]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChangeRequest'
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password berhasil diubah."
 *       400:
 *         description: Input tidak lengkap atau password baru tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Password lama dan password baru harus diisi."
 *       401:
 *         description: Password lama tidak sesuai atau token tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Password lama tidak sesuai."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/change-password', authMiddleware, changePassword);

export default router;