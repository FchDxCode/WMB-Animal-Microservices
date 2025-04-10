import express from 'express';
import { getKlinikTerdekat } from '../controllers/klinikTerdekatController.js';

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
 *           example: "Klinik Sehat Sentosa"
 *         alamat_klinik:
 *           type: string
 *           description: Alamat lengkap klinik
 *           example: "Jl. Merdeka No. 123, Jakarta Selatan"
 *         logo_klinik:
 *           type: string
 *           description: URL atau path logo klinik
 *           example: "/storage/klinik/logo-sehat-sentosa.jpg"
 *         jam_operasional:
 *           type: string
 *           description: Jam buka dan tutup klinik untuk hari ini
 *           example: "08:00:00 - 20:00:00"
 *         jarak:
 *           type: number
 *           format: float
 *           description: Jarak klinik dari lokasi pengguna (dalam km)
 *           example: 1.5
 *         latitude:
 *           type: number
 *           format: float
 *           description: Koordinat latitude klinik
 *           example: -6.2088
 *         longitude:
 *           type: number
 *           format: float
 *           description: Koordinat longitude klinik
 *           example: 106.8456
 *
 *     KlinikTerdekatResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mendapatkan daftar klinik terdekat"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/KlinikItem'
 *         meta:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Jumlah total klinik yang ditemukan
 *               example: 5
 *             radius:
 *               type: number
 *               description: Radius pencarian dalam kilometer
 *               example: 10
 *             lokasi_pengguna:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                   example: -6.2
 *                 longitude:
 *                   type: number
 *                   example: 106.8
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Parameter latitude dan longitude diperlukan"
 *         error:
 *           type: string
 *           example: "Invalid request"
 */

/**
 * @openapi
 * tags:
 *   name: Klinik terdekat
 *   description: API untuk mendapatkan informasi klinik
 */

/**
 * @openapi
 * /api/klinik-terdekat:
 *   get:
 *     summary: Mendapatkan daftar klinik terdekat
 *     description: Endpoint untuk mengambil daftar klinik terdekat dari lokasi pengguna berdasarkan koordinat latitude dan longitude
 *     tags: [Klinik terdekat]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Koordinat latitude lokasi pengguna
 *         example: -6.2
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Koordinat longitude lokasi pengguna
 *         example: 106.8
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         required: false
 *         description: Radius pencarian dalam kilometer (default 10 km)
 *         example: 5
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Jumlah maksimal klinik yang akan ditampilkan (default 20)
 *         example: 10
 *     responses:
 *       200:
 *         description: Daftar klinik terdekat berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KlinikTerdekatResponse'
 *       400:
 *         description: Parameter tidak valid
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
router.get('/', getKlinikTerdekat);

export default router;