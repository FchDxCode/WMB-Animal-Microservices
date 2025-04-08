import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  getUserHistory, 
  getHistoryDetail, 
  getAllHistory, 
  getHistoryByStatus 
} from '../controllers/historyController.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     HistoryListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik history
 *           example: 1
 *         pembayaran_konsultasi_id:
 *           type: integer
 *           nullable: true
 *           description: ID pembayaran konsultasi jika berkaitan
 *           example: 123
 *         pembayaran_klinik_id:
 *           type: integer
 *           nullable: true
 *           description: ID pembayaran klinik jika berkaitan
 *           example: null
 *         pembayaran_produk_id:
 *           type: integer
 *           nullable: true
 *           description: ID pembayaran produk jika berkaitan
 *           example: null
 *         pembayaran_house_call_id:
 *           type: integer
 *           nullable: true
 *           description: ID pembayaran house call jika berkaitan
 *           example: null
 *         user_id:
 *           type: integer
 *           description: ID user yang memiliki history
 *           example: 42
 *         status_history_id:
 *           type: integer
 *           description: ID status dari history
 *           example: 3
 *         statusHistory:
 *           type: object
 *           properties:
 *             nama:
 *               type: string
 *               description: Nama status history
 *               example: "Pembayaran Berhasil"
 *             slug:
 *               type: string
 *               description: Slug status history
 *               example: "pembayaran-berhasil"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Tanggal history dibuat
 *           example: "2025-04-05T14:22:10Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Tanggal history terakhir diperbarui
 *           example: "2025-04-05T14:22:10Z"
 *     
 *     HistoryListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "History retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HistoryListItem'
 *     
 *     HistoryDetailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "History detail retrieved successfully"
 *         data:
 *           $ref: '#/components/schemas/HistoryListItem'
 *     
 *     HistoryPaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "All history retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HistoryListItem'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total jumlah data
 *               example: 50
 *             page:
 *               type: integer
 *               description: Halaman yang sedang aktif
 *               example: 1
 *             totalPages:
 *               type: integer
 *               description: Total jumlah halaman
 *               example: 5
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Failed to retrieve history"
 *         error:
 *           type: string
 *           example: "Internal server error"
 */

/**
 * @openapi
 * tags:
 *   name: History
 *   description: API untuk manajemen history layanan user
 */

// Middleware untuk semua routes
router.use(authMiddleware);

/**
 * @openapi
 * /api/history/user:
 *   get:
 *     summary: Mendapatkan history user yang sedang login
 *     description: Endpoint untuk mengambil semua riwayat layanan milik user yang telah terautentikasi
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar history berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistoryListResponse'
 *       401:
 *         description: User tidak terautentikasi
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
 *                   example: "Invalid or expired token."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/user', getUserHistory);

/**
 * @openapi
 * /api/history/detail/{id}:
 *   get:
 *     summary: Mendapatkan detail history
 *     description: Endpoint untuk mengambil detail spesifik dari sebuah history berdasarkan ID
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID history yang ingin ditampilkan
 *         example: 1
 *     responses:
 *       200:
 *         description: Detail history berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistoryDetailResponse'
 *       401:
 *         description: User tidak terautentikasi
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
 *                   example: "Invalid or expired token."
 *       404:
 *         description: History tidak ditemukan
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
 *                   example: "History not found"
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/detail/:id', getHistoryDetail);

/**
 * @openapi
 * /api/history/all:
 *   get:
 *     summary: Mendapatkan semua history (admin)
 *     description: Endpoint untuk mengambil daftar semua history layanan dari semua user (akses admin)
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman yang diinginkan
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah history yang ditampilkan per halaman
 *     responses:
 *       200:
 *         description: Daftar history berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistoryPaginatedResponse'
 *       401:
 *         description: User tidak terautentikasi
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
 *                   example: "Invalid or expired token."
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/all', getAllHistory);

/**
 * @openapi
 * /api/history/status/{status}:
 *   get:
 *     summary: Mendapatkan history berdasarkan status
 *     description: >
 *       Endpoint untuk mengambil daftar history milik user yang telah terautentikasi
 *       berdasarkan status tertentu (menggunakan slug status)
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug status history yang ingin difilter
 *         example: "pembayaran-berhasil"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman yang diinginkan
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah history yang ditampilkan per halaman
 *     responses:
 *       200:
 *         description: Daftar history berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistoryPaginatedResponse'
 *       401:
 *         description: User tidak terautentikasi
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
 *                   example: "Invalid or expired token."
 *       404:
 *         description: Status tidak ditemukan
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
 *                   example: "Status not found"
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/status/:status', getHistoryByStatus);

export default router;