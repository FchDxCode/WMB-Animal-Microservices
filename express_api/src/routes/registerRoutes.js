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
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         email_verified_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2023-01-01T00:00:00.000Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
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
 */

/**
 * @openapi
 * tags:
 *   name: Register
 *   description: API untuk register dan manajemen akun pengguna
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registrasi akun pengguna baru
 *     description: Membuat akun pengguna baru dan mengirimkan kode OTP untuk verifikasi email
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama lengkap pengguna
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Alamat email pengguna (unique)
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Kata sandi akun (minimal 8 karakter)
 *                 example: "secret123"
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 description: Konfirmasi kata sandi (harus sama dengan password)
 *                 example: "secret123"
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirm_password
 *     responses:
 *       201:
 *         description: Registrasi berhasil dan OTP telah dikirim ke email
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
 *                   example: "Registrasi berhasil. Silakan verifikasi email Anda menggunakan kode OTP."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     otp_sent:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validasi input gagal atau email sudah terdaftar
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
 *                   example: "Email sudah terdaftar."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verifikasi kode OTP untuk registrasi
 *     description: Memverifikasi kode OTP yang dikirim ke email pengguna saat registrasi
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Alamat email yang digunakan saat registrasi
 *                 example: "john@example.com"
 *               otp_code:
 *                 type: string
 *                 description: Kode OTP 6 digit yang dikirim ke email
 *                 example: "123456"
 *             required:
 *               - email
 *               - otp_code
 *     responses:
 *       200:
 *         description: Verifikasi OTP berhasil
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
 *                   example: "Verifikasi OTP berhasil. Akun Anda sudah aktif."
 *       400:
 *         description: OTP salah atau sudah kadaluarsa
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
 *                   example: "Kode OTP tidak valid atau sudah kadaluarsa."
 *       404:
 *         description: Pengguna dengan email tersebut tidak ditemukan
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
 *                   example: "Pengguna dengan email tersebut tidak ditemukan."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-otp', verifyOtp);

/**
 * @openapi
 * /api/auth/resend-otp:
 *   post:
 *     summary: Kirim ulang kode OTP untuk verifikasi
 *     description: Mengirim ulang kode OTP ke email pengguna jika kode sebelumnya kadaluarsa atau tidak diterima
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Alamat email yang digunakan saat registrasi
 *                 example: "john@example.com"
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: OTP berhasil dikirim ulang
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
 *                   example: "Kode OTP baru telah dikirim ke email Anda."
 *       400:
 *         description: Pengguna sudah diverifikasi atau waktu tunggu belum habis
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
 *                   example: "Akun Anda sudah terverifikasi atau Anda harus menunggu 1 menit sebelum meminta OTP baru."
 *       404:
 *         description: Pengguna dengan email tersebut tidak ditemukan
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
 *                   example: "Pengguna dengan email tersebut tidak ditemukan."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/resend-otp', resendOtp);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Permintaan reset kata sandi
 *     description: Mengirimkan kode OTP ke email pengguna untuk proses reset kata sandi
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Alamat email akun yang akan direset kata sandinya
 *                 example: "john@example.com"
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Kode OTP untuk reset kata sandi berhasil dikirim
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
 *                   example: "Kode OTP untuk reset kata sandi telah dikirim ke email Anda."
 *       404:
 *         description: Pengguna dengan email tersebut tidak ditemukan
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
 *                   example: "Pengguna dengan email tersebut tidak ditemukan."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/forgot-password', forgotPassword);

/**
 * @openapi
 * /api/auth/verify-otp-forgot-password:
 *   post:
 *     summary: Verifikasi OTP dan reset kata sandi
 *     description: Memverifikasi kode OTP dan mengubah kata sandi pengguna dengan kata sandi baru
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Alamat email yang digunakan saat permintaan reset kata sandi
 *                 example: "john@example.com"
 *               otp_code:
 *                 type: string
 *                 description: Kode OTP 6 digit yang dikirim ke email
 *                 example: "123456"
 *               new_password:
 *                 type: string
 *                 format: password
 *                 description: Kata sandi baru (minimal 8 karakter)
 *                 example: "MyNewPassword123"
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 description: Konfirmasi kata sandi baru (harus sama dengan new_password)
 *                 example: "MyNewPassword123"
 *             required:
 *               - email
 *               - otp_code
 *               - new_password
 *               - confirm_password
 *     responses:
 *       200:
 *         description: Kata sandi berhasil direset
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
 *                   example: "Kata sandi berhasil diubah. Silakan login dengan kata sandi baru Anda."
 *       400:
 *         description: Validasi gagal, OTP salah, atau kata sandi tidak cocok
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
 *                   example: "Kode OTP tidak valid atau sudah kadaluarsa."
 *       404:
 *         description: Pengguna dengan email tersebut tidak ditemukan
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
 *                   example: "Pengguna dengan email tersebut tidak ditemukan."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-otp-forgot-password', verifyOtpForgotPassword);

export default router;