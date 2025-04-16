// src/controllers/booking_pethotel/pembayaranPetHotelController.js
import { PembayaranPetHotel, CheckoutPetHotel } from '../../models/bookingPetHotelModels.js';
import { Payment, ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { CoinHistory, TotalCoinUser } from '../../models/userCoinModels.js';
import { StatusHistory, HistoryLayanan } from '../../models/historyModels.js';
import { createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';
import sequelize from '../../config/db.js';

export const uploadBuktiPembayaran = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const buktiTransfer = req.file;

    if (!buktiTransfer) {
      return res.status(400).json({
        status: false,
        message: "Bukti transfer wajib diunggah"
      });
    }

    // Cari data pembayaran
    const pembayaran = await PembayaranPetHotel.findOne({
      where: { checkout_pet_hotel_id: id }
    });

    if (!pembayaran) {
      return res.status(404).json({
        status: false,
        message: "Data pembayaran tidak ditemukan"
      });
    }

    // Cek expired time (24 jam)
    const checkoutTime = new Date(pembayaran.created_at);
    const now = new Date();
    const diffHours = Math.abs(now - checkoutTime) / 36e5;

    if (diffHours > 24) {
      return res.status(400).json({
        status: false,
        message: "Pembayaran telah expired (lebih dari 24 jam)"
      });
    }

    // Dapatkan URL bukti transfer menggunakan utilitas yang ada
    // Perhatikan: kita menggunakan nama file dari req.file, bukan file path
    const buktiTransferUrl = createBuktiTransferUrl(buktiTransfer.filename);

    // Cari status history untuk status "diproses"
    const statusHistory = await StatusHistory.findOne({
      where: {
        slug: 'diproses'
      }
    });

    if (!statusHistory) {
      await t.rollback();
      return res.status(404).json({
        status: false,
        message: "Status history tidak ditemukan"
      });
    }

    // Update pembayaran - gunakan bukti_pembayaran bukan bukti_transfer
    await pembayaran.update({
      bukti_pembayaran: buktiTransferUrl, // Ganti field name sesuai model
      status: 'diproses',
      kategori_status_history_id: statusHistory.id,
      updated_at: new Date()
    }, { transaction: t });

    // Tambah ke history layanan
    await HistoryLayanan.create({
      pembayaran_pet_hotel_id: pembayaran.id,
      status_history_id: statusHistory.id,
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction: t });

    await t.commit();
    return res.status(200).json({
      status: true,
      message: "Bukti pembayaran berhasil diunggah",
      data: {
        id: pembayaran.id,
        checkout_pet_hotel_id: pembayaran.checkout_pet_hotel_id,
        status: pembayaran.status,
        bukti_pembayaran: buktiTransferUrl,
        updated_at: pembayaran.updated_at
      }
    });
  } catch (error) {
    await t.rollback();
    console.error("Error in uploadBuktiPembayaran:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};

export const verifyPembayaran = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, kategori_status_history_id } = req.body;

    // Validasi input
    if (!status || !['belum-bayar', 'diproses', 'selesai', 'tertunda', 'dibatalkan'].includes(status)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status pembayaran tidak valid'
      });
    }

    // Cari data pembayaran dengan relasi checkout
    const pembayaran = await PembayaranPetHotel.findOne({
      where: { checkout_pet_hotel_id: id },
      include: [{ 
        model: CheckoutPetHotel, 
        as: 'checkout',
        include: [{ 
          model: Payment, 
          as: 'payment',
          attributes: ['nama_metode', 'slug']
        }]
      }],
      transaction: t
    });

    if (!pembayaran) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Data pembayaran tidak ditemukan"
      });
    }

    // Cari status history
    const statusHistory = await StatusHistory.findByPk(kategori_status_history_id, {
      attributes: ['id', 'nama', 'slug'],
      transaction: t
    });

    if (!statusHistory) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Status history tidak ditemukan"
      });
    }

    // Simpan status sebelumnya untuk pengecekan coin
    const previousStatus = pembayaran.status;

    // Update status pembayaran
    await pembayaran.update({
      status,
      kategori_status_history_id
    }, { transaction: t });

    // Tambah ke history layanan
    await HistoryLayanan.create({
      pembayaran_pet_hotel_id: pembayaran.id,
      status_history_id: statusHistory.id,
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction: t });

    // Proses pemberian coin jika status berubah menjadi selesai
    // dan sebelumnya bukan status selesai (mencegah pemberian coin duplikat)
    let coinInfo = null;
    if (status === 'selesai' && previousStatus !== 'selesai') {
      const config = await ConfigPembayaran.findOne({ transaction: t });
      const totalHarga = parseFloat(pembayaran.checkout.total_harga);
      const persentaseCoin = parseFloat(config.persentase_coin);
      const coinDidapat = Math.floor(totalHarga * (persentaseCoin / 100));

      // Update coin di pembayaran
      await pembayaran.update({
        koin_didapat: coinDidapat
      }, { transaction: t });

      // Tambah coin history dengan field yang benar
      await CoinHistory.create({
        pembayaran_pet_hotel_id: pembayaran.id,
        user_id: pembayaran.checkout.user_id,
        coin_di_dapat: coinDidapat,
        coin_di_gunakan: 0,
        tanggal_diperoleh: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction: t });

      // Update total coin user
      const totalCoinUser = await TotalCoinUser.findOne({
        where: { user_id: pembayaran.checkout.user_id },
        transaction: t
      });

      if (totalCoinUser) {
        await totalCoinUser.increment('total_coin', {
          by: coinDidapat,
          transaction: t
        });
      } else {
        await TotalCoinUser.create({
          user_id: pembayaran.checkout.user_id,
          total_coin: coinDidapat,
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction: t });
      }

      // Update history layanan dengan pembayaran_pet_hotel_id
      await HistoryLayanan.create({
        pembayaran_pet_hotel_id: pembayaran.id,
        status_history_id: statusHistory.id,
        user_id: req.user.id,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction: t });

      coinInfo = {
        jumlah_coin: coinDidapat,
        keterangan: `Coin dari transaksi Pet Hotel ${pembayaran.checkout.invoice}`,
        tanggal_diperoleh: new Date()
      };
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `Status pembayaran berhasil diupdate menjadi ${status}`,
      data: {
        id: pembayaran.id,
        checkout_id: pembayaran.checkout_pet_hotel_id,
        invoice: pembayaran.checkout.invoice,
        status: pembayaran.status,
        payment_method: pembayaran.checkout.payment ? {
          nama: pembayaran.checkout.payment.nama_metode,
          slug: pembayaran.checkout.payment.slug
        } : null,
        status_history: {
          id: statusHistory.id,
          nama: statusHistory.nama,
          slug: statusHistory.slug
        },
        total_harga: pembayaran.checkout.total_harga,
        coin_info: coinInfo,
        created_at: pembayaran.created_at,
        updated_at: pembayaran.updated_at
      }
    });

  } catch (error) {
    await t.rollback();
    console.error("Error in verifyPembayaran:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};

// src/controllers/booking_pethotel/pembayaranPetHotelController.js

export const getPembayaranDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const pembayaran = await PembayaranPetHotel.findOne({
      where: { checkout_pet_hotel_id: id },
      include: [{
        model: CheckoutPetHotel,
        as: 'checkout',
        include: [{
          model: Payment,
          as: 'payment',
          attributes: ['nama_metode', 'gambar_payment']
        }]
      }],
      attributes: ['id', 'checkout_pet_hotel_id', 'status', 'kategori_status_history_id', 'koin_didapat', 'created_at', 'updated_at']  // Specify exact columns
    });

    if (!pembayaran) {
      return res.status(404).json({
        status: false,
        message: "Data pembayaran tidak ditemukan"
      });
    }

    // Hitung expired time
    const checkoutTime = new Date(pembayaran.checkout.created_at);
    const expiredTime = new Date(checkoutTime.getTime() + (24 * 60 * 60 * 1000));

    const detailPembayaran = {
      metode_pembayaran: pembayaran.checkout?.payment || null,
      no_invoice: pembayaran.checkout?.invoice,
      total_harga: pembayaran.checkout?.total_harga,
      status: pembayaran.status,
      expired_at: expiredTime,
      bukti_transfer: pembayaran.bukti_pembayaran
    };

    return res.status(200).json({
      status: true,
      message: "Berhasil mengambil detail pembayaran",
      data: detailPembayaran
    });
  } catch (error) {
    console.error("Error in getPembayaranDetail:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};