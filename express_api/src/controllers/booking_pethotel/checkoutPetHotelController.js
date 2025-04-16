import { CheckoutPetHotel, CheckoutPetHotelDetail, TipeHotel } from '../../models/bookingPetHotelModels.js';
import { ConfigPembayaran, Payment } from '../../models/configPembayaranModels.js';
import { generateInvoiceNumber } from '../../utils/invoiceGeneratorUtils.js';
import sequelize from '../../config/db.js';
import { createImageUrl } from '../../utils/uploadUtils.js';
import { PembayaranPetHotel } from '../../models/bookingPetHotelModels.js';
import { StatusHistory, HistoryLayanan } from '../../models/historyModels.js';

export const createCheckout = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      klinik_id,
      tipe_booking_pet_hotel,
      tanggal_check_in,
      tanggal_check_out,
      waktu_kedatangan,
      waktu_penjemputan,
      alamat_id,
      detail_booking
    } = req.body;
    
    // Ambil user_id dari auth middleware
    const user_id = req.user.id;
    
    // Validasi input dasar
    if (!klinik_id || !tipe_booking_pet_hotel || !tanggal_check_in || !tanggal_check_out || !detail_booking || detail_booking.length === 0) {
      return res.status(400).json({ status: false, message: "Field tidak lengkap" });
    }

    // Validasi tipe booking specific fields
    if (tipe_booking_pet_hotel === 'jemput' && (!waktu_penjemputan || !alamat_id)) {
      return res.status(400).json({ status: false, message: "Waktu penjemputan dan alamat wajib diisi untuk tipe booking jemput" });
    }

    if (tipe_booking_pet_hotel === 'datang_ke_klinik' && !waktu_kedatangan) {
      return res.status(400).json({ status: false, message: "Waktu kedatangan wajib diisi untuk tipe booking datang ke klinik" });
    }

    // Validasi tanggal
    const checkIn = new Date(tanggal_check_in);
    const checkOut = new Date(tanggal_check_out);
    if (checkIn >= checkOut) {
      return res.status(400).json({ status: false, message: "Tanggal check-out harus lebih besar dari tanggal check-in" });
    }

    // Hitung total harga dari semua tipe hotel yang dipilih
    let totalHargaTipeHotel = 0;
    for (const detail of detail_booking) {
      const tipeHotel = await TipeHotel.findByPk(detail.tipe_hotel_id);
      if (!tipeHotel) {
        return res.status(404).json({ status: false, message: `Tipe hotel dengan ID ${detail.tipe_hotel_id} tidak ditemukan` });
      }
      totalHargaTipeHotel += parseFloat(tipeHotel.harga_pet_hotel);
    }

    // Ambil biaya admin dari config
    const config = await ConfigPembayaran.findOne();
    if (!config) {
      return res.status(404).json({ status: false, message: "Konfigurasi pembayaran tidak ditemukan" });
    }

    // Biaya admin adalah nilai tetap, bukan persentase
    const biayaAdmin = parseFloat(config.biaya_admin);
    
    // Total harga = harga tipe hotel + biaya admin
    const totalHarga = totalHargaTipeHotel + biayaAdmin;
    
    // Hitung potensi coin yang akan didapat (persentase dari total harga)
    const potentialCoin = Math.floor(totalHarga * (parseFloat(config.persentase_coin) / 100));
    
    // Generate invoice
    const invoice = generateInvoiceNumber();
    
    // Buat record checkout
    const checkout = await CheckoutPetHotel.create({
      user_id,
      klinik_id,
      alamat_id,
      tipe_booking_pet_hotel,
      tanggal_check_in,
      tanggal_check_out,
      waktu_kedatangan,
      waktu_penjemputan,
      invoice,
      total_harga: totalHarga,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction: t });
    
    // Simpan detail booking
    for (const detail of detail_booking) {
      await CheckoutPetHotelDetail.create({
        checkout_pet_hotel_id: checkout.id,
        tipe_hotel_id: detail.tipe_hotel_id,
        hewan_peliharaan_id: detail.hewan_peliharaan_id,
        permintaan_khusus: detail.permintaan_khusus,
        kondisi_hewan: detail.kondisi_hewan || "",
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction: t });
    }
    
    await t.commit();
    return res.status(200).json({
      status: true,
      message: "Checkout berhasil, silahkan lakukan pembayaran",
      data: {
        ...checkout.toJSON(),
        rincian_harga: {
          harga_tipe_hotel: totalHargaTipeHotel,
          biaya_admin: biayaAdmin,
          total_harga: totalHarga
        },
        potential_coin_reward: {
          jumlah_coin: potentialCoin,
          keterangan: "Coin akan didapat setelah pembayaran selesai dan diverifikasi",
          persentase: `${config.persentase_coin}%`
        }
      }
    });
  } catch (error) {
    await t.rollback();
    console.error("Error in createCheckout:", error);
    return res.status(500).json({ 
      status: false, 
      message: "Terjadi kesalahan pada server", 
      error: error.message 
    });
  }
};


/**
 * Get available payment methods
 */
export const getPaymentMethods = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      attributes: ['id', 'nama_metode', 'slug', 'gambar_payment'],
    });

    // Transform response to include full image URL
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      nama_metode: payment.nama_metode,
      slug: payment.slug,
      gambar_payment: payment.gambar_payment ? createImageUrl(payment.gambar_payment) : null
    }));

    return res.status(200).json({
      status: 'success',
      data: transformedPayments
    });
  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil metode pembayaran'
    });
  }
};

/**
 * Select payment method for a checkout
 */
export const selectPaymentMethod = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { checkoutId } = req.params;
    const { payment_id } = req.body;

    // Validate payment_id
    if (!payment_id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID metode pembayaran harus diisi'
      });
    }

    // Find checkout
    const checkout = await CheckoutPetHotel.findByPk(checkoutId);
    
    if (!checkout) {
      return res.status(404).json({
        status: 'error',
        message: 'Data checkout tidak ditemukan'
      });
    }

    // Check if payment method already selected
    if (checkout.payment_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Metode pembayaran sudah dipilih dan tidak dapat diubah'
      });
    }

    // Verify payment method exists
    const payment = await Payment.findByPk(payment_id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Metode pembayaran tidak ditemukan'
      });
    }

    // Cari status history untuk status "belum-bayar"
    const statusHistory = await StatusHistory.findOne({
      where: {
        slug: 'belum-bayar'
      }
    });

    if (!statusHistory) {
      await t.rollback();
      return res.status(404).json({
        status: false,
        message: "Status history tidak ditemukan"
      });
    }

    // Update checkout with selected payment method
    await checkout.update({
      payment_id: payment_id,
      updated_at: new Date()
    }, { transaction: t });

    // Buat record pembayaran saat memilih metode pembayaran
    const pembayaran = await PembayaranPetHotel.create({
      checkout_pet_hotel_id: checkoutId,
      status: 'belum-bayar',
      kategori_status_history_id: statusHistory.id,
      created_at: new Date(),
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

    // Get payment details for response
    const selectedPayment = {
      id: payment.id,
      nama_metode: payment.nama_metode,
      slug: payment.slug,
      gambar_payment: payment.gambar_payment ? createImageUrl(payment.gambar_payment) : null
    };

    await t.commit();

    return res.status(200).json({
      status: 'success',
      message: 'Metode pembayaran berhasil dipilih',
      data: {
        checkout_id: checkout.id,
        selected_payment: selectedPayment,
        pembayaran: {
          id: pembayaran.id,
          status: pembayaran.status,
          created_at: pembayaran.created_at
        }
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error in selectPaymentMethod:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat memilih metode pembayaran'
    });
  }
};