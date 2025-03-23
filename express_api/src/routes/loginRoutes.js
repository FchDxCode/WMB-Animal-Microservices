// src/routes/loginRoutes.js

import { Router } from 'express';
import { login, logout } from '../controllers/loginController.js';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "mypassword"
 *     responses:
 *       200:
 *         description: Login berhasil, kembalikan token
 *       400:
 *         description: Input kurang
 *       401:
 *         description: Email atau password salah
 *       403:
 *         description: (Opsional) Akun belum diverifikasi
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout (invalidasi token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout berhasil
 *       400:
 *         description: Token tidak ditemukan
 *       401:
 *         description: Token tidak valid
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/logout', logout);

export default router;
