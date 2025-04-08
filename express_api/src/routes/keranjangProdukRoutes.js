import express from 'express';
import { 
  getKeranjangProduk,
//   addToKeranjang,
  updateKeranjangItem,
  deleteKeranjangItem,
  bulkDeleteKeranjangItems
} from '../controllers/keranjangProdukController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/keranjang:
 *   get:
 *     tags:
 *       - Keranjang
 *     summary: Mendapatkan daftar produk di keranjang pengguna
 *     description: Endpoint ini akan mengembalikan daftar produk yang ada di keranjang belanja pengguna yang sedang login
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar produk di keranjang
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           produk_id:
 *                             type: integer
 *                             example: 5
 *                           stok_produk_id:
 *                             type: integer
 *                             example: 2
 *                           jumlah_dibeli:
 *                             type: integer
 *                             example: 2
 *                           subtotal_harga:
 *                             type: number
 *                             example: 360000
 *                           produk:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 5
 *                               nama_produk:
 *                                 type: string
 *                                 example: "Kemeja Formal"
 *                               harga_produk:
 *                                 type: number
 *                                 example: 180000
 *                               diskon_produk:
 *                                 type: number
 *                                 example: 0
 *                               slug:
 *                                 type: string
 *                                 example: "kemeja-formal"
 *                               gambar:
 *                                 type: string
 *                                 example: "uploads/products/kemeja-1.jpg"
 *                     total_items:
 *                       type: integer
 *                       example: 2
 *                     total_harga:
 *                       type: string
 *                       example: "500000.00"
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/', authMiddleware, getKeranjangProduk);

/**
 * @openapi
 * /api/keranjang/{id}:
 *   put:
 *     tags:
 *       - Keranjang
 *     summary: Mengubah jumlah produk di keranjang
 *     description: Endpoint ini akan mengubah jumlah produk yang ada di keranjang belanja pengguna yang sedang login
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID item keranjang
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jumlah_dibeli
 *             properties:
 *               jumlah_dibeli:
 *                 type: integer
 *                 description: Jumlah produk yang akan dibeli
 *                 example: 3
 *     responses:
 *       200:
 *         description: Item keranjang berhasil diperbarui
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
 *                   example: "Item keranjang berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     produk_id:
 *                       type: integer
 *                       example: 5
 *                     stok_produk_id:
 *                       type: integer
 *                       example: 2
 *                     jumlah_dibeli:
 *                       type: integer
 *                       example: 3
 *                     subtotal_harga:
 *                       type: number
 *                       example: 540000
 *       400:
 *         description: Data yang diberikan tidak valid
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Item keranjang tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.put('/:id', authMiddleware, updateKeranjangItem);

/**
 * @openapi
 * /api/keranjang/{id}:
 *   delete:
 *     tags:
 *       - Keranjang
 *     summary: Menghapus produk dari keranjang
 *     description: Endpoint ini akan menghapus produk dari keranjang belanja pengguna yang sedang login
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID item keranjang
 *     responses:
 *       200:
 *         description: Item berhasil dihapus dari keranjang
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
 *                   example: "Item berhasil dihapus dari keranjang"
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Item keranjang tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.delete('/:id', authMiddleware, deleteKeranjangItem);

/**
 * @openapi
 * /api/keranjang/bulk-delete:
 *   post:
 *     tags:
 *       - Keranjang
 *     summary: Menghapus beberapa produk dari keranjang sekaligus
 *     description: Endpoint ini akan menghapus beberapa produk sekaligus dari keranjang belanja pengguna yang sedang login
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_ids
 *             properties:
 *               item_ids:
 *                 type: array
 *                 description: Array berisi ID item keranjang yang akan dihapus
 *                 example: [1, 2, 3]
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Item-item berhasil dihapus dari keranjang
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
 *                   example: "3 item berhasil dihapus dari keranjang"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *                       example: 3
 *                     deleted_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [1, 2, 3]
 *       400:
 *         description: Data yang diberikan tidak valid atau beberapa item tidak ditemukan
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
 *                   example: "Beberapa item keranjang tidak ditemukan atau bukan milik Anda"
 *                 data:
 *                   type: object
 *                   properties:
 *                     invalid_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [4, 5]
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post('/bulk-delete', authMiddleware, bulkDeleteKeranjangItems);

export default router;