// routes/bookingKlinikRoutes.js
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkoutBookingKlinik } from '../controllers/booking_klinik/checkoutKlinikController.js';
import { getDetailPesanan } from '../controllers/booking_klinik/pesananKlinikController.js';
import { 
  createPembayaran, 
  uploadBuktiTransferHandler, 
  getPembayaranDetail,
  adminUpdateStatusPembayaran 
} from '../controllers/booking_klinik/pembayaranKlinikController.js';
import { uploadBuktiTransfer } from '../utils/uploadBuktiTransferUtils.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CheckoutBookingRequest:
 *       type: object
 *       required:
 *         - tipe_booking
 *         - klinik_id
 *         - tanggal_booking
 *         - waktu_booking
 *         - hewan_keluhan
 *       properties:
 *         tipe_booking:
 *           type: string
 *           enum: ['booking_antar_jemput', 'booking_ke_klinik']
 *           description: Tipe booking yang dipilih
 *         klinik_id:
 *           type: integer
 *           description: ID klinik yang dipilih
 *         tanggal_booking:
 *           type: string
 *           format: date
 *           description: Tanggal booking
 *         waktu_booking:
 *           type: string
 *           description: Waktu booking
 *         alamat_user_id:
 *           type: integer
 *           description: ID alamat untuk booking antar jemput
 *         layanan_klinik_id:
 *           type: integer
 *           description: ID layanan klinik
 *         hewan_keluhan:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               hewan_peliharaan_id:
 *                 type: integer
 *                 description: ID hewan peliharaan
 *               keluhan:
 *                 type: string
 *                 description: Keluhan hewan
 *     
 *     CheckoutBookingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             checkout_id:
 *               type: integer
 *             invoice:
 *               type: string
 *             tanggal_checkout:
 *               type: string
 *               format: date-time
 *             informasi_layanan:
 *               type: object
 *             informasi_hewan:
 *               type: array
 *             biaya_booking:
 *               type: number
 *     
 *     PembayaranRequest:
 *       type: object
 *       required:
 *         - checkout_id
 *         - metode_pembayaran
 *       properties:
 *         checkout_id:
 *           type: integer
 *           description: ID checkout yang akan dibayar
 *         metode_pembayaran:
 *           type: string
 *           enum: ['whatsapp', 'transfer']
 *           description: Metode pembayaran yang dipilih
 *     
 *     PembayaranResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             checkout_id:
 *               type: integer
 *             metode_pembayaran:
 *               type: string
 *             total_biaya:
 *               type: number
 *             status:
 *               type: string
 *             koin_didapat:
 *               type: number
 *             no_rekening_klinik:
 *               type: string
 *             invoice:
 *               type: string
 *             expired_at:
 *               type: string
 *               format: date-time
 */

/**
 * @openapi
 * tags:
 *   name: Booking Klinik
 *   description: API untuk manajemen booking klinik
 */

/**
 * @openapi
 * /api/booking-klinik/checkout:
 *   post:
 *     summary: Checkout booking klinik
 *     description: Endpoint untuk melakukan checkout booking klinik dengan detail hewan dan keluhan
 *     tags: [Booking Klinik]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutBookingRequest'
 *     responses:
 *       201:
 *         description: Checkout berhasil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutBookingResponse'
 *       400:
 *         description: Data booking tidak lengkap
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
 *       500:
 *         description: Terjadi kesalahan pada server
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
 */
router.post('/checkout', authMiddleware, checkoutBookingKlinik);

/**
 * @openapi
 * /api/booking-klinik/pesanan/{id}:
 *   get:
 *     summary: Dapatkan detail pesanan
 *     description: Endpoint untuk mendapatkan detail pesanan berdasarkan ID checkout
 *     tags: [Booking Klinik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID checkout
 *     responses:
 *       200:
 *         description: Detail pesanan berhasil didapatkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Pesanan tidak ditemukan
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
 *       500:
 *         description: Terjadi kesalahan pada server
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
 */
router.get('/pesanan/:id', authMiddleware, getDetailPesanan);

/**
 * @openapi
 * /api/booking-klinik/pembayaran:
 *   post:
 *     summary: Buat pembayaran
 *     description: Endpoint untuk membuat pembayaran untuk booking klinik
 *     tags: [Booking Klinik]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PembayaranRequest'
 *     responses:
 *       201:
 *         description: Pembayaran berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PembayaranResponse'
 *       400:
 *         description: Data pembayaran tidak valid
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
 *       500:
 *         description: Terjadi kesalahan pada server
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
 */
router.post('/pembayaran', authMiddleware, createPembayaran);

/**
 * @openapi
 * /api/booking-klinik/pembayaran/{id}:
 *   get:
 *     summary: Dapatkan detail pembayaran
 *     description: Endpoint untuk mendapatkan detail pembayaran berdasarkan ID pembayaran
 *     tags: [Booking Klinik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pembayaran
 *     responses:
 *       200:
 *         description: Detail pembayaran berhasil didapatkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Pembayaran tidak ditemukan
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
 *       500:
 *         description: Terjadi kesalahan pada server
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
 */
router.get('/pembayaran/:id', authMiddleware, getPembayaranDetail);

/**
 * @openapi
 * /api/booking-klinik/pembayaran/{id}/bukti-transfer:
 *   post:
 *     summary: Upload bukti transfer
 *     description: Endpoint untuk mengupload bukti transfer pembayaran
 *     tags: [Booking Klinik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pembayaran
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bukti_transfer:
 *                 type: string
 *                 format: binary
 *                 description: File bukti transfer (JPEG, JPG, PNG)
 *     responses:
 *       200:
 *         description: Bukti transfer berhasil diupload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     bukti_pembayaran:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Bukti transfer tidak valid
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
 *       500:
 *         description: Terjadi kesalahan pada server
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
 */
router.post('/pembayaran/:id/bukti-transfer', authMiddleware, uploadBuktiTransfer.single('bukti_transfer'), uploadBuktiTransferHandler);

/**
 * @openapi
 * /api/booking-klinik/admin/pembayaran/{id}/status:
 *   put:
 *     summary: Update status pembayaran
 *     description: Endpoint untuk mengupdate status pembayaran
 *     tags: [Booking Klinik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pembayaran
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               status_history_slug:
 *                 type: int
 *     responses:
 *       200:
 *         description: Status pembayaran berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Data update tidak valid
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
 *       500:
 *         description: Terjadi kesalahan pada server
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
 */
router.put('/admin/pembayaran/:id/status', authMiddleware, adminUpdateStatusPembayaran);

export default router;