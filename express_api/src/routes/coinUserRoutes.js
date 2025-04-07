// src/routes/coinUserRoutes.js
import express from 'express';
import { 
  getTotalCoin, 
  getCoinHistory, 
  addCoin, 
  deductCoin 
} from '../controllers/coinUserController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/coin/total:
 *   get:
 *     tags:
 *       - Coin
 *     summary: Mendapatkan total coin pengguna yang sedang login
 *     description: Endpoint ini akan mengembalikan total coin yang dimiliki oleh pengguna yang sedang login
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan total coin
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
 *                     total_coin:
 *                       type: number
 *                       example: 500
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/total', authMiddleware, getTotalCoin);

/**
 * @openapi
 * /api/coin/history:
 *   get:
 *     tags:
 *       - Coin
 *     summary: Mendapatkan history coin pengguna yang sedang login
 *     description: Endpoint ini akan mengembalikan daftar history transaksi coin pengguna yang sedang login
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman untuk paginasi
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah item per halaman
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan history coin
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
 *                     histories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           user_id:
 *                             type: integer
 *                             example: 123
 *                           coin_di_dapat:
 *                             type: integer
 *                             example: 100
 *                           coin_di_gunakan:
 *                             type: integer
 *                             example: 0
 *                           tanggal_diperoleh:
 *                             type: string
 *                             format: date-time
 *                           tanggal_digunakan:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                           example: 50
 *                         total_pages:
 *                           type: integer
 *                           example: 5
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         items_per_page:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/history', authMiddleware, getCoinHistory);

/**
 * @openapi
 * /api/coin/add:
 *   post:
 *     tags:
 *       - Coin
 *     summary: Menambahkan coin ke user
 *     description: Endpoint ini akan menambahkan sejumlah coin ke akun pengguna tertentu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - amount
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID pengguna yang akan ditambahkan coin
 *                 example: 123
 *               amount:
 *                 type: number
 *                 description: Jumlah coin yang akan ditambahkan
 *                 example: 100
 *               keterangan:
 *                 type: string
 *                 description: Keterangan penambahan coin
 *                 example: "Reward dari pembelian produk"
 *     responses:
 *       200:
 *         description: Coin berhasil ditambahkan
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
 *                   example: "Coin berhasil ditambahkan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       example: 123
 *                     amount_added:
 *                       type: number
 *                       example: 100
 *                     new_total:
 *                       type: number
 *                       example: 600
 *       400:
 *         description: Data yang diberikan tidak valid
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post('/add', authMiddleware, addCoin);

/**
 * @openapi
 * /api/coin/deduct:
 *   post:
 *     tags:
 *       - Coin
 *     summary: Mengurangi coin user karena kesalahan teknis
 *     description: Endpoint ini akan mengurangi sejumlah coin dari akun pengguna tertentu karena kesalahan teknis
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - amount
 *               - alasan
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID pengguna yang akan dikurangi coinnya
 *                 example: 123
 *               amount:
 *                 type: number
 *                 description: Jumlah coin yang akan dikurangi
 *                 example: 50
 *               alasan:
 *                 type: string
 *                 description: Alasan pengurangan coin
 *                 example: "Kesalahan sistem pada transaksi #12345"
 *     responses:
 *       200:
 *         description: Coin berhasil dikurangi
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
 *                   example: "Coin berhasil dikurangi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       example: 123
 *                     amount_deducted:
 *                       type: number
 *                       example: 50
 *                     new_total:
 *                       type: number
 *                       example: 550
 *                     alasan:
 *                       type: string
 *                       example: "Kesalahan sistem pada transaksi #12345"
 *       400:
 *         description: Data yang diberikan tidak valid atau coin tidak mencukupi
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post('/deduct', authMiddleware, deductCoin);

export default router;