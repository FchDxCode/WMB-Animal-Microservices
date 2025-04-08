import { PembayaranProduk, CheckoutProduk, EkspedisiData } from '../models/checkoutProdukModels.js';
import { CoinHistory, TotalCoinUser } from '../models/userCoinModels.js';
import { AlamatUser, Provinsi, KabupatenKota, Kecamatan } from '../models/alamatUserModels.js';
import { ConfigPembayaran } from '../models/configPembayaranModels.js';
import { Produk, GambarProduk } from '../models/produkModels.js';
import { CheckoutItem } from '../models/checkoutItemModels.js';
import { User } from '../models/userModels.js';
import sequelize from '../config/db.js';
import path from 'path';
import multer from 'multer';
import fs from 'fs';

// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/bukti_pembayaran';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Izinkan hanya gambar
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batasi ukuran file 5MB
  },
  fileFilter: fileFilter
});

// Get detail pembayaran
export const getDetailPembayaran = async (req, res) => {
  try {
    const { invoice } = req.params;
    const userId = req.user.id;
    
    // Cari pembayaran berdasarkan invoice
    const pembayaran = await PembayaranProduk.findOne({
      where: { invoice },
      include: [
        {
          model: CheckoutProduk,
          as: 'checkout',
          where: { user_id: userId },
          include: [
            {
              model: AlamatUser,
              as: 'alamat',
              include: [
                { model: Provinsi, as: 'provinsi' },
                { model: KabupatenKota, as: 'kabupatenKota' },
                { model: Kecamatan, as: 'kecamatan' }
              ]
            },
            {
              model: EkspedisiData,
              as: 'ekspedisi'
            },
            {
              model: ConfigPembayaran,
              as: 'config_pembayaran'
            }
          ]
        }
      ]
    });
    
    if (!pembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }
    
    // Ambil detail produk di checkout
    const checkoutItems = await CheckoutItem.findAll({
      where: { checkout_produk_id: pembayaran.checkout.id },
      include: [
        {
          model: Produk,
          as: 'produk',
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
    
    // Format data untuk response
    const formattedItems = checkoutItems.map(item => ({
      id: item.id,
      produk_id: item.produk_id,
      nama_produk: item.produk.nama_produk,
      harga_satuan: item.harga_satuan,
      diskon_satuan: item.diskon_satuan,
      jumlah: item.jumlah,
      subtotal: item.subtotal,
      gambar: item.produk.gambar_produk.length > 0 
        ? item.produk.gambar_produk[0].gambar 
        : null
    }));
    
    // Hitung perkiraan koin yang akan didapat
    const persentaseCoin = parseFloat(pembayaran.checkout.config_pembayaran.persentase_coin) / 100;
    const koinDidapat = Math.floor(pembayaran.checkout.subtotal_produk * persentaseCoin);
    
    const response = {
      success: true,
      data: {
        pembayaran: {
          id: pembayaran.id,
          invoice: pembayaran.invoice,
          status: pembayaran.status,
          bukti_pembayaran: pembayaran.bukti_pembayaran,
          created_at: pembayaran.created_at
        },
        checkout: {
          id: pembayaran.checkout.id,
          metode_pembayaran: pembayaran.checkout.metode_pembayaran,
          subtotal_produk: pembayaran.checkout.subtotal_produk,
          total_pesanan: pembayaran.checkout.total_pesanan,
          koin_digunakan: pembayaran.checkout.koin_digunakan,
          tanggal_checkout: pembayaran.checkout.tanggal_checkout_produk
        },
        alamat: {
          nama_lengkap: pembayaran.checkout.alamat.nama_lengkap,
          no_tlpn: pembayaran.checkout.alamat.no_tlpn,
          provinsi: pembayaran.checkout.alamat.provinsi.provinsi,
          kabupaten_kota: pembayaran.checkout.alamat.kabupatenKota.nama_kabupaten_kota,
          kecamatan: pembayaran.checkout.alamat.kecamatan.nama_kecamatan,
          kode_pos: pembayaran.checkout.alamat.kode_pos,
          detail_alamat: pembayaran.checkout.alamat.detail_alamat
        },
        ekspedisi: {
          nama_ekspedisi: pembayaran.checkout.ekspedisi.nama_ekspedisi,
          ongkir: pembayaran.checkout.ekspedisi.ongkir
        },
        config_pembayaran: {
          biaya_admin: pembayaran.checkout.config_pembayaran.biaya_admin,
          no_rekening_admin: pembayaran.checkout.config_pembayaran.no_rekening_admin
        },
        produk_items: formattedItems,
        ringkasan_pesanan: {
          subtotal_produk: pembayaran.checkout.subtotal_produk,
          ongkir: pembayaran.checkout.ekspedisi.ongkir,
          biaya_admin: pembayaran.checkout.config_pembayaran.biaya_admin,
          koin_digunakan: pembayaran.checkout.koin_digunakan,
          total_pesanan: pembayaran.checkout.total_pesanan,
          koin_akan_didapat: koinDidapat
        }
      }
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error mendapatkan detail pembayaran:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail pembayaran',
      error: error.message
    });
  }
};

// Upload bukti pembayaran
export const uploadBuktiPembayaran = async (req, res) => {
  try {
    const { pembayaran_id } = req.params;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Bukti pembayaran harus diunggah'
      });
    }
    
    // Cek pembayaran
    const pembayaran = await PembayaranProduk.findOne({
      where: { id: pembayaran_id },
      include: [
        {
          model: CheckoutProduk,
          as: 'checkout',
          where: { user_id: userId }
        }
      ]
    });
    
    if (!pembayaran) {
      // Hapus file yang sudah diupload
      fs.unlinkSync(req.file.path);
      
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan atau bukan milik Anda'
      });
    }
    
    if (pembayaran.status !== 'tertunda') {
      // Hapus file yang sudah diupload
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: 'Pembayaran sudah diproses, tidak dapat mengunggah bukti pembayaran'
      });
    }
    
    // Hapus bukti pembayaran lama jika ada
    if (pembayaran.bukti_pembayaran) {
      const oldFilePath = path.join('./uploads/bukti_pembayaran', path.basename(pembayaran.bukti_pembayaran));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Update pembayaran dengan bukti pembayaran baru
    await pembayaran.update({
      bukti_pembayaran: req.file.filename,
      kategori_status_history_id: 2 // Asumsi 2 adalah status "Menunggu Verifikasi"
    });
    
    return res.status(200).json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah',
      data: {
        pembayaran_id: pembayaran.id,
        invoice: pembayaran.invoice,
        bukti_pembayaran: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error upload bukti pembayaran:', error);
    
    // Hapus file jika terjadi error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengunggah bukti pembayaran',
      error: error.message
    });
  }
};

