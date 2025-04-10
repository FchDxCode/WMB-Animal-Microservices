// routes/checkoutProdukRoutes.js
import express from 'express';
import { getCheckoutData, processCheckout } from '../controllers/checkout_produk/checkoutProdukController.js';
import { getPaymentDetail, uploadPaymentProof, updatePaymentStatus } from '../controllers/checkout_produk/pembayaranProdukController.js';
import { getUserOrders, getOrderDetail, getAllOrders } from '../controllers/checkout_produk/pesananProdukController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadBuktiTransfer } from '../utils/uploadBuktiTransferUtils.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID keranjang produk
 *           example: 1
 *         produk_id:
 *           type: integer
 *           description: ID produk
 *           example: 5
 *         jumlah_dibeli:
 *           type: integer
 *           description: Jumlah produk yang dibeli
 *           example: 2
 *         subtotal_harga:
 *           type: number
 *           description: Subtotal harga produk
 *           example: 150000
 *         produk:
 *           type: object
 *           properties:
 *             nama_produk:
 *               type: string
 *               description: Nama produk
 *               example: "Dog Food Premium"
 *             harga_produk:
 *               type: number
 *               description: Harga produk
 *               example: 75000
 *             diskon_produk:
 *               type: number
 *               description: Diskon produk
 *               example: 0
 *             berat_produk:
 *               type: integer
 *               description: Berat produk dalam gram
 *               example: 1000
 *
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID alamat user
 *           example: 1
 *         nama_lengkap:
 *           type: string
 *           description: Nama penerima
 *           example: "John Doe"
 *         no_tlpn:
 *           type: string
 *           description: Nomor telepon penerima
 *           example: "08123456789"
 *         detail_alamat:
 *           type: string
 *           description: Detail alamat pengiriman
 *           example: "Jl. Sudirman No. 123"
 *         kode_pos:
 *           type: string
 *           description: Kode pos
 *           example: "12345"
 *
 *     Ekspedisi:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID ekspedisi
 *           example: 1
 *         nama_ekspedisi:
 *           type: string
 *           description: Nama ekspedisi
 *           example: "JNE"
 *         ongkir:
 *           type: number
 *           description: Biaya ongkos kirim
 *           example: 15000
 *
 *     CheckoutRequest:
 *       type: object
 *       required:
 *         - alamatId
 *         - ekspedisiId
 *         - metodePembayaranId
 *       properties:
 *         alamatId:
 *           type: integer
 *           description: ID alamat yang dipilih
 *           example: 1
 *         ekspedisiId:
 *           type: integer
 *           description: ID ekspedisi yang dipilih
 *           example: 2
 *         metodePembayaranId:
 *           type: integer
 *           description: ID metode pembayaran
 *           example: 1
 *         gunakaCoin:
 *           type: boolean
 *           description: Flag untuk menggunakan coin
 *           example: true
 *         coinDigunakan:
 *           type: integer
 *           description: Jumlah coin yang digunakan
 *           example: 5000
 *
 *     CheckoutResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Checkout berhasil"
 *         data:
 *           type: object
 *           properties:
 *             checkout_id:
 *               type: integer
 *               example: 123
 *             pembayaran_id:
 *               type: integer
 *               example: 456
 *             invoice:
 *               type: string
 *               example: "INV-20230425-1234"
 *             total_pesanan:
 *               type: number
 *               example: 175000
 *
 *     PaymentDetail:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             pembayaran:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 invoice:
 *                   type: string
 *                   example: "INV-20230425-1234"
 *                 status:
 *                   type: string
 *                   example: "tertunda"
 *                 bukti_pembayaran:
 *                   type: string
 *                   example: "https://example.com/bukti-transfer/payment-123.jpg"
 *                 checkout:
 *                   type: object
 *                   properties:
 *                     total_pesanan:
 *                       type: number
 *                       example: 175000
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           produk:
 *                             type: object
 *                             properties:
 *                               nama_produk:
 *                                 type: string
 *                                 example: "Dog Food Premium"
 *             isExpired:
 *               type: boolean
 *               example: false
 *
 *     UploadPaymentProofResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Bukti pembayaran berhasil diunggah"
 *         data:
 *           type: object
 *           properties:
 *             pembayaran_id:
 *               type: integer
 *               example: 456
 *             bukti_pembayaran:
 *               type: string
 *               example: "https://example.com/bukti-transfer/payment-123.jpg"
 *
 *     UpdatePaymentStatusRequest:
 *       type: object
 *       required:
 *         - status
 *         - kategori_status_history_id
 *       properties:
 *         status:
 *           type: string
 *           enum: ["selesai", "dibatalkan"]
 *           description: Status pembayaran baru
 *           example: "selesai"
 *         kategori_status_history_id:
 *           type: integer
 *           description: ID kategori status history
 *           example: 2
 *
 *     UpdatePaymentStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Status pembayaran berhasil diubah menjadi selesai"
 *         data:
 *           type: object
 *           properties:
 *             pembayaran_id:
 *               type: integer
 *               example: 456
 *             status:
 *               type: string
 *               example: "selesai"
 *
 *     OrderDetail:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             order:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 123
 *                 invoice:
 *                   type: string
 *                   example: "INV-20230425-1234"
 *                 total_pesanan:
 *                   type: number
 *                   example: 175000
 *                 subtotal_produk:
 *                   type: number
 *                   example: 150000
 *                 koin_digunakan:
 *                   type: number
 *                   example: 5000
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-25T15:30:00Z"
 *                 pembayaran:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "selesai"
 *                     bukti_pembayaran:
 *                       type: string
 *                       example: "https://example.com/bukti-transfer/payment-123.jpg"
 *                     koin_didapat:
 *                       type: integer
 *                       example: 1500
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       jumlah:
 *                         type: integer
 *                         example: 2
 *                       harga_satuan:
 *                         type: number
 *                         example: 75000
 *                       subtotal:
 *                         type: number
 *                         example: 150000
 *                       produk:
 *                         type: object
 *                         properties:
 *                           nama_produk:
 *                             type: string
 *                             example: "Dog Food Premium"
 *                 alamat:
 *                   $ref: '#/components/schemas/Address'
 *                 ekspedisi:
 *                   $ref: '#/components/schemas/Ekspedisi'
 *
 *     UserOrdersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             orders:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 123
 *                   invoice:
 *                     type: string
 *                     example: "INV-20230425-1234"
 *                   total_pesanan:
 *                     type: number
 *                     example: 175000
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-04-25T15:30:00Z"
 *                   pembayaran:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "selesai"
 *             pagination:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 15
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 *
 *     AllOrdersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             orders:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 123
 *                   invoice:
 *                     type: string
 *                     example: "INV-20230425-1234"
 *                   total_pesanan:
 *                     type: number
 *                     example: 175000
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-04-25T15:30:00Z"
 *                   pembayaran:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "selesai"
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 42
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       email:
 *                         type: string
 *                         example: "john.doe@example.com"
 *             pagination:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Terjadi kesalahan saat memproses checkout"
 *         error:
 *           type: string
 *           example: "Keranjang belanja kosong"
 */

