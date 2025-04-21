import express from 'express';
import { createCheckoutHouseCall } from '../controllers/booking_housecall/checkoutHouseCallController.js';
import { getDetailPesananHouseCall, choosePaymentMethod } from '../controllers/booking_housecall/pesananHouseCallController.js';
import { getInformasiPembayaran, uploadBuktiPembayaran, updateStatusPembayaran } from '../controllers/booking_housecall/pembayaranHouseCallController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadBuktiTransfer } from '../utils/uploadBuktiTransferUtils.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CheckoutHouseCallRequest:
 *       type: object
 *       required:
 *         - klinik_id
 *         - layanan_klinik_id
 *         - alamat_user_id
 *         - tanggal_booking
 *         - waktu_booking
 *         - pets_data
 *       properties:
 *         klinik_id:
 *           type: integer
 *           description: ID klinik yang dipilih
 *           example: 1
 *         layanan_klinik_id:
 *           type: integer
 *           description: ID layanan klinik yang dipilih
 *           example: 2
 *         alamat_user_id:
 *           type: integer
 *           description: ID alamat user untuk kunjungan
 *           example: 3
 *         tanggal_booking:
 *           type: string
 *           format: date
 *           description: Tanggal booking (YYYY-MM-DD)
 *           example: "2025-04-25"
 *         waktu_booking:
 *           type: string
 *           description: Waktu booking (HH:MM)
 *           example: "14:30"
 *         pets_data:
 *           type: array
 *           description: Data hewan peliharaan untuk diperiksa
 *           items:
 *             type: object
 *             properties:
 *               hewan_peliharaan_id:
 *                 type: integer
 *                 description: ID hewan peliharaan
 *                 example: 5
 *               keluhan_id:
 *                 type: integer
 *                 description: ID keluhan untuk hewan
 *                 example: 2
 *
 *     PaymentMethodRequest:
 *       type: object
 *       required:
 *         - bookingId
 *         - paymentId
 *       properties:
 *         bookingId:
 *           type: integer
 *           description: ID dari booking house call
 *           example: 123
 *         paymentId:
 *           type: integer
 *           description: ID metode pembayaran yang dipilih
 *           example: 2
 *
 *     UploadBuktiRequest:
 *       type: object
 *       required:
 *         - bukti_pembayaran
 *       properties:
 *         bukti_pembayaran:
 *           type: file
 *           format: binary
 *           description: File bukti pembayaran/transfer
 *
 *     UpdateStatusRequest:
 *       type: object
 *       required:
 *         - status
 *         - kategori_status_history_id
 *       properties:
 *         status:
 *           type: string
 *           description: Status pembayaran baru
 *           example: "selesai"
 *           enum: [belum-bayar, diproses, selesai, tertunda, batal]
 *         kategori_status_history_id:
 *           type: integer
 *           description: ID kategori status untuk history
 *           example: 3
 *         keterangan:
 *           type: string
 *           description: Keterangan/catatan untuk perubahan status
 *           example: "Pembayaran sudah diverifikasi dan layanan house call sudah selesai"
 *
 *     CheckoutResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Checkout house call berhasil dibuat"
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 123
 *             invoice:
 *               type: string
 *               example: "HC20250418001"
 *             total_pesanan:
 *               type: number
 *               example: 350000
 *             tanggal_booking:
 *               type: string
 *               example: "2025-04-25"
 *             waktu_booking:
 *               type: string
 *               example: "14:30"
 *
 *     DetailPesananResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Detail pesanan berhasil diambil"
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 123
 *             invoice:
 *               type: string
 *               example: "HC20250418001"
 *             status_pesanan:
 *               type: string
 *               example: "belum-bayar"
 *             tanggal_pembelian:
 *               type: string
 *               example: "2025-04-18T10:30:00Z"
 *             nama_layanan:
 *               type: string
 *               example: "House Call"
 *             alamat_user:
 *               type: string
 *               example: "Jl. Kenanga No. 5, Jakarta"
 *             klinik:
 *               type: string
 *               example: "Klinik Hewan Sejahtera"
 *             tanggal_booking:
 *               type: string
 *               example: "2025-04-25"
 *             waktu_booking:
 *               type: string
 *               example: "14:30"
 *             hewan_peliharaan:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nama:
 *                     type: string
 *                     example: "Milo"
 *                   keluhan:
 *                     type: string
 *                     example: "Tidak nafsu makan"
 *                   gambar:
 *                     type: string
 *                     example: "/storage/pet-images/milo.jpg"
 *             rincian_pesanan:
 *               type: object
 *               properties:
 *                 harga_layanan:
 *                   type: number
 *                   example: 300000
 *                 biaya_booking:
 *                   type: number
 *                   example: 50000
 *                 total_pesanan:
 *                   type: number
 *                   example: 350000
 *                 koin_didapat:
 *                   type: number
 *                   example: 35
 *
 *     InformasiPembayaranResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Informasi pembayaran berhasil diambil"
 *         data:
 *           type: object
 *           properties:
 *             invoice:
 *               type: string
 *               example: "HC20250418001"
 *             status_pembayaran:
 *               type: string
 *               example: "belum-bayar"
 *             metode_pembayaran:
 *               type: string
 *               example: "Transfer Bank"
 *             gambar_payment:
 *               type: string
 *               example: "/storage/payment-images/bank-bca.png"
 *             no_rekening_klinik:
 *               type: string
 *               example: "123456789"
 *             expired_at:
 *               type: string
 *               example: "2025-04-19T10:30:00Z"
 *             bukti_pembayaran:
 *               type: string
 *               example: "/storage/bukti-transfer/payment123.jpg"
 *             total_pesanan:
 *               type: number
 *               example: 350000
 *
 *     UploadBuktiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Bukti pembayaran berhasil diupload"
 *         data:
 *           type: object
 *           properties:
 *             bukti_pembayaran:
 *               type: string
 *               example: "/storage/bukti-transfer/payment123.jpg"
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
 *   name: BookingHouseCall
 *   description: API untuk mengelola booking layanan house call
 */

