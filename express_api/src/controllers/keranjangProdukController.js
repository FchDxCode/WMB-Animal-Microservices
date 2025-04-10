import KeranjangProduk from '../models/keranjangProdukModels.js';
import { Produk, GambarProduk } from '../models/produkModels.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

// Mendapatkan daftar produk di keranjang pengguna yang sedang login
export const getKeranjangProduk = async (req, res) => {
  try {
    const userId = req.user.id;

    // Mendapatkan semua item di keranjang pengguna
    const keranjangItems = await KeranjangProduk.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Produk,
          as: 'produk',
          attributes: ['id', 'nama_produk', 'harga_produk', 'diskon_produk', 'slug'],
          include: [
            {
              model: GambarProduk,
              as: 'gambar_produk',
              attributes: ['id', 'gambar'],
              limit: 1
            }
          ]
        }
      ]
    });

    // Menghitung total harga keranjang
    const totalHarga = keranjangItems.reduce(
      (total, item) => total + parseFloat(item.subtotal_harga),
      0
    );

    // Format response
    const formattedItems = keranjangItems.map(item => ({
      id: item.id,
      produk_id: item.produk_id,
      stok_produk_id: item.stok_produk_id,
      jumlah_dibeli: item.jumlah_dibeli,
      subtotal_harga: item.subtotal_harga,
      produk: {
        id: item.produk?.id,
        nama_produk: item.produk?.nama_produk,
        harga_produk: item.produk?.harga_produk,
        diskon_produk: item.produk?.diskon_produk,
        slug: item.produk?.slug,
        gambar: item.produk?.gambar_produk?.length > 0 ? item.produk.gambar_produk[0].gambar : null
      }
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        total_items: formattedItems.length,
        total_harga: totalHarga.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error mendapatkan keranjang produk:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data keranjang produk',
      error: error.message
    });
  }
};

// Mengubah jumlah produk di keranjang
export const updateKeranjangItem = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { jumlah_dibeli } = req.body;

    // Validasi input
    if (!jumlah_dibeli || jumlah_dibeli <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Jumlah dibeli harus lebih dari 0'
      });
    }

    // Cek apakah item keranjang ada dan milik pengguna yang sedang login
    const keranjangItem = await KeranjangProduk.findOne({
      where: {
        id,
        user_id: userId
      },
      transaction
    });

    if (!keranjangItem) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item keranjang tidak ditemukan'
      });
    }

    // Cek produk dan stok
    const produk = await Produk.findByPk(keranjangItem.produk_id);
    if (!produk) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Cek stok produk
    if (produk.stok_produk < jumlah_dibeli) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Stok produk tidak mencukupi'
      });
    }

    // Hitung harga setelah diskon (jika ada)
    const hargaDiskon = produk.diskon_produk 
      ? produk.harga_produk - produk.diskon_produk 
      : produk.harga_produk;
    
    // Update jumlah dan subtotal
    keranjangItem.jumlah_dibeli = parseInt(jumlah_dibeli);
    keranjangItem.subtotal_harga = hargaDiskon * keranjangItem.jumlah_dibeli;
    
    await keranjangItem.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Item keranjang berhasil diperbarui',
      data: {
        id: keranjangItem.id,
        produk_id: keranjangItem.produk_id,
        stok_produk_id: keranjangItem.stok_produk_id,
        jumlah_dibeli: keranjangItem.jumlah_dibeli,
        subtotal_harga: keranjangItem.subtotal_harga
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error mengubah item keranjang:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah item keranjang',
      error: error.message
    });
  }
};

// Menghapus produk dari keranjang
export const deleteKeranjangItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Cek apakah item keranjang ada dan milik pengguna yang sedang login
    const keranjangItem = await KeranjangProduk.findOne({
      where: {
        id,
        user_id: userId
      }
    });

    if (!keranjangItem) {
      return res.status(404).json({
        success: false,
        message: 'Item keranjang tidak ditemukan'
      });
    }

    // Hapus item dari keranjang
    await keranjangItem.destroy();

    return res.status(200).json({
      success: true,
      message: 'Item berhasil dihapus dari keranjang'
    });
  } catch (error) {
    console.error('Error menghapus item keranjang:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus item keranjang',
      error: error.message
    });
  }
};

// Menghapus beberapa produk dari keranjang (bulk delete)
export const bulkDeleteKeranjangItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_ids } = req.body;

    // Validasi input
    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Masukkan array item_ids yang valid'
      });
    }

    // Cek apakah semua item keranjang ada dan milik pengguna yang sedang login
    const keranjangItems = await KeranjangProduk.findAll({
      where: {
        id: {
          [Op.in]: item_ids
        },
        user_id: userId
      }
    });

    // Jika tidak semua item ditemukan, beri tahu pengguna
    if (keranjangItems.length !== item_ids.length) {
      // Temukan ID mana yang tidak valid atau bukan milik pengguna
      const foundIds = keranjangItems.map(item => item.id);
      const invalidIds = item_ids.filter(id => !foundIds.includes(parseInt(id)));

      return res.status(400).json({
        success: false,
        message: 'Beberapa item keranjang tidak ditemukan atau bukan milik Anda',
        data: {
          invalid_ids: invalidIds
        }
      });
    }

    // Hapus semua item yang dipilih dari keranjang
    const deletedCount = await KeranjangProduk.destroy({
      where: {
        id: {
          [Op.in]: item_ids
        },
        user_id: userId
      }
    });

    return res.status(200).json({
      success: true,
      message: `${deletedCount} item berhasil dihapus dari keranjang`,
      data: {
        deleted_count: deletedCount,
        deleted_ids: item_ids
      }
    });
  } catch (error) {
    console.error('Error menghapus beberapa item keranjang:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus beberapa item keranjang',
      error: error.message
    });
  }
};