/**
 * @openapi
 * tags:
 *   name: Checkout Produk
 *   description: API untuk proses checkout dan pembayaran produk
 * 
 */

/**
 * @openapi
 * /api/checkout:
 *   get:
 *     summary: Mendapatkan data untuk halaman checkout
 *     description: Endpoint untuk mengambil data keranjang, alamat, ekspedisi, dan informasi lain untuk halaman checkout
 *     tags: [Checkout Produk]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data checkout berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     cartItems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CartItem'
 *                     addresses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Address'
 *                     ekspedisi:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ekspedisi'
 *                     subtotal:
 *                       type: number
 *                       example: 150000
 *                     userCoin:
 *                       type: number
 *                       example: 10000
 *                     maxCoinUsable:
 *                       type: number
 *                       example: 5000
 *                     biayaAdmin:
 *                       type: number
 *                       example: 2000
 *       400:
 *         description: Keranjang belanja kosong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Tidak terautentikasi
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
router.get('/', authMiddleware, getCheckoutData);

/**
 * @openapi
 * /api/checkout:
 *   post:
 *     summary: Proses checkout produk
 *     description: Endpoint untuk memproses checkout produk dari keranjang
 *     tags: [Checkout Produk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *     responses:
 *       201:
 *         description: Checkout berhasil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutResponse'
 *       400:
 *         description: Data tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Tidak terautentikasi
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
router.post('/', authMiddleware, processCheckout);

/**
 * @openapi
 * /api/checkout/pembayaran/{invoiceNumber}:
 *   get:
 *     summary: Mendapatkan detail pembayaran
 *     description: Endpoint untuk mengambil detail pembayaran berdasarkan nomor invoice
 *     tags: [Checkout Produk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Nomor invoice pembayaran
 *     responses:
 *       200:
 *         description: Detail pembayaran berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentDetail'
 *       400:
 *         description: Nomor invoice tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Data pembayaran tidak ditemukan
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
router.get('/pembayaran/:invoiceNumber', authMiddleware, getPaymentDetail);

/**
 * @openapi
 * /api/checkout/pembayaran/{id}/upload:
 *   post:
 *     summary: Upload bukti pembayaran
 *     description: Endpoint untuk mengunggah bukti pembayaran
 *     tags: [Checkout Produk]
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
 *               buktiTransfer:
 *                 type: string
 *                 format: binary
 *                 description: File bukti transfer
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil diunggah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadPaymentProofResponse'
 *       400:
 *         description: Bukti pembayaran tidak diunggah atau pembayaran tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Data pembayaran tidak ditemukan
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
router.post('/pembayaran/:id/upload', authMiddleware, uploadBuktiTransfer.single('buktiTransfer'), uploadPaymentProof);

/**
 * @openapi
 * /api/checkout/pembayaran/{id}/status:
 *   put:
 *     summary: Update status pembayaran
 *     description: Endpoint untuk mengupdate status pembayaran (hanya untuk Admin)
 *     tags: [Checkout Produk]
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
 *             $ref: '#/components/schemas/UpdatePaymentStatusRequest'
 *     responses:
 *       200:
 *         description: Status pembayaran berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdatePaymentStatusResponse'
 *       400:
 *         description: Status tidak valid atau pembayaran tidak dalam status tertunda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Tidak terautentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Tidak memiliki hak akses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Data pembayaran tidak ditemukan
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
router.put('/pembayaran/:id/status', authMiddleware, updatePaymentStatus);

/**
 * @openapi
 * /api/checkout/pesanan:
 *   get:
 *     summary: Mendapatkan daftar pesanan pengguna
 *     description: Endpoint untuk mengambil daftar pesanan pengguna yang sedang login
 *     tags: [Checkout Produk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [tertunda, selesai, dibatalkan]
 *         description: Filter berdasarkan status pembayaran
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman untuk pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah item per halaman
 *     responses:
 *       200:
 *         description: Daftar pesanan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserOrdersResponse'
 *       401:
 *         description: Tidak terautentikasi
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
router.get('/pesanan', authMiddleware, getUserOrders);

/**
 * @openapi
 * /api/checkout/pesanan/{id}:
 *   get:
 *     summary: Mendapatkan detail pesanan
 *     description: Endpoint untuk mengambil detail pesanan pengguna berdasarkan ID
 *     tags: [Checkout Produk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pesanan
 *     responses:
 *       200:
 *         description: Detail pesanan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetail'
 *       401:
 *         description: Tidak terautentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.get('/pesanan/:id', authMiddleware, getOrderDetail);

/**
 * @openapi
 * /api/checkout/admin/pesanan:
 *   get:
 *     summary: Mendapatkan daftar semua pesanan (Admin)
 *     description: Endpoint untuk mengambil daftar semua pesanan (hanya untuk Admin)
 *     tags: [Checkout Produk   ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [tertunda, selesai, dibatalkan]
 *         description: Filter berdasarkan status pembayaran
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman untuk pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah item per halaman
 *     responses:
 *       200:
 *         description: Daftar semua pesanan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllOrdersResponse'
 *       401:
 *         description: Tidak terautentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Tidak memiliki hak akses
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
router.get('/admin/pesanan', authMiddleware, getAllOrders);

export default router;