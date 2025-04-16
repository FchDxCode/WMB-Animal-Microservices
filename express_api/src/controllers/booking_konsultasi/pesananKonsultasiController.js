// controllers/booking_konsultasi/pesananKonsultasiController.js

import { CheckoutKonsultasi, PembayaranKonsultasi } from '../../models/bookingKonsultasiModels.js';
import { Klinik, GambarKlinik } from '../../models/klinikModels.js';
import { Dokter, GambarDokter } from '../../models/dokterModels.js';
import { HewanPeliharaan, GambarHewan } from '../../models/petModels.js';
import { StatusHistory } from '../../models/historyModels.js';
import { Payment } from '../../models/configPembayaranModels.js';
import { createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';
import { createImageUrl, uploadFolders } from '../../utils/uploadUtils.js';

// Helper function untuk format data
const formatOrderData = (checkout) => {
  // Format bukti pembayaran URL
  const buktiPembayaranUrl = checkout.pembayaran?.bukti_pembayaran 
    ? createBuktiTransferUrl(checkout.pembayaran.bukti_pembayaran)
    : null;

  return {
    id: checkout.id,
    invoice: checkout.invoice,
    tanggal_checkout: checkout.tanggal_checkout_konsultasi,
    lama_konsultasi: checkout.lama_konsultasi,
    total_harga: checkout.total_harga,
    keluhan: checkout.keluhan,
    pembayaran: checkout.pembayaran ? {
      id: checkout.pembayaran.id,
      status: checkout.pembayaran.status,
      status_nama: checkout.pembayaran.statusHistory?.nama,
      bukti_pembayaran: buktiPembayaranUrl,
      koin_didapat: checkout.pembayaran.koin_didapat,
      metode_pembayaran: checkout.payment ? {
        id: checkout.payment.id,
        nama_metode: checkout.payment.nama_metode,
        slug: checkout.payment.slug,
        gambar: checkout.payment.gambar_payment 
          ? createImageUrl(checkout.payment.gambar_payment, uploadFolders.paymentImages)
          : null
      } : null
    } : null,
    klinik: checkout.klinik ? {
      id: checkout.klinik.id,
      nama_klinik: checkout.klinik.nama_klinik,
      harga_konsultasi: checkout.klinik.harga_konsultasi,
      waktu_konsultasi: checkout.klinik.waktu_konsultasi,
      no_rekening_klinik: checkout.klinik.no_rekening_klinik,
      logo: checkout.klinik.gambar?.[0]?.logo_klinik 
        ? createImageUrl(checkout.klinik.gambar[0].logo_klinik, uploadFolders.klinikImages)
        : null,
      thumbnail: checkout.klinik.gambar?.[0]?.thumbnail_klinik 
        ? createImageUrl(checkout.klinik.gambar[0].thumbnail_klinik, uploadFolders.klinikImages)
        : null
    } : null,
    dokter: checkout.dokter ? {
      id: checkout.dokter.id,
      nama: checkout.dokter.nama,
      email: checkout.dokter.email,
      gambar: checkout.dokter.gambar_dokter?.[0]?.gambar 
        ? createImageUrl(checkout.dokter.gambar_dokter[0].gambar, uploadFolders.dokterImages)
        : null
    } : null,
    hewan: checkout.hewan ? {
      id: checkout.hewan.id,
      nama_hewan: checkout.hewan.nama_hewan,
      jenis_kelamin: checkout.hewan.jenis_kelamin,
      gambar: checkout.hewan.gambar?.[0]?.profile_hewan 
        ? createImageUrl(checkout.hewan.gambar[0].profile_hewan, uploadFolders.petImages)
        : null
    } : null,
  };
};

// Mendapatkan detail pesanan berdasarkan ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkout = await CheckoutKonsultasi.findByPk(id, {
      include: [
        {
          association: 'pembayaran',
          include: [
            {
              model: StatusHistory,
              as: 'statusHistory',
              attributes: ['nama', 'slug'],
            },
          ],
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'nama_metode', 'slug', 'gambar_payment'],
        },
        {
          model: Klinik,
          as: 'klinik',
          attributes: ['id', 'nama_klinik', 'harga_konsultasi', 'waktu_konsultasi', 'no_rekening_klinik'],
          include: [
            {
              model: GambarKlinik,
              as: 'gambar',
              attributes: ['logo_klinik', 'thumbnail_klinik'],
            },
          ],
        },
        {
          model: Dokter,
          as: 'dokter',
          attributes: ['id', 'nama', 'email'],
          include: [
            {
              model: GambarDokter,
              as: 'gambar_dokter',
              attributes: ['gambar'],
            },
          ],
        },
        {
          model: HewanPeliharaan,
          as: 'hewan',
          attributes: ['id', 'nama_hewan', 'jenis_kelamin'],
          include: [
            {
              model: GambarHewan,
              as: 'gambar',
              attributes: ['profile_hewan'],
            },
          ],
        },
      ],
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan',
      });
    }

    // Cek apakah user yang request adalah pemilik pesanan
    if (checkout.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke pesanan ini',
      });
    }

    // Format response data menggunakan helper function
    const responseData = formatOrderData(checkout);

    return res.status(200).json({
      success: true,
      message: 'Detail pesanan berhasil diambil',
      data: responseData,
    });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail pesanan',
      error: error.message,
    });
  }
};

// Mendapatkan detail pesanan berdasarkan invoice
export const getOrderByInvoice = async (req, res) => {
  try {
    const { invoice } = req.params;
    
    const checkout = await CheckoutKonsultasi.findOne({
      where: { invoice },
      include: [
        {
          association: 'pembayaran',
          include: [
            {
              model: StatusHistory,
              as: 'statusHistory',
              attributes: ['nama', 'slug'],
            },
          ],
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'nama_metode', 'slug', 'gambar_payment'],
        },
        {
          model: Klinik,
          as: 'klinik',
          attributes: ['id', 'nama_klinik', 'harga_konsultasi', 'waktu_konsultasi', 'no_rekening_klinik'],
          include: [
            {
              model: GambarKlinik,
              as: 'gambar',
              attributes: ['logo_klinik', 'thumbnail_klinik'],
            },
          ],
        },
        {
          model: Dokter,
          as: 'dokter',
          attributes: ['id', 'nama', 'email'],
          include: [
            {
              model: GambarDokter,
              as: 'gambar_dokter',
              attributes: ['gambar'],
            },
          ],
        },
        {
          model: HewanPeliharaan,
          as: 'hewan',
          attributes: ['id', 'nama_hewan', 'jenis_kelamin'],
          include: [
            {
              model: GambarHewan,
              as: 'gambar',
              attributes: ['profile_hewan'],
            },
          ],
        },
      ],
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan',
      });
    }

    // Cek apakah user yang request adalah pemilik pesanan
    if (checkout.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke pesanan ini',
      });
    }

    // Format response data menggunakan helper function
    const responseData = formatOrderData(checkout);

    return res.status(200).json({
      success: true,
      message: 'Detail pesanan berhasil diambil',
      data: responseData,
    });
  } catch (error) {
    console.error('Error in getOrderByInvoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail pesanan',
      error: error.message,
    });
  }
};