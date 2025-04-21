import { CheckoutHouseCall, DetailHouseCall } from '../../models/bookingHouseCallModels.js';
import { Klinik, LayananKlinik } from '../../models/klinikModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { generateInvoiceNumber } from '../../utils/invoiceGeneratorUtils.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import sequelize from '../../config/db.js';

// Controller untuk membuat checkout house call
export const createCheckoutHouseCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      klinik_id,
      layanan_klinik_id,
      alamat_user_id,
      tanggal_booking,
      pets_data // Array of {hewan_peliharaan_id, keluhan}
    } = req.body;

    // Validasi input
    if (!klinik_id || !layanan_klinik_id || !alamat_user_id || !tanggal_booking || !pets_data || !pets_data.length) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    // Dapatkan data layanan untuk harga
    const layanan = await LayananKlinik.findByPk(layanan_klinik_id);
    if (!layanan) {
      return res.status(404).json({
        success: false,
        message: 'Layanan klinik tidak ditemukan'
      });
    }

    // Dapatkan biaya booking dan persentase koin dari config
    const configPembayaran = await ConfigPembayaran.findOne();
    if (!configPembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi pembayaran tidak ditemukan'
      });
    }

    // Generate invoice
    const invoice = generateInvoiceNumber();

    // Hitung total harga
    const total_pesanan = parseFloat(layanan.harga_layanan) + parseFloat(configPembayaran.biaya_booking);
    
    // Hitung koin yang didapat
    const koin_didapat = calculateCoin(total_pesanan, configPembayaran.persentase_coin);

    // Lakukan transaksi database
    const result = await sequelize.transaction(async (t) => {
      // Buat checkout house call
      const checkout = await CheckoutHouseCall.create({
        user_id: userId,
        klinik_id,
        layanan_klinik_id,
        alamat_user_id,
        tanggal_booking,
        total_pesanan,
        invoice
      }, { transaction: t });

      // Buat detail untuk setiap hewan
      const detailPromises = pets_data.map(pet => {
        return DetailHouseCall.create({
          checkout_house_call_id: checkout.id,
          hewan_peliharaan_id: pet.hewan_peliharaan_id,
          keluhan: pet.keluhan
        }, { transaction: t });
      });

      await Promise.all(detailPromises);

      return checkout;
    });

    return res.status(201).json({
      success: true,
      message: 'Checkout house call berhasil dibuat',
      data: {
        id: result.id,
        invoice: result.invoice,
        total_pesanan: result.total_pesanan,
        tanggal_booking: result.tanggal_booking,
      }
    });
  } catch (error) {
    console.error('Error creating checkout house call:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat checkout',
      error: error.message
    });
  }
};