// Verifikasi pembayaran (untuk admin)
export const verifikasiPembayaran = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { pembayaran_id } = req.params;
    const { status, kategori_status_history_id } = req.body;
    
    // Cek permission (hanya admin yang bisa)
    if (req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Tidak memiliki izin untuk melakukan verifikasi pembayaran'
      });
    }
    
    // Validasi input
    if (!status || !['selesai', 'dibatalkan'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }
    
    if (!kategori_status_history_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kategori status history harus diisi'
      });
    }
    
    // Cek pembayaran
    const pembayaran = await PembayaranProduk.findOne({
      where: { id: pembayaran_id },
      include: [
        {
          model: CheckoutProduk,
          as: 'checkout'
        }
      ],
      transaction
    });
    
    if (!pembayaran) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }
    
    if (pembayaran.status !== 'tertunda') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Pembayaran sudah diverifikasi sebelumnya'
      });
    }
    
    // Update status pembayaran
    await pembayaran.update({
      status,
      kategori_status_history_id
    }, { transaction });
    
    const userId = pembayaran.checkout.user_id;
    
    // Jika status selesai, proses coin
    if (status === 'selesai') {
      // Hitung koin yang didapat
      const configPembayaran = await ConfigPembayaran.findByPk(pembayaran.config_pembayaran_id, { transaction });
      const persentaseCoin = parseFloat(configPembayaran.persentase_coin) / 100;
      const koinDidapat = Math.floor(pembayaran.checkout.subtotal_produk * persentaseCoin);
      
      // Update pembayaran dengan koin yang didapat
      await pembayaran.update({
        koin_didapat: koinDidapat
      }, { transaction });
      
      // Tambahkan koin yang didapat
      if (koinDidapat > 0) {
        await CoinHistory.create({
          user_id: userId,
          pembayaran_produk_id: pembayaran.id,
          coin_di_dapat: koinDidapat,
          tanggal_diperoleh: new Date()
        }, { transaction });
        
        // Update total koin user
        let userCoin = await TotalCoinUser.findOne({
          where: { user_id: userId },
          transaction
        });
        
        if (userCoin) {
          await userCoin.update({
            total_coin: sequelize.literal(`total_coin + ${koinDidapat}`)
          }, { transaction });
        } else {
          await TotalCoinUser.create({
            user_id: userId,
            total_coin: koinDidapat
          }, { transaction });
        }
      }
      
      // Gunakan koin yang direservasi
      const koinDigunakan = parseFloat(pembayaran.checkout.koin_digunakan);
      if (koinDigunakan > 0) {
        // Cari coin history yang direservasi
        const coinHistory = await CoinHistory.findOne({
          where: {
            pembayaran_produk_id: pembayaran.id,
            user_id: userId,
            status_coin: 'reserved'
          },
          transaction
        });
        
        if (coinHistory) {
          // Update status coin menjadi used
          await coinHistory.update({
            status_coin: 'used'
          }, { transaction });
          
          // Kurangi total koin user
          let userCoin = await TotalCoinUser.findOne({
            where: { user_id: userId },
            transaction
          });
          
          if (userCoin) {
            await userCoin.update({
              total_coin: sequelize.literal(`total_coin - ${koinDigunakan}`)
            }, { transaction });
          }
        }
      }
    } else if (status === 'dibatalkan') {
      // Jika dibatalkan, kembalikan stok produk
      const checkoutItems = await CheckoutItem.findAll({
        where: { checkout_produk_id: pembayaran.checkout.id },
        transaction
      });
      
      for (const item of checkoutItems) {
        await Produk.update(
          { stok_produk: sequelize.literal(`stok_produk + ${item.jumlah}`) },
          { 
            where: { id: item.produk_id },
            transaction
          }
        );
      }
      
      // Hapus reservasi koin jika ada
      await CoinHistory.destroy({
        where: {
          pembayaran_produk_id: pembayaran.id,
          user_id: userId,
          status_coin: 'reserved'
        },
        transaction
      });
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: `Pembayaran berhasil diverifikasi dengan status "${status}"`,
      data: {
        pembayaran_id: pembayaran.id,
        invoice: pembayaran.invoice,
        status: pembayaran.status,
        kategori_status_history_id: pembayaran.kategori_status_history_id,
        koin_didapat: status === 'selesai' ? pembayaran.koin_didapat : 0
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error verifikasi pembayaran:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat verifikasi pembayaran',
      error: error.message
    });
  }
};

