import express from 'express';
import { getAllKlinik, getDokterByKlinikId } from '../controllers/klinikKonsultasiController.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     KlinikItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik klinik
 *           example: 1
 *         nama_klinik:
 *           type: string
 *           description: Nama klinik
 *           example: "Klinik Konsultasi Medika"
 *         deskripsi_klinik:
 *           type: string
 *           description: Deskripsi tentang klinik
 *           example: "Klinik spesialis konsultasi kesehatan anak dan lansia"
 *         harga_konsultasi:
 *           type: number
 *           format: decimal
 *           description: Harga untuk konsultasi
 *           example: 150000
 *         waktu_konsultasi:
 *           type: string
 *           format: date-time
 *           description: Waktu konsultasi tersedia
 *           example: "2025-04-15T08:00:00Z"
 *         logo_klinik:
 *           type: string
 *           description: URL atau path logo klinik
 *           example: "/storage/klinik-images/logo-1.jpg"
 *
 *     KlinikDetailItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik klinik
 *           example: 1
 *         nama_klinik:
 *           type: string
 *           description: Nama klinik
 *           example: "Klinik Konsultasi Medika"
 *         deskripsi_klinik:
 *           type: string
 *           description: Deskripsi tentang klinik
 *           example: "Klinik spesialis konsultasi kesehatan anak dan lansia"
 *         alamat_klinik:
 *           type: string
 *           description: Alamat lengkap klinik
 *           example: "Jl. Kesehatan No. 123, Jakarta Selatan"
 *         no_tlpn_klinik:
 *           type: string
 *           description: Nomor telepon klinik
 *           example: "021-12345678"
 *         harga_konsultasi:
 *           type: number
 *           format: decimal
 *           description: Harga untuk konsultasi
 *           example: 150000
 *         waktu_konsultasi:
 *           type: string
 *           format: date-time
 *           description: Waktu konsultasi tersedia
 *           example: "2025-04-15T08:00:00Z"
 *         logo_klinik:
 *           type: string
 *           description: URL atau path logo klinik
 *           example: "/storage/klinik-images/logo-1.jpg"
 *         thumbnail_klinik:
 *           type: string
 *           description: URL atau path thumbnail klinik
 *           example: "/storage/klinik-images/thumb-1.jpg"
 *         layanan:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LayananKlinikItem'
 *         jadwal_buka:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JadwalBukaKlinikItem'
 *
 *     LayananKlinikItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik layanan
 *           example: 1
 *         nama_layanan:
 *           type: string
 *           description: Nama layanan yang disediakan
 *           example: "Konsultasi Kesehatan Anak"
 *         harga_layanan:
 *           type: number
 *           format: decimal
 *           description: Harga layanan
 *           example: 200000
 *
 *     JadwalBukaKlinikItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik jadwal
 *           example: 1
 *         hari:
 *           type: string
 *           description: Hari buka klinik
 *           example: "Senin"
 *         jam_mulai:
 *           type: string
 *           description: Jam buka klinik
 *           example: "08:00:00"
 *         jam_selesai:
 *           type: string
 *           description: Jam tutup klinik
 *           example: "17:00:00"
 *
 *     DokterItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik dokter
 *           example: 1
 *         nama_dokter:
 *           type: string
 *           description: Nama dokter
 *           example: "dr. Andi Pratama"
 *         universitas_dokter:
 *           type: string
 *           description: Asal universitas dokter
 *           example: "Universitas Indonesia"
 *         gambar_dokter:
 *           type: string
 *           description: URL atau path gambar dokter
 *           example: "/storage/dokter-images/dokter-1.jpg"
 *
 *     KlinikResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mendapatkan data klinik konsultasi"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/KlinikItem'
 *
 *     KlinikDetailResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mendapatkan detail klinik"
 *         data:
 *           $ref: '#/components/schemas/KlinikDetailItem'
 *
 *     DokterResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mendapatkan data dokter"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DokterItem'
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
 *   name: KlinikKonsultasi
 *   description: API untuk daftar klinik konsultasi dan dokter yang tersedia
 */

/**
 * @openapi
 * /api/klinik-konsultasi:
 *   get:
 *     summary: Mendapatkan daftar semua klinik konsultasi
 *     description: Endpoint untuk mengambil semua data klinik konsultasi yang tersedia
 *     tags: [KlinikKonsultasi]
 *     responses:
 *       200:
 *         description: Daftar klinik berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KlinikResponse'
 *       404:
 *         description: Data klinik tidak ditemukan
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
router.get('/', getAllKlinik);

/**
 * @openapi
 * /api/klinik-konsultasi/{klinikId}/dokter:
 *   get:
 *     summary: Mendapatkan daftar dokter di klinik tertentu
 *     description: Endpoint untuk mengambil daftar dokter yang terdaftar di suatu klinik berdasarkan ID klinik
 *     tags: [KlinikKonsultasi]
 *     parameters:
 *       - in: path
 *         name: klinikId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID klinik untuk mencari dokter
 *     responses:
 *       200:
 *         description: Daftar dokter berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DokterResponse'
 *       404:
 *         description: Data klinik atau dokter tidak ditemukan
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
router.get('/:klinikId/dokter', getDokterByKlinikId);

export default router;