/**
 * @openapi
 * /api/housecall/checkout:
 *   post:
 *     summary: Membuat checkout house call baru
 *     description: Endpoint untuk membuat checkout house call dengan data hewan peliharaan
 *     tags: [BookingHouseCall]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutHouseCallRequest'
 *     responses:
 *       201:
 *         description: Checkout house call berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutResponse'
 *       400:
 *         description: Input tidak valid atau tidak lengkap
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Layanan klinik tidak ditemukan
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
router.post('/checkout', authMiddleware, createCheckoutHouseCall);

/**
 * @openapi
 * /api/housecall/pesanan/{bookingId}:
 *   get:
 *     summary: Mendapatkan detail pesanan house call
 *     description: Endpoint untuk mengambil detail lengkap pesanan house call beserta relasi
 *     tags: [BookingHouseCall]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dari booking house call
 *     responses:
 *       200:
 *         description: Detail pesanan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailPesananResponse'
 *       404:
 *         description: Pesanan tidak ditemukan
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
router.get('/pesanan/:bookingId', authMiddleware, getDetailPesananHouseCall);

/**
 * @openapi
 * /api/housecall/pesanan/payment-method:
 *   post:
 *     summary: Memilih metode pembayaran
 *     description: Endpoint untuk memilih metode pembayaran untuk booking house call
 *     tags: [BookingHouseCall]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethodRequest'
 *     responses:
 *       200:
 *         description: Metode pembayaran berhasil dipilih
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
 *                   example: "Metode pembayaran berhasil dipilih"
 *       404:
 *         description: Booking tidak ditemukan
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
router.post('/pesanan/payment-method', authMiddleware, choosePaymentMethod);

/**
 * @openapi
 * /api/housecall/pembayaran/{bookingId}:
 *   get:
 *     summary: Mendapatkan informasi pembayaran
 *     description: Endpoint untuk mengambil informasi pembayaran house call
 *     tags: [BookingHouseCall]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dari booking house call
 *     responses:
 *       200:
 *         description: Informasi pembayaran berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InformasiPembayaranResponse'
 *       404:
 *         description: Pembayaran tidak ditemukan
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
router.get('/pembayaran/:bookingId', authMiddleware, getInformasiPembayaran);

/**
 * @openapi
 * /api/housecall/pembayaran/upload/{bookingId}:
 *   post:
 *     summary: Upload bukti pembayaran
 *     description: Endpoint untuk mengupload bukti pembayaran/transfer
 *     tags: [BookingHouseCall]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dari booking house call
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UploadBuktiRequest'
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil diupload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadBuktiResponse'
 *       400:
 *         description: File tidak ditemukan atau tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pembayaran tidak ditemukan
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
router.post('/pembayaran/upload/:bookingId', authMiddleware, uploadBuktiPembayaran);

/**
 * @openapi
 * /api/housecall/pembayaran/status/{bookingId}:
 *   put:
 *     summary: Update status pembayaran (Admin)
 *     description: Endpoint untuk admin mengupdate status pembayaran house call
 *     tags: [BookingHouseCall]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dari booking house call
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/UpdateStatusRequest'
 *               - type: object
 *                 properties:
 *                   bukti_transfer:
 *                     type: file
 *                     format: binary
 *                     description: File bukti transfer (opsional)
 *     responses:
 *       200:
 *         description: Status pembayaran berhasil diubah
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
 *                   example: "Status pembayaran berhasil diubah menjadi selesai"
 *       404:
 *         description: Pembayaran tidak ditemukan
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
router.put('/pembayaran/status/:bookingId', authMiddleware, updateStatusPembayaran);

export default router;