// Daftar pembayaran user
export const getUserPembayaran = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Buat where condition berdasarkan status jika ada
    const whereCondition = status ? { status } : {};
    
    // Cari pembayaran user
    const pembayaran = await PembayaranProduk.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: CheckoutProduk,
          as: 'checkout',
          where: { user_id: userId },
          include: [
            {
              model: EkspedisiData,
              as: 'ekspedisi'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    
    // Ambil checkout items untuk setiap pembayaran
    const pembayaranList = await Promise.all(pembayaran.rows.map(async (item) => {
      const checkoutItems = await CheckoutItem.findAll({
        where: { checkout_produk_id: item.checkout.id },
        include: [
          {
            model: Produk,
            as: 'produk',
            include: [
              {
                model: GambarProduk,
                as: 'gambar_produk',
                attributes: ['id', 'gambar'],
                limit: 1
              }
            ]
          }
        ],
        limit: 1 // Ambil 1 item saja untuk preview
      });
      
      const totalItems = await CheckoutItem.count({
        where: { checkout_produk_id: item.checkout.id }
      });
      
      return {
        id: item.id,
        invoice: item.invoice,
        status: item.status,
        tanggal_pembelian: item.created_at,
        total_pesanan: item.checkout.total_pesanan,
        metode_pembayaran: item.checkout.metode_pembayaran,
        ekspedisi: item.checkout.ekspedisi.nama_ekspedisi,
        bukti_pembayaran: item.bukti_pembayaran,
        koin_didapat: item.koin_didapat,
        preview_item: checkoutItems.length > 0 ? {
          nama_produk: checkoutItems[0].produk.nama_produk,
          jumlah: checkoutItems[0].jumlah,
          gambar: checkoutItems[0].produk.gambar_produk.length > 0 
            ? checkoutItems[0].produk.gambar_produk[0].gambar 
            : null,
          total_items: totalItems,
          more_items: totalItems > 1
        } : null
      };
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        pembayaran: pembayaranList,
        pagination: {
          total_items: pembayaran.count,
          total_pages: Math.ceil(pembayaran.count / limit),
          current_page: page,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Error mendapatkan daftar pembayaran user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar pembayaran',
      error: error.message
    });
  }
};