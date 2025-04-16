// src/routes/petRoutes.js
import express from 'express';
import multer from 'multer';
import { uploadConfig } from '../utils/uploadUtils.js';
import { 
  getAllPets, 
  getPetById, 
  addPet, 
  updatePet, 
  deletePet, 
  updatePetProfileImage 
} from '../controllers/petController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Error handling untuk multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file terlalu besar. Maksimal 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error upload: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Format file tidak didukung. Gunakan format JPG, PNG, atau GIF.'
    });
  }
  next();
};

/**
 * @openapi
 * components:
 *   schemas:
 *     Pet:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         nama_hewan:
 *           type: string
 *           example: "Milo"
 *         jenis_hewan_id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         jenis_kelamin:
 *           type: string
 *           enum: [jantan, betina, nonbinary]
 *           example: "jantan"
 *         jenis_ras:
 *           type: bigint
 *           example: 3
 *         tanggal_lahir_hewan:
 *           type: string
 *           format: date
 *           example: "2022-05-10"
 *         berat_badan:
 *           type: integer
 *           example: 3
 *         profile_image:
 *           type: string
 *           example: "pet_1234.jpg"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *       required:
 *         - nama_hewan
 *         - jenis_hewan_id
 *         - jenis_kelamin
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Terjadi kesalahan pada server."
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operasi berhasil."
 *         data:
 *           type: object
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * tags:
 *   name: Pets
 *   description: API untuk manajemen hewan peliharaan
 */

// Routes dengan auth middleware
router.use(authMiddleware);

/**
 * @openapi
 * /api/pets:
 *   get:
 *     summary: Mendapatkan semua hewan peliharaan milik user yang login
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar hewan peliharaan
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
 *                   example: "Berhasil mengambil data hewan peliharaan"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pet'
 *       401:
 *         description: Tidak terautentikasi
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
router.get('/', getAllPets);

/**
 * @openapi
 * /api/pets/{id}:
 *   get:
 *     summary: Mendapatkan detail hewan peliharaan berdasarkan ID
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID hewan peliharaan
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail hewan peliharaan
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
 *                   example: "Berhasil mengambil detail hewan peliharaan"
 *                 data:
 *                   $ref: '#/components/schemas/Pet'
 *       401:
 *         description: Tidak terautentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Hewan peliharaan tidak ditemukan
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
router.get('/:id', getPetById);

/**
 * @openapi
 * /api/pets:
 *   post:
 *     summary: Menambahkan hewan peliharaan baru
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_hewan:
 *                 type: string
 *                 example: "Milo"
 *               jenis_hewan_id:
 *                 type: integer
 *                 example: 1
 *               jenis_kelamin:
 *                 type: string
 *                 enum: [jantan, betina, nonbinary]
 *                 example: "jantan"
 *               jenis_ras:
 *                 type: bigint
 *                 example: 2
 *               tanggal_lahir_hewan:
 *                 type: string
 *                 format: date
 *                 example: "2022-05-10"
 *               berat_badan:
 *                 type: integer
 *                 example: 3
 *             required:
 *               - nama_hewan
 *               - jenis_hewan_id
 *               - jenis_kelamin
 *     responses:
 *       201:
 *         description: Hewan peliharaan berhasil ditambahkan
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
 *                   example: "Hewan peliharaan berhasil ditambahkan"
 *                 data:
 *                   $ref: '#/components/schemas/Pet'
 *       400:
 *         description: Data input tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Tidak terautentikasi
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
router.post('/', addPet);

/**
 * @openapi
 * /api/pets/{id}:
 *   put:
 *     summary: Mengupdate data hewan peliharaan
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID hewan peliharaan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_hewan:
 *                 type: string
 *                 example: "Milo Updated"
 *               jenis_hewan_id:
 *                 type: integer
 *                 example: 2
 *               jenis_kelamin:
 *                 type: string
 *                 enum: [jantan, betina, nonbinary]
 *                 example: "jantan"
 *               jenis_ras:
 *                 type: bigint
 *                 example: 1
 *               tanggal_lahir_hewan:
 *                 type: string
 *                 format: date
 *                 example: "2022-05-15"
 *               berat_badan:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: Data hewan peliharaan berhasil diperbarui
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
 *                   example: "Data hewan peliharaan berhasil diperbarui"
 *                 data:
 *                   $ref: '#/components/schemas/Pet'
 *       400:
 *         description: Data input tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Tidak terautentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Hewan peliharaan tidak ditemukan
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
router.put('/:id', updatePet);

/**
 * @openapi
 * /api/pets/{id}:
 *   delete:
 *     summary: Menghapus hewan peliharaan
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID hewan peliharaan
 *     responses:
 *       200:
 *         description: Hewan peliharaan berhasil dihapus
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
 *                   example: "Hewan peliharaan berhasil dihapus"
 *       401:
 *         description: Tidak terautentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Hewan peliharaan tidak ditemukan
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
router.delete('/:id', deletePet);

/**
 * @openapi
 * /api/pets/{id}/profile-image:
 *   put:
 *     summary: Mengupload/mengupdate gambar profil hewan
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID hewan peliharaan
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile_hewan:
 *                 type: string
 *                 format: binary
 *                 description: File gambar profil hewan (JPG, PNG, GIF, maks 5MB)
 *             required:
 *               - profile_hewan
 *     responses:
 *       200:
 *         description: Gambar profil hewan berhasil diperbarui
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
 *                   example: "Gambar profil hewan berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile_image:
 *                       type: string
 *                       example: "pet_5678.jpg"
 *       400:
 *         description: Format file tidak valid atau ukuran terlalu besar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Tidak terautentikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Hewan peliharaan tidak ditemukan
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
router.put(
  '/:id/profile-image',
  uploadConfig.petProfile.single('profile_hewan'),
  handleMulterError,
  updatePetProfileImage
);

export default router;