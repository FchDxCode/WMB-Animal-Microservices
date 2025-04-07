import { Router } from 'express';
import { getAllMediaSections, getMediaSectionsByName, getMediaSectionById } from '../controllers/mediaSectionsController.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: MediaSections
 *   description: API untuk mendapatkan data media section (splashscreen, onboarding, slider, dll)
 */

/**
 * @openapi
 * /api/media-sections:
 *   get:
 *     summary: Ambil semua media sections
 *     description: Mengambil semua data media (splashscreen, onboarding, slider) beserta gambar terkait. Tidak memerlukan autentikasi.
 *     tags: [MediaSections]
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
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
 *                   example: Berhasil mengambil data media sections
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       namaSection:
 *                         type: string
 *                         example: onboarding
 *                       judul:
 *                         type: string
 *                         example: Selamat datang
 *                       deskripsi:
 *                         type: string
 *                         example: Mari jelajahi aplikasi ini
 *                       gambarMedia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           gambarMedia:
 *                             type: string
 *                             format: uri
 *                             example: https://example.com/image.jpg
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-06T10:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-06T10:30:00.000Z"
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: Terjadi kesalahan pada server
 */
router.get('/', getAllMediaSections);

/**
 * @openapi
 * /api/media-sections/by-name:
 *   get:
 *     summary: Ambil media sections berdasarkan nama
 *     description: Mengambil data media section berdasarkan nama section. Tidak memerlukan autentikasi.
 *     tags: [MediaSections]
 *     parameters:
 *       - in: query
 *         name: nama_section
 *         schema:
 *           type: string
 *         required: true
 *        
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
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
 *                   example: Berhasil mengambil data media section dengan nama onboarding
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       namaSection:
 *                         type: string
 *                         example: onboarding
 *                       judul:
 *                         type: string
 *                         example: Selamat datang
 *                       deskripsi:
 *                         type: string
 *                         example: Mari jelajahi aplikasi ini
 *                       gambarMedia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           gambarMedia:
 *                             type: string
 *                             format: uri
 *                             example: https://example.com/image.jpg
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-06T10:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-06T10:30:00.000Z"
 *       404:
 *         description: Media section tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get('/by-name', getMediaSectionsByName);

/**
 * @openapi
 * /api/media-sections/{id}:
 *   get:
 *     summary: Ambil media section berdasarkan ID
 *     description: Mengambil data detail media section berdasarkan ID. Tidak memerlukan autentikasi.
 *     tags: [MediaSections]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID media section
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
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
 *                   example: Berhasil mengambil detail media section
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     namaSection:
 *                       type: string
 *                       example: onboarding
 *                     judul:
 *                       type: string
 *                       example: Selamat datang
 *                     deskripsi:
 *                       type: string
 *                       example: Mari jelajahi aplikasi ini
 *                     gambarMedia:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         gambarMedia:
 *                           type: string
 *                           format: uri
 *                           example: https://example.com/image.jpg
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-06T10:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-06T10:30:00.000Z"
 *       404:
 *         description: Media section tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get('/:id', getMediaSectionById);

export default router;