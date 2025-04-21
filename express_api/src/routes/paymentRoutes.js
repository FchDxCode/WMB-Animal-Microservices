import express from 'express';
import { getAllPayments, getPaymentById, getPaymentBySlug } from '../controllers/paymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PaymentItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik metode pembayaran
 *           example: 1
 *         nama_metode:
 *           type: string
 *           description: Nama metode pembayaran
 *           example: "Transfer Bank BCA"
 *         slug:
 *           type: string
 *           description: Slug dari nama metode pembayaran
 *           example: "transfer-bank-bca"
 *         gambar_payment:
 *           type: string
 *           description: Nama file gambar metode pembayaran
 *           example: "payment-123456789.png"
 *         gambar_payment_url:
 *           type: string
 *           description: URL lengkap gambar metode pembayaran
 *           example: "http://localhost:3000/images/payment-images/payment-123456789.png"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Tanggal dan waktu metode pembayaran dibuat
 *           example: "2023-10-15T08:30:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Tanggal dan waktu metode pembayaran terakhir diperbarui
 *           example: "2023-10-15T08:30:00.000Z"
 *
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mengambil data metode pembayaran"
 *         data:
 *           oneOf:
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentItem'
 *             - $ref: '#/components/schemas/PaymentItem'
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
 */

/**
 * @openapi
 * tags:
 *   name: Payment
 *   description: API untuk mengelola metode pembayaran
 */

/**
 * @openapi
 * /api/payments:
 *   get:
 *     summary: Mendapatkan semua data metode pembayaran
 *     description: Endpoint untuk mengambil daftar semua metode pembayaran yang tersedia
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Data metode pembayaran berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getAllPayments);

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     summary: Mendapatkan metode pembayaran berdasarkan ID
 *     description: Endpoint untuk mengambil data metode pembayaran berdasarkan ID
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID metode pembayaran
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Data metode pembayaran berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       404:
 *         description: Metode pembayaran tidak ditemukan
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
router.get('/:id', getPaymentById);

/**
 * @openapi
 * /api/payments/slug/{slug}:
 *   get:
 *     summary: Mendapatkan metode pembayaran berdasarkan slug
 *     description: Endpoint untuk mengambil data metode pembayaran berdasarkan slug
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Slug metode pembayaran
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data metode pembayaran berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       404:
 *         description: Metode pembayaran tidak ditemukan
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
router.get('/slug/:slug', getPaymentBySlug);

export default router;