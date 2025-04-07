// src/routes/alamatUserRoutes.js
import express from 'express';
import { 
  getAllAlamat, 
  getAlamatById, 
  addAlamat, 
  updateAlamat, 
  deleteAlamat,
  getAllProvinsi,
  getKabupatenByProvinsi,
  getKecamatanByKabupaten
} from '../controllers/alamatUserController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * components:
 *   schemas:
 *     Alamat:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         nama_lengkap:
 *           type: string
 *           example: "Ahmad Fauzi"
 *         no_tlpn:
 *           type: string
 *           example: "08123456789"
 *         provinsi_id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         provinsi:
 *           type: string
 *           example: "Jawa Barat"
 *         kabupaten_kota_id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         kabupaten_kota:
 *           type: string
 *           example: "Kota Bandung"
 *         kecamatan_id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         kecamatan:
 *           type: string
 *           example: "Cibiru"
 *         kode_pos:
 *           type: string
 *           example: "40614"
 *         maps:
 *           type: string
 *           example: "Google Maps Link"
 *         detail_alamat:
 *           type: string
 *           example: "Jl. Raya Cibiru No. 123"
 *         latitude:
 *           type: number
 *           format: float
 *           example: -6.9034443
 *         longitude:
 *           type: number
 *           format: float
 *           example: 107.7693102
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *       required:
 *         - nama_lengkap
 *         - no_tlpn
 *         - provinsi_id
 *         - kabupaten_kota_id
 *         - kecamatan_id
 *         - kode_pos
 *         - detail_alamat
 */

/**
 * @openapi
 * tags:
 *   name: Alamat
 *   description: API untuk manajemen alamat user
 */

/**
 * @openapi
 * /api/alamat:
 *   get:
 *     summary: Mendapatkan semua alamat milik user yang login
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar alamat
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
 *                   example: "Berhasil mengambil data alamat"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Alamat'
 */
router.get('/', getAllAlamat);

/**
 * @openapi
 * /api/alamat/{id}:
 *   get:
 *     summary: Mendapatkan detail alamat berdasarkan ID
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID alamat
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail alamat
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
 *                   example: "Berhasil mengambil detail alamat"
 *                 data:
 *                   $ref: '#/components/schemas/Alamat'
 */
router.get('/:id', getAlamatById);

/**
 * @openapi
 * /api/alamat:
 *   post:
 *     summary: Menambahkan alamat baru
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_lengkap:
 *                 type: string
 *                 example: "Ahmad Fauzi"
 *               no_tlpn:
 *                 type: string
 *                 example: "08123456789"
 *               provinsi_id:
 *                 type: integer
 *                 example: 1
 *               kabupaten_kota_id:
 *                 type: integer
 *                 example: 1
 *               kecamatan_id:
 *                 type: integer
 *                 example: 1
 *               kode_pos:
 *                 type: string
 *                 example: "40614"
 *               maps:
 *                 type: string
 *                 example: "Google Maps Link"
 *               detail_alamat:
 *                 type: string
 *                 example: "Jl. Raya Cibiru No. 123"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -6.9034443
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 107.7693102
 *             required:
 *               - nama_lengkap
 *               - no_tlpn
 *               - provinsi_id
 *               - kabupaten_kota_id
 *               - kecamatan_id
 *               - kode_pos
 *               - detail_alamat
 *     responses:
 *       201:
 *         description: Alamat berhasil ditambahkan
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
 *                   example: "Alamat berhasil ditambahkan"
 *                 data:
 *                   $ref: '#/components/schemas/Alamat'
 */
router.post('/', addAlamat);

/**
 * @openapi
 * /api/alamat/{id}:
 *   put:
 *     summary: Mengupdate data alamat
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID alamat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_lengkap:
 *                 type: string
 *                 example: "Ahmad Fauzi"
 *               no_tlpn:
 *                 type: string
 *                 example: "08123456789"
 *               provinsi_id:
 *                 type: integer
 *                 example: 1
 *               kabupaten_kota_id:
 *                 type: integer
 *                 example: 1
 *               kecamatan_id:
 *                 type: integer
 *                 example: 1
 *               kode_pos:
 *                 type: string
 *                 example: "40614"
 *               maps:
 *                 type: string
 *                 example: "Google Maps Link"
 *               detail_alamat:
 *                 type: string
 *                 example: "Jl. Raya Cibiru No. 123"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -6.9034443
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 107.7693102
 *     responses:
 *       200:
 *         description: Alamat berhasil diperbarui
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
 *                   example: "Alamat berhasil diperbarui"
 *                 data:
 *                   $ref: '#/components/schemas/Alamat'
 */
router.put('/:id', updateAlamat);

/**
 * @openapi
 * /api/alamat/{id}:
 *   delete:
 *     summary: Menghapus alamat
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID alamat
 *     responses:
 *       200:
 *         description: Alamat berhasil dihapus
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
 *                   example: "Alamat berhasil dihapus"
 */
router.delete('/:id', deleteAlamat);

/**
 * @openapi
 * /api/alamat/provinsi/all:
 *   get:
 *     summary: Mendapatkan semua provinsi untuk dropdown
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar provinsi
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
 *                   example: "Berhasil mengambil data provinsi"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       provinsi:
 *                         type: string
 *                         example: "Jawa Barat"
 */
router.get('/provinsi/all', getAllProvinsi);

/**
 * @openapi
 * /api/alamat/kabupaten/{provinsiId}:
 *   get:
 *     summary: Mendapatkan kabupaten/kota berdasarkan provinsi untuk dropdown
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provinsiId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID provinsi
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar kabupaten/kota
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
 *                   example: "Berhasil mengambil data kabupaten/kota"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nama_kabupaten_kota:
 *                         type: string
 *                         example: "Kota Bandung"
 */
router.get('/kabupaten/:provinsiId', getKabupatenByProvinsi);

/**
 * @openapi
 * /api/alamat/kecamatan/{kabupatenId}:
 *   get:
 *     summary: Mendapatkan kecamatan berdasarkan kabupaten/kota untuk dropdown
 *     tags: [Alamat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kabupatenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kabupaten/kota
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar kecamatan
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
 *                   example: "Berhasil mengambil data kecamatan"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nama_kecamatan:
 *                         type: string
 *                         example: "Cibiru"
 */
router.get('/kecamatan/:kabupatenId', getKecamatanByKabupaten);

export default router;