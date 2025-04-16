// controllers/booking_konsultasi/checkoutKonsultasiController.js

import { CheckoutKonsultasi, PembayaranKonsultasi } from '../../models/bookingKonsultasiModels.js';
import { Dokter } from '../../models/dokterModels.js';
import { Klinik, GambarKlinik } from '../../models/klinikModels.js';
import { HewanPeliharaan, GambarHewan } from '../../models/petModels.js';
import { generateInvoiceNumber } from '../../utils/invoiceGeneratorUtils.js';
import { StatusHistory } from '../../models/historyModels.js';
import sequelize from '../../config/db.js';
import { Payment } from '../../models/configPembayaranModels.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';

// Proses checkout konsultasi
export const createCheckout = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const {
      dokter_id,
      klinik_id,
      hewan_peliharaan_id,
      keluhan,
      lama_konsultasi,
      payment_method_id,
    } = req.body;

    // Validasi input
    if (!dokter_id || !klinik_id || !hewan_peliharaan_id || !keluhan || !lama_konsultasi || !payment_method_id) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi',
      });
    }

    // Ambil data klinik untuk menghitung harga
    const klinik = await Klinik.findByPk(klinik_id);
    if (!klinik) {
      return res.status(404).json({
        success: false,
        message: 'Klinik tidak ditemukan',
      });
    }

    // Hitung total harga
    const totalHarga = klinik.harga_konsultasi * lama_konsultasi;

    // Generate invoice number
    const invoice = generateInvoiceNumber();

    // Ambil status history 'belum-bayar'
    const statusHistory = await StatusHistory.findOne({
      where: { slug: 'belum-bayar' },
    });

    if (!statusHistory) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan',
      });
    }

    // Buat checkout konsultasi
    const checkout = await CheckoutKonsultasi.create({
      user_id: userId,
      dokter_id,
      klinik_id,
      hewan_peliharaan_id,
      payment_id: payment_method_id,
      keluhan,
      tanggal_checkout_konsultasi: new Date(),
      lama_konsultasi,
      total_harga: totalHarga,
      invoice,
    }, { transaction: t });

    // Buat pembayaran konsultasi
    const pembayaran = await PembayaranKonsultasi.create({
      checkout_konsultasi_id: checkout.id,
      status: 'belum-bayar',
      kategori_status_history_id: statusHistory.id,
      koin_didapat: 0, // Akan diupdate ketika pembayaran selesai
    }, { transaction: t });

    // Commit transaction
    await t.commit();

    return res.status(201).json({
      success: true,
      message: 'Checkout konsultasi berhasil',
      data: {
        checkout_id: checkout.id,
        pembayaran_id: pembayaran.id,
        invoice,
        total_harga: totalHarga,
        status: 'belum-bayar',
      },
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    await t.rollback();
    
    console.error('Error in createCheckout:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat checkout konsultasi',
      error: error.message,
    });
  }
};

// Helper function untuk format data dokter
const formatDokterData = (dokter) => {
  return {
    id: dokter.id,
    nama: dokter.nama,
    klinik_id: dokter.klinik_id,
    gambar_dokter: dokter.gambar_dokter && dokter.gambar_dokter.length > 0 
      ? createImageUrl(dokter.gambar_dokter[0].gambar, uploadFolders.dokterImages)
      : null
  };
};

// Helper function untuk format data hewan
const formatHewanData = (hewan) => {
  return {
    id: hewan.id,
    nama_hewan: hewan.nama_hewan,
    jenis_hewan_id: hewan.jenis_hewan_id,
    jenis_kelamin: hewan.jenis_kelamin,
    jenis_ras: hewan.jenis_ras,
    tanggal_lahir_hewan: hewan.tanggal_lahir_hewan,
    berat_badan: hewan.berat_badan,
    gambar_hewan: hewan.gambar && hewan.gambar.length > 0 
      ? createImageUrl(hewan.gambar[0].profile_hewan, uploadFolders.petImages)
      : null
  };
};

// Helper function untuk format data klinik
const formatKlinikData = (klinik) => {
  return {
    id: klinik.id,
    nama_klinik: klinik.nama_klinik,
    harga_konsultasi: klinik.harga_konsultasi,
    waktu_konsultasi: klinik.waktu_konsultasi,
    logo_klinik: klinik.gambar && klinik.gambar.length > 0 
      ? createImageUrl(klinik.gambar[0].logo_klinik, uploadFolders.klinikImages)
      : null,
    thumbnail_klinik: klinik.gambar && klinik.gambar.length > 0 
      ? createImageUrl(klinik.gambar[0].thumbnail_klinik, uploadFolders.klinikImages)
      : null
  };
};

// Helper function untuk format data payment
const formatPaymentData = (payment) => {
  return {
    id: payment.id,
    nama_metode: payment.nama_metode,
    slug: payment.slug,
    gambar_payment: payment.gambar_payment 
      ? createImageUrl(payment.gambar_payment, uploadFolders.paymentImages)
      : null
  };
};

// Function untuk mendapatkan data form checkout (dropdown)
export const getCheckoutForm = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ambil daftar klinik dengan gambar
    const kliniks = await Klinik.findAll({
      attributes: ['id', 'nama_klinik', 'harga_konsultasi', 'waktu_konsultasi'],
      include: [
        {
          model: GambarKlinik,
          as: 'gambar',
          attributes: ['logo_klinik', 'thumbnail_klinik'],
        },
      ],
    });

    // Format klinik data dengan URL gambar lengkap
    const formattedKliniks = kliniks.map(formatKlinikData);

    // Ambil daftar dokter
    const dokters = await Dokter.findAll({
      attributes: ['id', 'nama', 'klinik_id'],
      include: [
        {
          association: 'gambar_dokter',
          attributes: ['gambar'],
        },
      ],
    });

    // Format dokter data dengan URL gambar lengkap
    const formattedDokters = dokters.map(formatDokterData);

    // Ambil daftar hewan peliharaan user dengan gambar
    const hewanPeliharaans = await HewanPeliharaan.findAll({
      where: { user_id: userId },
      attributes: ['id', 'nama_hewan', 'jenis_hewan_id', 'jenis_kelamin', 'jenis_ras', 'tanggal_lahir_hewan', 'berat_badan'],
      include: [
        {
          model: GambarHewan,
          as: 'gambar',
          attributes: ['profile_hewan'],
        },
      ],
    });

    // Format hewan data dengan URL gambar lengkap
    const formattedHewans = hewanPeliharaans.map(formatHewanData);

    // Ambil daftar metode pembayaran dengan gambar
    const paymentMethods = await Payment.findAll({
      attributes: ['id', 'nama_metode', 'slug', 'gambar_payment'],
    });

    // Format payment data dengan URL gambar lengkap
    const formattedPayments = paymentMethods.map(formatPaymentData);

    return res.status(200).json({
      success: true,
      message: 'Data form checkout berhasil diambil',
      data: {
        kliniks: formattedKliniks,
        dokters: formattedDokters,
        hewanPeliharaans: formattedHewans,
        paymentMethods: formattedPayments
      },
    });
  } catch (error) {
    console.error('Error in getCheckoutForm:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data form checkout',
      error: error.message,
    });
  }
};