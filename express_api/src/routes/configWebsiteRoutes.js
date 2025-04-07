import express from 'express';
import { getConfigWebsite } from '../controllers/configWebsiteController.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     GambarKonfigurasiItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik gambar konfigurasi
 *           example: 1
 *         konfigurasi_id:
 *           type: integer
 *           description: ID konfigurasi yang terkait
 *           example: 1
 *         gambar:
 *           type: string
 *           description: URL atau path gambar
 *           example: "/storage/konfigurasi-images/gambar-1.jpg"
 *
 *     KonfigurasiItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik konfigurasi
 *           example: 1
 *         nama_perusahaan:
 *           type: string
 *           description: Nama perusahaan
 *           example: "PT Konsultan Risk Mitra"
 *         no_tlpn:
 *           type: string
 *           description: Nomor telepon perusahaan
 *           example: "0812-3456-7890"
 *         email:
 *           type: string
 *           description: Email perusahaan
 *           example: "info@konsultanmitra.co.id"
 *         alamat:
 *           type: string
 *           description: Alamat perusahaan
 *           example: "Jl. Merdeka No. 1, Jakarta"
 *         payment_guide:
 *           type: string
 *           description: Panduan pembayaran (bisa berupa teks/html)
 *           example: "<p>Silakan transfer ke rekening ABC...</p>"
 *         syarat_ketentuan:
 *           type: string
 *           description: Syarat dan ketentuan (bisa berupa teks/html)
 *           example: "<p>1. Layanan ini memiliki syarat...</p>"
 *         kebijakan_privasi:
 *           type: string
 *           description: Kebijakan privasi (bisa berupa teks/html)
 *           example: "<p>Kebijakan privasi kami...</p>"
 *         gambar_konfigurasi:
 *           type: array
 *           description: Daftar gambar yang terkait dengan konfigurasi
 *           items:
 *             $ref: '#/components/schemas/GambarKonfigurasiItem'
 *
 *     KonfigurasiResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Berhasil mengambil data konfigurasi website"
 *         data:
 *           $ref: '#/components/schemas/KonfigurasiItem'
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
 *   name: KonfigurasiWebsite
 *   description: API untuk mendapatkan detail konfigurasi website
 */

/**
 * @openapi
 * /api/config-website:
 *   get:
 *     summary: Mendapatkan data konfigurasi website
 *     description: Endpoint untuk mengambil 1 data konfigurasi (beserta relasi gambar) yang digunakan di website
 *     tags: [KonfigurasiWebsite]
 *     responses:
 *       200:
 *         description: Data konfigurasi berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KonfigurasiResponse'
 *       404:
 *         description: Data konfigurasi tidak ditemukan
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
router.get('/', getConfigWebsite);

export default router;
