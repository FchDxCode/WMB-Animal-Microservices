// controllers/checkout_produk/pembayaranProdukController.js
import { PembayaranProduk, CheckoutProduk, CheckoutItem } from '../../models/checkoutProdukModels.js';
import { Produk, GambarProduk } from '../../models/produkModels.js';
import { TotalCoinUser, CoinHistory } from '../../models/userCoinModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { uploadBuktiTransfer, createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import { reduceProductStock } from '../../utils/productStokManagerUtils.js';
import sequelize from '../../config/db.js';
import { Op } from 'sequelize';
import { StatusHistory, HistoryLayanan } from '../../models/historyModels.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';

/**
 * Mendapatkan detail pembayaran
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const getPaymentDetail = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    
    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Nomor invoice diperlukan'
      });
    }
    
    // Cari pembayaran berdasarkan invoice dengan include gambar produk
    const pembayaran = await PembayaranProduk.findOne({
      where: { invoice: invoiceNumber },
      include: [
        {
          model: CheckoutProduk,
          as: 'checkout',
          include: [
            {
              model: CheckoutItem,
              as: 'items',
              include: [
                {
                  model: Produk,
                  as: 'produk',
                  attributes: [
                    'id', 
                    'nama_produk', 
                    'harga_produk', 
                    'diskon_produk', 
                    'slug',
                    'berat_produk'
                  ],
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
            }
          ]
        },
        {
          model: ConfigPembayaran,
          as: 'config_pembayaran',
          attributes: ['no_rekening_admin', 'biaya_admin']
        }
      ]
    });
    
    if (!pembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan'
      });
    }
    
    // Cek apakah pembayaran sudah expired (lebih dari 24 jam)
    const createdAt = new Date(pembayaran.created_at);
    const now = new Date();
    const timeDiff = now - createdAt;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    let isExpired = false;
    if (hoursDiff > 24 && pembayaran.status === 'tertunda') {
      isExpired = true;
    }
    
    // Format response dengan URL gambar produk
    const formattedItems = pembayaran.checkout.items.map(item => {
      return {
        id: item.id,
        checkout_id: item.checkout_id,
        produk_id: item.produk_id,
        jumlah: item.jumlah,
        harga_satuan: item.harga_satuan,
        subtotal: item.subtotal,
        produk: {
          id: item.produk.id,
          nama_produk: item.produk.nama_produk,
          harga_produk: item.produk.harga_produk,
          diskon_produk: item.produk.diskon_produk,
          slug: item.produk.slug,
          berat_produk: item.produk.berat_produk,
          gambar: item.produk.gambar_produk && item.produk.gambar_produk.length > 0 
            ? createImageUrl(item.produk.gambar_produk[0].gambar, uploadFolders.productImages)
            : null
        }
      };
    });
    
    // Buat response dengan format yang lebih baik
    const formattedResponse = {
      id: pembayaran.id,
      checkout_id: pembayaran.checkout_id,
      user_id: pembayaran.user_id,
      invoice: pembayaran.invoice,
      status: pembayaran.status,
      metode_pembayaran: pembayaran.metode_pembayaran,
      bank_tujuan: pembayaran.bank_tujuan,
      jumlah_bayar: pembayaran.jumlah_bayar,
      coin_digunakan: pembayaran.coin_digunakan,
      bukti_bayar: pembayaran.bukti_bayar,
      created_at: pembayaran.created_at,
      updated_at: pembayaran.updated_at,
      checkout: {
        id: pembayaran.checkout.id,
        user_id: pembayaran.checkout.user_id,
        alamat_id: pembayaran.checkout.alamat_id,
        ekspedisi_id: pembayaran.checkout.ekspedisi_id,
        ongkir: pembayaran.checkout.ongkir,
        total_harga: pembayaran.checkout.total_harga,
        created_at: pembayaran.checkout.created_at,
        updated_at: pembayaran.checkout.updated_at,
        items: formattedItems
      },
      config_pembayaran: pembayaran.config_pembayaran,
      isExpired
    };
    
    return res.status(200).json({
      success: true,
      data: formattedResponse
    });
  } catch (error) {
    console.error('Error getting payment detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail pembayaran',
      error: error.message
    });
  }
};

/**
 * Upload bukti pembayaran
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const buktiTransfer = req.file;
    
    if (!buktiTransfer) {
      return res.status(400).json({
        success: false,
        message: 'Bukti pembayaran harus diunggah'
      });
    }
    
    const pembayaran = await PembayaranProduk.findByPk(id);
    
    if (!pembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan'
      });
    }
    
    if (pembayaran.status !== 'tertunda') {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran tidak dalam status tertunda'
      });
    }
    
    // Cek apakah pembayaran sudah expired (lebih dari 24 jam)
    const createdAt = new Date(pembayaran.created_at);
    const now = new Date();
    const timeDiff = now - createdAt;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran sudah melewati batas waktu 24 jam'
      });
    }
    
    // Update data pembayaran dengan bukti transfer
    const buktiTransferUrl = createBuktiTransferUrl(buktiTransfer.filename);
    
    await pembayaran.update({
      bukti_pembayaran: buktiTransferUrl
    });
    
    return res.status(200).json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah',
      data: {
        pembayaran_id: pembayaran.id,
        bukti_pembayaran: buktiTransferUrl
      }
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengunggah bukti pembayaran',
      error: error.message
    });
  }
};

/**
 * Update status pembayaran (untuk Admin)
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const updatePaymentStatus = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, kategori_status_history_id } = req.body;
    
    // Validasi status jika disediakan
    if (status && !['selesai', 'dibatalkan'].includes(status)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status harus berupa "selesai" atau "dibatalkan"'
      });
    }
    
    const pembayaran = await PembayaranProduk.findByPk(id, {
      include: [
        {
          model: CheckoutProduk,
          as: 'checkout',
          include: [
            {
              model: CheckoutItem,
              as: 'items'
            }
          ]
        }
      ],
      transaction: t
    });
    
    if (!pembayaran) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan'
      });
    }
    
    // Ambil status history berdasarkan ID
    const statusHistory = await StatusHistory.findByPk(kategori_status_history_id, { transaction: t });
    
    if (!statusHistory) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan'
      });
    }
    
    // Case 1: Jika status sudah "selesai" dan hanya ingin update kategori_status_history_id
    if (pembayaran.status === 'selesai' && (!status || status === 'selesai')) {
      await pembayaran.update({
        kategori_status_history_id: kategori_status_history_id
      }, { transaction: t });
      
      // Update status di history_layanan
      await updateHistoryLayanan(pembayaran.id, kategori_status_history_id, pembayaran.checkout.user_id, t);
      
      await t.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Kategori status history berhasil diperbarui',
        data: {
          pembayaran_id: pembayaran.id,
          status: pembayaran.status,
          kategori_status_history_id: kategori_status_history_id,
          status_history_slug: statusHistory.slug
        }
      });
    }
    
    // Case 2: Mencoba mengubah status yang sudah "selesai" menjadi status lain
    if (pembayaran.status === 'selesai' && status === 'dibatalkan') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status pembayaran yang sudah "selesai" tidak dapat diubah menjadi "dibatalkan"'
      });
    }
    
    // Case 3: Jika status "dibatalkan" dan ingin update kategori_status_history_id
    if (pembayaran.status === 'dibatalkan' && (!status || status === 'dibatalkan')) {
      await pembayaran.update({
        kategori_status_history_id: kategori_status_history_id
      }, { transaction: t });
      
      // Update status di history_layanan
      await updateHistoryLayanan(pembayaran.id, kategori_status_history_id, pembayaran.checkout.user_id, t);
      
      await t.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Kategori status history berhasil diperbarui',
        data: {
          pembayaran_id: pembayaran.id,
          status: pembayaran.status,
          kategori_status_history_id: kategori_status_history_id,
          status_history_slug: statusHistory.slug
        }
      });
    }
    
    // Case 4: Status "tertunda" yang ingin diubah ke status lain
    if (pembayaran.status === 'tertunda') {
      // Jika status menjadi "selesai"
      if (status === 'selesai') {
        // Ambil konfigurasi pembayaran untuk persentase coin
        const configPembayaran = await ConfigPembayaran.findByPk(pembayaran.config_pembayaran_id, { transaction: t });
        
        if (!configPembayaran) {
          await t.rollback();
          return res.status(404).json({
            success: false,
            message: 'Konfigurasi pembayaran tidak ditemukan'
          });
        }
        
        // Hitung coin yang akan didapat
        const subtotalProduk = pembayaran.checkout.subtotal_produk;
        const coinDidapat = calculateCoin(subtotalProduk, configPembayaran.persentase_coin);
        
        console.log('Debug Coin Calculation:', {
          subtotalProduk,
          persentaseCoin: configPembayaran.persentase_coin,
          calculatedCoin: coinDidapat
        });
        
        // Update status pembayaran dan tambahkan coin didapat
        await pembayaran.update({
          status: status,
          kategori_status_history_id: kategori_status_history_id,
          koin_didapat: coinDidapat
        }, { transaction: t });
        
        // Update status di history_layanan
        await updateHistoryLayanan(pembayaran.id, kategori_status_history_id, pembayaran.checkout.user_id, t);
        
        // Tambahkan coin ke akun pengguna
        const userId = pembayaran.checkout.user_id;
        
        // Cari atau buat total coin user
        let totalCoinUser = await TotalCoinUser.findOne({
          where: { user_id: userId },
          transaction: t
        });
        
        if (totalCoinUser) {
          await totalCoinUser.update({
            total_coin: sequelize.literal(`total_coin + ${coinDidapat}`)
          }, { transaction: t });
        } else {
          await TotalCoinUser.create({
            user_id: userId,
            total_coin: coinDidapat
          }, { transaction: t });
        }
        
        // Tambahkan record coin history untuk coin yang didapat
        await CoinHistory.create({
          user_id: userId,
          pembayaran_produk_id: pembayaran.id,
          coin_di_dapat: coinDidapat,
          tanggal_diperoleh: new Date()
        }, { transaction: t });
        
        // Jika ada coin yang digunakan saat checkout, sekarang catat penggunaannya
        const coinDigunakan = pembayaran.checkout.koin_digunakan;
        if (coinDigunakan > 0) {
          await CoinHistory.create({
            user_id: userId,
            pembayaran_produk_id: pembayaran.id,
            coin_di_gunakan: coinDigunakan,
            tanggal_digunakan: new Date()
          }, { transaction: t });
          
          console.log('Pencatatan penggunaan coin:', {
            userId,
            coinDigunakan,
            pembayaranId: pembayaran.id
          });
        }
        
        // Kurangi stok produk
        const checkoutItems = pembayaran.checkout.items;
        for (const item of checkoutItems) {
          const produk = await Produk.findByPk(item.produk_id, { transaction: t });
          
          if (produk) {
            await produk.update({
              stok_produk: Math.max(0, produk.stok_produk - item.jumlah)
            }, { transaction: t });
          }
        }
        
        console.log('Coin berhasil ditambahkan:', {
          userId,
          coinDidapat,
          pembayaranId: pembayaran.id
        });
      } 
      // Jika status menjadi "dibatalkan"
      else if (status === 'dibatalkan') {
        // Update status pembayaran
        await pembayaran.update({
          status: status,
          kategori_status_history_id: kategori_status_history_id,
          koin_didapat: 0
        }, { transaction: t });
        
        // Update status di history_layanan
        await updateHistoryLayanan(pembayaran.id, kategori_status_history_id, pembayaran.checkout.user_id, t);
        
        // Kembalikan coin yang digunakan ke akun pengguna
        const coinDigunakan = Number(pembayaran.checkout.koin_digunakan) || 0;
        
        if (coinDigunakan > 0) {
          const userId = pembayaran.checkout.user_id;
          
          const totalCoinUser = await TotalCoinUser.findOne({
            where: { user_id: userId },
            transaction: t
          });
          
          if (totalCoinUser) {
            await totalCoinUser.update({
              total_coin: sequelize.literal(`total_coin + ${coinDigunakan}`)
            }, { transaction: t });
            
            console.log('Coin dikembalikan karena pembatalan:', {
              userId,
              coinDigunakan,
              pembayaranId: pembayaran.id
            });
          }
        }
      }
    }
    
    await t.commit();
    
    return res.status(200).json({
      success: true,
      message: status ? `Status pembayaran berhasil diubah menjadi ${status}` : 'Kategori status history berhasil diperbarui',
      data: {
        pembayaran_id: pembayaran.id,
        status: pembayaran.status,
        kategori_status_history_id: kategori_status_history_id,
        status_history_slug: statusHistory.slug,
        koin_didapat: pembayaran.koin_didapat
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate status pembayaran',
      error: error.message
    });
  }
};

/**
 * Helper function untuk update atau buat record HistoryLayanan
 * @param {number} pembayaranId - ID Pembayaran
 * @param {number} statusHistoryId - ID Status History
 * @param {number} userId - ID User
 * @param {object} transaction - Transaction Sequelize
 */
async function updateHistoryLayanan(pembayaranId, statusHistoryId, userId, transaction) {
  // Cek apakah sudah ada record di history_layanan
  const historyLayanan = await HistoryLayanan.findOne({
    where: { pembayaran_produk_id: pembayaranId },
    transaction
  });

  if (historyLayanan) {
    // Update record yang sudah ada
    await historyLayanan.update({
      status_history_id: statusHistoryId,
      updated_at: new Date()
    }, { transaction });
  } else {
    // Buat record baru jika belum ada
    await HistoryLayanan.create({
      pembayaran_produk_id: pembayaranId,
      status_history_id: statusHistoryId,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
  }
}