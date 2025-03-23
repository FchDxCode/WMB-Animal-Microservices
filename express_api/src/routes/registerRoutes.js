// src/routes/registerRoutes.js

import { Router } from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyOtpForgotPassword,
} from '../controllers/registerController.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *               confirm_password:
 *                 type: string
 *                 example: "secret123"
 *     responses:
 *       201:
 *         description: Registrasi berhasil
 *       400:
 *         description: Terjadi kesalahan validasi
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify otp register
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
 *               otp_code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Verifikasi berhasil
 *       400:
 *         description: OTP salah atau kadaluarsa
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/verify-otp', verifyOtp);

/**
 * @openapi
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend otp register
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
 *     responses:
 *       200:
 *         description: OTP berhasil dikirim ulang
 *       400:
 *         description: User sudah diverifikasi atau input salah
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/resend-otp', resendOtp);


/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
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
 *     responses:
 *       200:
 *         description: Berhasil mengirim OTP ke email
 *       404:
 *         description: User tidak ditemukan (opsional)
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/forgot-password', forgotPassword);

/**
 * @openapi
 * /api/auth/verify-otp-forgot-password:
 *   post:
 *     summary: Verify otp forgot password
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
 *               otp_code:
 *                 type: string
 *                 example: "123456"
 *               new_password:
 *                 type: string
 *                 example: "MyNewPassword123"
 *               confirm_password:
 *                 type: string
 *                 example: "MyNewPassword123"
 *     responses:
 *       200:
 *         description: Password berhasil direset
 *       400:
 *         description: OTP salah atau kadaluarsa, atau password tidak cocok
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/verify-otp-forgot-password', verifyOtpForgotPassword);

export default router;
