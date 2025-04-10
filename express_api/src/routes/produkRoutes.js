import express from 'express';
import { 
  getAllProducts, 
  getProductsByCategory, 
  getProductDetail, 
  searchProducts,
  addToKeranjang,
  // getKeranjangPengguna,
  // removeFromKeranjang,
  // updateKeranjangItem
} from '../controllers/produkController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/produk:
 *   get:
 *     tags:
 *       - Produk
 *     summary: Mendapatkan daftar semua produk
 *     description: Endpoint ini akan mengembalikan daftar produk dengan informasi dasar
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
 *         description: Berhasil mendapatkan daftar produk
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
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama_produk:
 *                             type: string
 *                             example: "Sepatu Olahraga"
 *                           harga_produk:
 *                             type: number
 *                             example: 250000
 *                           diskon_produk:
 *                             type: number
 *                             example: 20000
 *                           slug:
 *                             type: string
 *                             example: "sepatu-olahraga"
 *                           gambar:
 *                             type: string
 *                             example: "uploads/products/sepatu-1.jpg"
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
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/', getAllProducts);

/**
 * @openapi
 * /api/produk/search:
 *   get:
 *     tags:
 *       - Produk
 *     summary: Mencari produk berdasarkan keyword
 *     description: Endpoint ini akan mencari produk berdasarkan nama atau deskripsi
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian
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
 *         description: Berhasil mendapatkan hasil pencarian
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
 *                     keyword:
 *                       type: string
 *                       example: "sepatu"
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama_produk:
 *                             type: string
 *                             example: "Sepatu Olahraga"
 *                           harga_produk:
 *                             type: number
 *                             example: 250000
 *                           diskon_produk:
 *                             type: number
 *                             example: 20000
 *                           slug:
 *                             type: string
 *                             example: "sepatu-olahraga"
 *                           gambar:
 *                             type: string
 *                             example: "uploads/products/sepatu-1.jpg"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                           example: 15
 *                         total_pages:
 *                           type: integer
 *                           example: 2
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         items_per_page:
 *                           type: integer
 *                           example: 10
 *       400:
 *         description: Parameter pencarian (keyword) diperlukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/search', searchProducts);

/**
 * @openapi
 * /api/produk/kategori/{slug}:
 *   get:
 *     tags:
 *       - Produk
 *     summary: Mendapatkan daftar produk berdasarkan kategori
 *     description: Endpoint ini akan mengembalikan daftar produk berdasarkan kategori tertentu
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug kategori produk
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
 *         description: Berhasil mendapatkan daftar produk berdasarkan kategori
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
 *                     kategori:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 2
 *                         nama:
 *                           type: string
 *                           example: "Pakaian Pria"
 *                         slug:
 *                           type: string
 *                           example: "pakaian-pria"
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           nama_produk:
 *                             type: string
 *                             example: "Kemeja Formal"
 *                           harga_produk:
 *                             type: number
 *                             example: 180000
 *                           diskon_produk:
 *                             type: number
 *                             example: 15000
 *                           slug:
 *                             type: string
 *                             example: "kemeja-formal"
 *                           gambar:
 *                             type: string
 *                             example: "uploads/products/kemeja-1.jpg"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                           example: 25
 *                         total_pages:
 *                           type: integer
 *                           example: 3
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         items_per_page:
 *                           type: integer
 *                           example: 10
 *       404:
 *         description: Kategori tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/kategori/:slug', getProductsByCategory);

/**
 * @openapi
 * /api/produk/{identifier}:
 *   get:
 *     tags:
 *       - Produk
 *     summary: Mendapatkan detail produk berdasarkan ID atau slug
 *     description: Endpoint ini akan mengembalikan detail lengkap dari sebuah produk
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: ID atau slug produk
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail produk
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nama_produk:
 *                       type: string
 *                       example: "Sepatu Olahraga"
 *                     slug:
 *                       type: string
 *                       example: "sepatu-olahraga"
 *                     deskripsi:
 *                       type: string
 *                       example: "Sepatu olahraga dengan kualitas terbaik, nyaman dipakai untuk aktivitas sehari-hari."
 *                     harga_produk:
 *                       type: number
 *                       example: 250000
 *                     diskon_produk:
 *                       type: number
 *                       example: 20000
 *                     stok_produk:
 *                       type: integer
 *                       example: 50
 *                     kategori:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nama:
 *                           type: string
 *                           example: "Sepatu"
 *                         slug:
 *                           type: string
 *                           example: "sepatu"
 *                     gambar:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           url:
 *                             type: string
 *                             example: "uploads/products/sepatu-1.jpg"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T10:30:00Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-20T14:15:00Z"
 *       404:
 *         description: Produk tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/:identifier', getProductDetail);

/**
 * @openapi
 * /api/produk/{id}/keranjang:
 *   post:
 *     tags:
 *       - Produk
 *       - Keranjang
 *     summary: Menambahkan produk ke keranjang
 *     description: Endpoint ini akan menambahkan produk tertentu ke keranjang belanja pengguna yang sedang login
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produk yang akan ditambahkan ke keranjang
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stok_produk_id
 *               - jumlah_dibeli
 *             properties:
 *               stok_produk_id:
 *                 type: integer
 *                 description: ID stok produk yang akan ditambahkan ke keranjang
 *                 example: 2
 *               jumlah_dibeli:
 *                 type: integer
 *                 description: Jumlah produk yang akan dibeli
 *                 example: 2
 *     responses:
 *       201:
 *         description: Produk berhasil ditambahkan ke keranjang
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
 *                   example: "Produk berhasil ditambahkan ke keranjang"
 *                 data:
 *                   type: object
 *                   properties:
 *                     keranjang_item:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         produk_id:
 *                           type: integer
 *                           example: 5
 *                         stok_produk_id:
 *                           type: integer
 *                           example: 2
 *                         jumlah_dibeli:
 *                           type: integer
 *                           example: 2
 *                         subtotal_harga:
 *                           type: number
 *                           example: 360000
 *                     produk:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         nama_produk:
 *                           type: string
 *                           example: "Kemeja Formal"
 *                         harga_produk:
 *                           type: number
 *                           example: 180000
 *                         diskon_produk:
 *                           type: number
 *                           example: 0
 *                         harga_setelah_diskon:
 *                           type: number
 *                           example: 180000
 *       400:
 *         description: Data yang diberikan tidak valid
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Produk tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post('/:id/keranjang', authMiddleware, addToKeranjang);

export default router;