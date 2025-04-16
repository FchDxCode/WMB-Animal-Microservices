// src/routes/petHotelRoutes.js
import express from 'express';
import { 
    createCheckout,   
    getPaymentMethods,
    selectPaymentMethod  
} from '../controllers/booking_pethotel/checkoutPetHotelController.js';
import { 
  uploadBuktiPembayaran, 
  verifyPembayaran, 
  getPembayaranDetail,
} from '../controllers/booking_pethotel/pembayaranPetHotelController.js';
import { getPesanan, getPesananById } from '../controllers/booking_pethotel/pesananPetHotelController.js';
import { uploadBuktiTransfer } from '../utils/uploadBuktiTransferUtils.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @openapi
 * components:
 *   schemas:
 *     CheckoutItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik checkout
 *           example: 1
 *         klinik_id:
 *           type: integer
 *           description: ID klinik terkait booking
 *           example: 123
 *         tipe_booking_pet_hotel:
 *           type: string
 *           description: Jenis booking (misal "jemput" atau "datang_ke_klinik")
 *           example: "jemput"
 *         tanggal_check_in:
 *           type: string
 *           format: date
 *           description: Tanggal check-in booking
 *           example: "2025-05-01"
 *         tanggal_check_out:
 *           type: string
 *           format: date
 *           description: Tanggal check-out booking
 *           example: "2025-05-03"
 *         invoice:
 *           type: string
 *           description: Nomor invoice booking
 *           example: "INV-20250501-1234"
 *         total_harga:
 *           type: number
 *           format: float
 *           description: Harga total yang dihitung
 *           example: 161000
 *
 *     CheckoutResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Checkout berhasil, silahkan lakukan pembayaran"
 *         data:
 *           $ref: '#/components/schemas/CheckoutItem'
 *
 *     PembayaranItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik pembayaran
 *           example: 1
 *         checkout_pet_hotel_id:
 *           type: integer
 *           description: ID checkout yang terkait
 *           example: 1
 *         status:
 *           type: string
 *           description: Status pembayaran (misal "diproses", "selesai")
 *           example: "diproses"
 *         koin_didapat:
 *           type: number
 *           description: Jumlah coin yang didapatkan (saat status "selesai")
 *           example: 16100
 *
 *     PembayaranResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Bukti pembayaran berhasil diupload"
 *         data:
 *           $ref: '#/components/schemas/PembayaranItem'
 *
 *     PesananItem:
 *       type: object
 *       properties:
 *         status_pesanan:
 *           type: string
 *           description: Status pesanan
 *           example: "selesai"
 *         no_invoice:
 *           type: string
 *           description: Nomor invoice booking
 *           example: "INV-20250501-1234"
 *         tanggal_pembelian:
 *           type: string
 *           format: date-time
 *           description: Tanggal pembelian
 *           example: "2025-05-01T10:00:00.000Z"
 *         informasi_booking:
 *           type: object
 *           properties:
 *             layanan:
 *               type: string
 *               example: "Pet Hotel"
 *             alamat_user:
 *               type: object
 *             klinik:
 *               type: object
 *             tanggal_check_in:
 *               type: string
 *               format: date
 *             tanggal_check_out:
 *               type: string
 *               format: date
 *             waktu_kedatangan:
 *               type: string
 *             waktu_penjemputan:
 *               type: string
 *         informasi_hewan:
 *           type: array
 *           items:
 *             type: object
 *         metode_pembayaran:
 *           type: object
 *         rincian_pesanan:
 *           type: object
 *           properties:
 *             biaya_admin:
 *               type: number
 *             harga_pet_hotel:
 *               type: number
 *         total_pembayaran:
 *           type: number
 *         coin_didapat:
 *           type: number
 *
 *     PesananResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mengambil data pesanan"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PesananItem'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
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
 *   name: BookingPetHotel
 *   description: API untuk manajemen booking, pembayaran, dan pesanan layanan Pet Hotel
 */

/**
 * @openapi
 * /api/pethotel/checkout:
 *   post:
 *     summary: Membuat checkout booking Pet Hotel
 *     description: Endpoint untuk membuat data booking Pet Hotel, menghitung total pembayaran, dan menghasilkan invoice.
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               klinik_id:
 *                 type: number
 *                 example: 123
 *               tipe_booking_pet_hotel:
 *                 type: string
 *                 enum: [jemput, datang_ke_klinik]
 *                 example: "jemput"
 *               tanggal_check_in:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-01"
 *               tanggal_check_out:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-03"
 *               waktu_kedatangan:
 *                 type: string
 *                 format: time
 *                 example: "09:00"
 *               waktu_penjemputan:
 *                 type: string
 *                 format: time
 *                 example: "17:00"
 *               detail_booking:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tipe_hotel_id:
 *                       type: number
 *                       example: 1
 *                     hewan_peliharaan_id:
 *                       type: number
 *                       example: 2
 *                     permintaan_khusus:
 *                       type: string
 *                       example: "Tolong berikan makanan 3x sehari"
 *                     kondisi_hewan:
 *                       type: string
 *                       example: "Sehat dan aktif"
 *     responses:
 *       200:
 *         description: Checkout berhasil
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/checkout', createCheckout);

/**
 * @openapi
 * /api/pethotel/payment-methods:
 *   get:
 *     summary: Get available payment methods
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nama_metode:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       gambar_payment:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/payment-methods', getPaymentMethods);

/**
 * @openapi
 * /api/pethotel/select-payment/{checkoutId}:
 *   post:
 *     summary: Select payment method for checkout
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checkoutId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_id
 *             properties:
 *               payment_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Payment method successfully selected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkout_id:
 *                       type: integer
 *                     selected_payment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama_metode:
 *                           type: string
 *                         slug:
 *                           type: string
 *                         gambar_payment:
 *                           type: string
 *       400:
 *         description: Invalid request or payment already selected
 *       404:
 *         description: Checkout or payment method not found
 *       500:
 *         description: Server error
 */
