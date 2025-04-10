import express from 'express';
import { googleLogin, getUserInfo } from '../controllers/googleAuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     GoogleLoginRequest:
 *       type: object
 *       required:
 *         - idToken
 *       properties:
 *         idToken:
 *           type: string
 *           description: Token ID yang didapatkan dari proses login dengan Google
 *           example: "eyJhbGciOiJSUzI1NiIsImtpZCI6ImM3ZTA0NDY1NjQ5ZmZhNjA2..."
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email pengguna
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           description: Password pengguna
 *           example: "password123"
 *
 *     GambarUserItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik gambar user
 *           example: 1
 *         users_id:
 *           type: integer
 *           description: ID user yang terkait
 *           example: 1
 *         gambar:
 *           type: string
 *           description: URL atau path gambar profil user
 *           example: "https://lh3.googleusercontent.com/a/profile-image.jpg"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Waktu pembuatan record
 *           example: "2025-04-07T12:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Waktu terakhir update record
 *           example: "2025-04-07T12:00:00Z"
 *
 *     UserItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik user
 *           example: 1
 *         name:
 *           type: string
 *           description: Nama lengkap user
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Alamat email user
 *           example: "john.doe@example.com"
 *         id_google:
 *           type: string
 *           description: ID Google jika user login menggunakan Google
 *           example: "112626558951840573287"
 *         email_verified_at:
 *           type: string
 *           format: date-time
 *           description: Waktu verifikasi email
 *           example: "2025-04-07T12:00:00Z"
 *         remember_token:
 *           type: string
 *           description: Token untuk remember me feature
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Waktu pembuatan user
 *           example: "2025-04-07T12:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Waktu terakhir update user
 *           example: "2025-04-07T12:00:00Z"
 *         last_login:
 *           type: string
 *           format: date-time
 *           description: Waktu terakhir login
 *           example: "2025-04-08T04:32:41Z"
 *         gambar:
 *           type: array
 *           description: Daftar gambar profil user
 *           items:
 *             $ref: '#/components/schemas/GambarUserItem'
 *
 *     AuthSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login berhasil"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/UserItem'
 *             token:
 *               type: string
 *               description: JWT token untuk autentikasi
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     UserInfoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/UserItem'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Terjadi kesalahan pada server"
 *         error:
 *           type: string
 *           example: "Internal server error"
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token yang didapatkan setelah login
 */

/**
 * @openapi
 * tags:
 *   name: login google
 *   description: API untuk autentikasi pengguna (login, register, dll)
 */

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     summary: Login dengan Google
 *     description: Endpoint untuk autentikasi pengguna menggunakan Google ID Token
 *     tags: [login google]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequest'
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         description: Bad request (token tidak valid atau tidak ditemukan)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/google', googleLogin);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Mendapatkan informasi user yang sedang login
 *     description: Endpoint untuk mendapatkan data pengguna yang saat ini terotentikasi
 *     tags: [login google]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Data user berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfoResponse'
 *       401:
 *         description: Tidak terotentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authMiddleware, getUserInfo);

export default router;