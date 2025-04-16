// routes/authDokterRoutes.js
import express from 'express';
import { 
  loginDokter, 
  logoutDokter, 
  getProfile,
  registerDokter
} from '../controllers/authDokterController.js';
import { authDokterMiddleware } from '../middlewares/authDokterMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Auth Dokter
 *   description: API untuk autentikasi dokter
 */

/**
 * @openapi
 * /api/auth-dokter/login:
 *   post:
 *     summary: Login dokter
 *     tags: [Auth Dokter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Kredensial salah
 *       500:
 *         description: Server error
 */
router.post('/login', loginDokter);

/**
 * @openapi
 * /api/auth-dokter/logout:
 *   post:
 *     summary: Logout dokter
 *     tags: [Auth Dokter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout berhasil
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Server error
 */
router.post('/logout', authDokterMiddleware, logoutDokter);

/**
 * @openapi
 * /api/auth-dokter/profile:
 *   get:
 *     summary: Mendapatkan profil dokter
 *     tags: [Auth Dokter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Dokter tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get('/profile', authDokterMiddleware, getProfile);

/**
 * @openapi
 * /api/auth-dokter/register:
 *   post:
 *     summary: Mendaftarkan dokter baru (Admin only)
 *     tags: [Auth Dokter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - email
 *               - password
 *               - universitas
 *               - klinik_id
 *             properties:
 *               nama:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               universitas:
 *                 type: string
 *               klinik_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Dokter berhasil didaftarkan
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Server error
 */
router.post('/register', registerDokter);

export default router;