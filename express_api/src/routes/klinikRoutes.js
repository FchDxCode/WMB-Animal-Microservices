import express from 'express';
import { getKlinikList, getKlinikDetail } from '../controllers/klinikController.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     KlinikListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik klinik
 *           example: 1
 *         nama:
 *           type: string
 *           description: Nama klinik
 *           example: "Klinik Sehat Sentosa"
 *         alamat:
 *           type: string
 *           description: Alamat klinik
 *           example: "Jl. Merdeka No. 123, Jakarta"
 *         logo:
 *           type: string
 *           nullable: true
 *           description: URL logo klinik
 *           example: "/storage/klinik-images/logo-1.jpg"
 *         jam_operasional:
 *           type: string
 *           description: Jam operasional klinik hari ini
 *           example: "08:00:00 - 17:00:00"
 *         jarak:
 *           type: string
 *           description: Jarak dari lokasi pengguna ke klinik
 *           example: "2.5 km"
 *     
 *     KlinikListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mengambil data klinik"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/KlinikListItem'
 *         pagination:
 *           type: object
 *           properties:
 *             total_data:
 *               type: integer
 *               description: Total jumlah klinik
 *               example: 15
 *             total_halaman:
 *               type: integer
 *               description: Total jumlah halaman
 *               example: 2
 *             halaman_aktif:
 *               type: integer
 *               description: Halaman yang sedang aktif
 *               example: 1
 *             jumlah_per_halaman:
 *               type: integer
 *               description: Jumlah klinik per halaman
 *               example: 10
 *     
 *     JadwalItem:
 *       type: object
 *       properties:
 *         hari:
 *           type: string
 *           description: Nama hari
 *           example: "Senin"
 *         jam:
 *           type: string
 *           description: Jam buka dan tutup
 *           example: "08:00:00 - 17:00:00"
 *     
 *     LayananItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID layanan
 *           example: 1
 *         nama:
 *           type: string
 *           description: Nama layanan
 *           example: "Konsultasi Dokter Umum"
 *         harga:
 *           type: string
 *           description: Harga layanan dalam format Rupiah
 *           example: "Rp 150.000"
 *     
 *     KlinikDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik klinik
 *           example: 1
 *         nama:
 *           type: string
 *           description: Nama klinik
 *           example: "Klinik Sehat Sentosa"
 *         deskripsi:
 *           type: string
 *           description: Deskripsi lengkap klinik
 *           example: "Klinik Sehat Sentosa adalah klinik yang menyediakan berbagai layanan kesehatan terbaik dengan harga terjangkau."
 *         alamat:
 *           type: string
 *           description: Alamat lengkap klinik
 *           example: "Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta"
 *         no_telepon:
 *           type: string
 *           description: Nomor telepon klinik
 *           example: "021-1234567"
 *         harga_konsultasi:
 *           type: string
 *           description: Harga konsultasi di klinik
 *           example: "Rp 100.000"
 *         thumbnail:
 *           type: string
 *           nullable: true
 *           description: URL thumbnail klinik
 *           example: "/storage/klinik-images/thumbnail-1.jpg"
 *         logo:
 *           type: string
 *           nullable: true
 *           description: URL logo klinik
 *           example: "/storage/klinik-images/logo-1.jpg"
 *         jadwal_operasional:
 *           type: array
 *           description: Jadwal operasional klinik
 *           items:
 *             $ref: '#/components/schemas/JadwalItem'
 *         layanan:
 *           type: array
 *           description: Daftar layanan yang disediakan klinik
 *           items:
 *             $ref: '#/components/schemas/LayananItem'
 *         maps_embed:
 *           type: string
 *           nullable: true
 *           description: Kode embed untuk Google Maps
 *           example: "<iframe src=\"https://www.google.com/maps/embed?...\" width=\"600\" height=\"450\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\"></iframe>"
 *         jarak:
 *           type: string
 *           description: Jarak dari lokasi pengguna ke klinik
 *           example: "2.5 km"
 *         koordinat:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               description: Koordinat latitude klinik
 *               example: -6.175392
 *             longitude:
 *               type: number
 *               description: Koordinat longitude klinik
 *               example: 106.827153
 *     
 *     KlinikDetailResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mengambil detail klinik"
 *         data:
 *           $ref: '#/components/schemas/KlinikDetail'
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
 *   name: Klinik
 *   description: API untuk manajemen data klinik
 */

/**
 * @openapi
 * /api/klinik:
 *   get:
 *     summary: Mendapatkan daftar klinik
 *     description: >
 *       Endpoint untuk mengambil daftar klinik dengan informasi dasar seperti nama, alamat, logo, jam operasional,
 *       dan jarak dari lokasi pengguna jika koordinat pengguna disediakan. Klinik akan diurutkan berdasarkan jarak
 *       terdekat dari pengguna jika koordinat pengguna tersedia.
 *     tags: [Klinik]
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
 *         description: Jumlah klinik yang ditampilkan per halaman
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian nama klinik
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: float
 *         description: Koordinat latitude pengguna (untuk menghitung jarak)
 *       - in: query
 *         name: long
 *         schema:
 *           type: number
 *           format: float
 *         description: Koordinat longitude pengguna (untuk menghitung jarak)
 *     responses:
 *       200:
 *         description: Daftar klinik berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KlinikListResponse'
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getKlinikList);

/**
 * @openapi
 * /api/klinik/{id}:
 *   get:
 *     summary: Mendapatkan detail klinik
 *     description: >
 *       Endpoint untuk mengambil detail lengkap dari sebuah klinik berdasarkan ID, termasuk informasi
 *       tentang nama, deskripsi, alamat, jadwal operasional, layanan yang ditawarkan, lokasi pada maps,
 *       dan jarak dari lokasi pengguna jika koordinat pengguna disediakan.
 *     tags: [Klinik]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID klinik yang ingin ditampilkan
 *         example: 1
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: float
 *         description: Koordinat latitude pengguna (untuk menghitung jarak)
 *       - in: query
 *         name: long
 *         schema:
 *           type: number
 *           format: float
 *         description: Koordinat longitude pengguna (untuk menghitung jarak)
 *     responses:
 *       200:
 *         description: Detail klinik berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KlinikDetailResponse'
 *       400:
 *         description: ID klinik tidak diberikan
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
 *                   example: "ID klinik diperlukan"
 *       404:
 *         description: Klinik tidak ditemukan
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
 *                   example: "Klinik tidak ditemukan"
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getKlinikDetail);

export default router;