router.post('/select-payment/:checkoutId', selectPaymentMethod);

/**
 * @openapi
 * /api/pethotel/pembayaran/upload/{id}:
 *   post:
 *     summary: Upload bukti pembayaran Pet Hotel
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Upload berhasil
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post('/pembayaran/upload/:id', uploadBuktiTransfer.single('bukti_transfer'), uploadBuktiPembayaran);

/**
 * @openapi
 * /api/pethotel/pembayaran/verifikasi/{id}:
 *   patch:
 *     summary: Verifikasi pembayaran Pet Hotel
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - kategori_status_history_id
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [belum-bayar, diproses, selesai, tertunda, dibatalkan]
 *               kategori_status_history_id:
 *                 type: integer
 *                 description: ID dari status history
 *     responses:
 *       200:
 *         description: Verifikasi berhasil
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
 *                   example: "Status pembayaran berhasil diupdate menjadi selesai"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     checkout_id:
 *                       type: integer
 *                       example: 123
 *                     invoice:
 *                       type: string
 *                       example: "INV/2023/001"
 *                     status:
 *                       type: string
 *                       example: "selesai"
 *                     payment_method:
 *                       type: object
 *                       properties:
 *                         nama:
 *                           type: string
 *                           example: "Bank Transfer"
 *                         slug:
 *                           type: string
 *                           example: "bank-transfer"
 *                     status_history:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nama:
 *                           type: string
 *                           example: "Pembayaran Selesai"
 *                         slug:
 *                           type: string
 *                           example: "pembayaran-selesai"
 *                     total_harga:
 *                       type: number
 *                       example: 500000
 *                     coin_info:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         jumlah_coin:
 *                           type: integer
 *                           example: 50
 *                         keterangan:
 *                           type: string
 *                           example: "Coin dari transaksi Pet Hotel INV/2023/001"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Input tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Data tidak ditemukan
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
router.patch('/pembayaran/verifikasi/:id', verifyPembayaran);

/**
 * @openapi
 * /api/pethotel/pembayaran/{id}:
 *   get:
 *     summary: Get detail pembayaran Pet Hotel
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pembayaran
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
 *                   example: "Berhasil mendapatkan detail pembayaran"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     checkout_id:
 *                       type: integer
 *                       example: 123
 *                     invoice:
 *                       type: string
 *                       example: "INV/2023/001"
 *                     status:
 *                       type: string
 *                       example: "selesai"
 *                     payment_method:
 *                       type: object
 *                       properties:
 *                         nama:
 *                           type: string
 *                           example: "Bank Transfer"
 *                         slug:
 *                           type: string
 *                           example: "bank-transfer"
 *                     status_history:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nama:
 *                           type: string
 *                           example: "Pembayaran Selesai"
 *                         slug:
 *                           type: string
 *                           example: "pembayaran-selesai"
 *                     total_harga:
 *                       type: number
 *                       example: 500000
 *                     coin_info:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         jumlah_coin:
 *                           type: integer
 *                           example: 50
 *                         keterangan:
 *                           type: string
 *                           example: "Coin dari transaksi Pet Hotel INV/2023/001"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Data tidak ditemukan
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
router.get('/pembayaran/:id', getPembayaranDetail);

/**
 * @openapi
 * /api/pethotel/pesanan:
 *   get:
 *     summary: Get daftar pesanan Pet Hotel
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pesanan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get('/pesanan', getPesanan);

/**
 * @openapi
 * /api/pethotel/pesanan/{id}:
 *   get:
 *     summary: Get detail pesanan Pet Hotel berdasarkan ID atau Invoice
 *     description: Mendapatkan detail lengkap pesanan Pet Hotel berdasarkan ID atau nomor invoice
 *     tags: [BookingPetHotel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *         description: ID pesanan (angka) atau nomor invoice (string)
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pesanan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Berhasil mengambil detail pesanan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     invoice:
 *                       type: string
 *                     status_pesanan:
 *                       type: string
 *                     tanggal_pemesanan:
 *                       type: string
 *                       format: date-time
 *                     total_harga:
 *                       type: number
 *                     informasi_booking:
 *                       type: object
 *                     informasi_hewan:
 *                       type: array
 *                       items:
 *                         type: object
 *                     metode_pembayaran:
 *                       type: object
 *                     informasi_pembayaran:
 *                       type: object
 *                     rincian_pesanan:
 *                       type: object
 *                     coin_didapat:
 *                       type: integer
 *       404:
 *         description: Pesanan tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get('/pesanan/:id', getPesananById);

export default router;
