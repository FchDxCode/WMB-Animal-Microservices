import express from 'express';
import { getArtikelList, getArtikelDetail } from '../controllers/artikelController.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ArtikelListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik artikel
 *           example: 1
 *         judul:
 *           type: string
 *           description: Judul artikel
 *           example: "Teknologi Terbaru di 2025"
 *         preview:
 *           type: string
 *           description: Deskripsi singkat tentang artikel
 *           example: "Perkembangan teknologi terbaru yang akan mengubah dunia..."
 *         thumbnail:
 *           type: string
 *           nullable: true
 *           description: URL gambar thumbnail artikel
 *           example: "/storage/artikel-images/thumbnail-1.jpg"
 *         tanggal_posting:
 *           type: string
 *           format: date-time
 *           description: Tanggal artikel dipublikasikan
 *           example: "2024-03-23T08:30:00Z"
 *         jumlah_dilihat:
 *           type: integer
 *           description: Jumlah berapa kali artikel telah dilihat
 *           example: 120
 *         article_type:
 *           type: string
 *           enum: [popular, recent, regular]
 *           description: Tipe artikel (populer hari ini, terbaru hari ini, atau artikel biasa)
 *           example: "popular"
 *         created_today:
 *           type: boolean
 *           description: Menandakan apakah artikel dibuat hari ini
 *           example: true
 *     
 *     ArtikelListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mengambil data artikel"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ArtikelListItem'
 *         pagination:
 *           type: object
 *           properties:
 *             total_data:
 *               type: integer
 *               description: Total jumlah artikel
 *               example: 50
 *             total_halaman:
 *               type: integer
 *               description: Total jumlah halaman
 *               example: 5
 *             halaman_aktif:
 *               type: integer
 *               description: Halaman yang sedang aktif
 *               example: 1
 *             jumlah_per_halaman:
 *               type: integer
 *               description: Jumlah artikel per halaman
 *               example: 10
 *         summary:
 *           type: object
 *           properties:
 *             popular_count:
 *               type: integer
 *               description: Jumlah artikel populer hari ini
 *               example: 3
 *             recent_count:
 *               type: integer
 *               description: Jumlah artikel terbaru hari ini (non-populer)
 *               example: 5
 *             regular_count:
 *               type: integer
 *               description: Jumlah artikel biasa yang ditampilkan
 *               example: 2
 *     
 *     ArtikelDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik artikel
 *           example: 1
 *         judul:
 *           type: string
 *           description: Judul artikel
 *           example: "Teknologi Terbaru di 2025"
 *         preview:
 *           type: string
 *           description: Deskripsi singkat tentang artikel
 *           example: "Perkembangan teknologi terbaru yang akan mengubah dunia di tahun 2025..."
 *         deskripsi:
 *           type: string
 *           description: Konten lengkap artikel dalam format HTML
 *           example: "<p>Artikel lengkap tentang perkembangan teknologi terbaru yang akan mengubah dunia di tahun 2025...</p>"
 *         tanggal_posting:
 *           type: string
 *           format: date-time
 *           description: Tanggal artikel dipublikasikan
 *           example: "2025-03-20T08:30:00Z"
 *         jumlah_dilihat:
 *           type: integer
 *           description: Jumlah berapa kali artikel telah dilihat
 *           example: 121
 *         gambar:
 *           type: array
 *           description: Daftar gambar yang terkait dengan artikel
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID unik gambar
 *                 example: 1
 *               url:
 *                 type: string
 *                 description: URL gambar
 *                 example: "/storage/artikel-images/gambar-1.jpg"
 *     
 *     ArtikelDetailResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mengambil detail artikel"
 *         data:
 *           $ref: '#/components/schemas/ArtikelDetail'
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
 *   name: Artikel
 *   description: API untuk manajemen artikel
 */

/**
 * @openapi
 * /api/artikel:
 *   get:
 *     summary: Mendapatkan daftar artikel
 *     description: >
 *       Endpoint untuk mengambil daftar artikel dengan urutan prioritas sebagai berikut:
 *       1. Artikel populer hari ini (minimal 10 views)
 *       2. Artikel terbaru hari ini (non-populer)
 *       3. Artikel regular (artikel lama/biasa)
 *       
 *       Setiap artikel akan ditandai dengan tipe-nya (popular, recent, regular) dan
 *       flag created_today yang menunjukkan apakah artikel dibuat hari ini.
 *     tags: [Artikel]
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
 *         description: Jumlah artikel yang ditampilkan per halaman
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian judul artikel
 *     responses:
 *       200:
 *         description: Daftar artikel berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArtikelListResponse'
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getArtikelList);

/**
 * @openapi
 * /api/artikel/{id}:
 *   get:
 *     summary: Mendapatkan detail artikel
 *     description: Endpoint untuk mengambil detail lengkap dari sebuah artikel berdasarkan ID. Setiap kali endpoint ini diakses, jumlah_dilihat dari artikel akan bertambah secara otomatis.
 *     tags: [Artikel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID artikel yang ingin ditampilkan
 *         example: 1
 *     responses:
 *       200:
 *         description: Detail artikel berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArtikelDetailResponse'
 *       400:
 *         description: ID artikel tidak diberikan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ID artikel diperlukan"
 *       404:
 *         description: Artikel tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Artikel tidak ditemukan"
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getArtikelDetail);

export default router;