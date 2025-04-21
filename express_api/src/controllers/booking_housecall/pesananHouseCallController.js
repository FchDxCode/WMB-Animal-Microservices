import { CheckoutHouseCall, DetailHouseCall } from '../../models/bookingHouseCallModels.js';
import { Klinik, LayananKlinik, GambarKlinik } from '../../models/klinikModels.js';
import { AlamatUser } from '../../models/alamatUserModels.js';
import { HewanPeliharaan, GambarHewan, JenisHewan } from '../../models/petModels.js';
import { Payment, ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { PembayaranHouseCall } from '../../models/bookingHouseCallModels.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import { HistoryLayanan } from '../../models/historyModels.js';
import sequelize from '../../config/db.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';
import { createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';

// Controller untuk mendapatkan detail pesanan house call
export const getDetailPesananHouseCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    // Dapatkan data pesanan lengkap dengan relasi
    const pesanan = await CheckoutHouseCall.findOne({
      where: { id: bookingId, user_id: userId },
      include: [
        { 
          model: Klinik, 
          as: 'klinik',
          attributes: ['nama_klinik', 'alamat_klinik', 'no_rekening_klinik'],
          include: [
            {
              model: GambarKlinik,
              as: 'gambar',
              attributes: ['logo_klinik', 'thumbnail_klinik']
            }
          ]
        },
        { 
          model: LayananKlinik, 
          as: 'layanan',
          attributes: ['nama_layanan', 'harga_layanan']
        },
        { 
          model: AlamatUser, 
          as: 'alamat',
          attributes: ['nama_lengkap', 'no_tlpn', 'detail_alamat', 'kode_pos']
        },
        { 
          model: Payment, 
          as: 'payment',
          attributes: ['nama_metode', 'slug', 'gambar_payment']
        },
        { 
          model: DetailHouseCall,
          include: [
            { 
              model: HewanPeliharaan,
              as: 'hewan',
              include: [
                {
                  model: GambarHewan,
                  as: 'gambar'
                },
                {
                  model: JenisHewan,
                  as: 'jenis'
                }
              ]
            }
          ]
        },
        { 
          model: PembayaranHouseCall,
          attributes: ['id', 'status', 'koin_didapat', 'bukti_pembayaran', 'expired_at', 'created_at']
        }
      ]
    });

    if (!pesanan) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    // Dapatkan config untuk biaya booking
    const configPembayaran = await ConfigPembayaran.findOne();

    // Hitung koin yang didapat jika belum ada
    let koin_didapat = 0;
    if (pesanan.PembayaranHouseCall) {
      koin_didapat = pesanan.PembayaranHouseCall.koin_didapat;
    } else {
      // Hitung koin yang didapat berdasarkan total pesanan dan persentase coin
      koin_didapat = calculateCoin(pesanan.total_pesanan, configPembayaran.persentase_coin);
    }

    // Set expired date (24 jam dari tanggal pembuatan) jika belum ada
    let expired_at = null;
    if (pesanan.PembayaranHouseCall) {
      expired_at = pesanan.PembayaranHouseCall.expired_at;
    } else if (pesanan.payment_id) {
      // Jika sudah pilih payment tapi belum ada record pembayaran, buat preview expired date
      const now = new Date();
      expired_at = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // Format response
    const detailPesanan = {
      id: pesanan.id,
      invoice: pesanan.invoice,
      status_pesanan: pesanan.PembayaranHouseCall ? pesanan.PembayaranHouseCall.status : 'belum-bayar',
      tanggal_pembelian: pesanan.created_at,
      nama_layanan: 'House Call',
      alamat_user: pesanan.alamat.detail_alamat,
      klinik: {
        nama: pesanan.klinik.nama_klinik,
        alamat: pesanan.klinik.alamat_klinik,
        no_rekening: pesanan.klinik.no_rekening_klinik,
        logo: pesanan.klinik.gambar?.[0]?.logo_klinik 
          ? createImageUrl(pesanan.klinik.gambar[0].logo_klinik, uploadFolders.klinikImages)
          : null,
        thumbnail: pesanan.klinik.gambar?.[0]?.thumbnail_klinik 
          ? createImageUrl(pesanan.klinik.gambar[0].thumbnail_klinik, uploadFolders.klinikImages)
          : null
      },
      tanggal_booking: pesanan.tanggal_booking,
      hewan_peliharaan: pesanan.detail_house_calls ? pesanan.detail_house_calls.map(detail => ({
        id: detail.hewan ? detail.hewan.id : null,
        nama: detail.hewan ? detail.hewan.nama_hewan : 'Tidak ada data',
        jenis: detail.hewan && detail.hewan.jenis ? detail.hewan.jenis.jenis_hewan_peliharaan : 'Tidak ada data',
        jenis_kelamin: detail.hewan ? detail.hewan.jenis_kelamin : 'Tidak ada data',
        berat_badan: detail.hewan ? detail.hewan.berat_badan : 0,
        tanggal_lahir: detail.hewan ? detail.hewan.tanggal_lahir_hewan : null,
        gambar: detail.hewan && detail.hewan.gambar && detail.hewan.gambar.length > 0 
          ? createImageUrl(detail.hewan.gambar[0].profile_hewan, uploadFolders.petImages)
          : null,
        keluhan: detail.keluhan
      })) : [],
      pembayaran: pesanan.PembayaranHouseCall ? {
        id: pesanan.PembayaranHouseCall.id,
        status: pesanan.PembayaranHouseCall.status,
        bukti_pembayaran: pesanan.PembayaranHouseCall.bukti_pembayaran 
          ? createBuktiTransferUrl(pesanan.PembayaranHouseCall.bukti_pembayaran)
          : null,
        created_at: pesanan.PembayaranHouseCall.created_at
      } : null,
      payment: pesanan.payment ? {
        id: pesanan.payment.id,
        nama_metode: pesanan.payment.nama_metode,
        slug: pesanan.payment.slug,
        gambar: pesanan.payment.gambar_payment 
          ? createImageUrl(pesanan.payment.gambar_payment, uploadFolders.paymentImages)
          : null
      } : null,
      rincian_pesanan: {
        harga_layanan: parseFloat(pesanan.layanan.harga_layanan),
        biaya_booking: parseFloat(configPembayaran.biaya_booking),
        total_pesanan: pesanan.total_pesanan,
        koin_didapat: koin_didapat
      },
      koin_didapat_preview: koin_didapat,
      expired_at: expired_at,
      created_at: pesanan.created_at,
      updated_at: pesanan.updated_at
    };

    return res.status(200).json({
      success: true,
      message: 'Detail pesanan berhasil diambil',
      data: detailPesanan
    });
  } catch (error) {
    console.error('Error fetching pesanan house call:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail pesanan',
      error: error.message
    });
  }
};

// Controller untuk pilih metode pembayaran
export const choosePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId, paymentId } = req.body;

    // Cek apakah booking milik user
    const booking = await CheckoutHouseCall.findOne({
      where: { id: bookingId, user_id: userId },
      include: [
        { model: PembayaranHouseCall },
        { model: LayananKlinik, as: 'layanan' }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan atau bukan milik anda'
      });
    }

    // Lakukan transaksi database
    await sequelize.transaction(async (t) => {
      // Update payment method pada checkout
      await booking.update({ payment_id: paymentId }, { transaction: t });

      // Jika belum ada record pembayaran, buat baru
      if (!booking.PembayaranHouseCall) {
        console.log(`Creating payment record for booking ID ${bookingId}`);
        
        // Hitung koin yang didapat
        const configPembayaran = await ConfigPembayaran.findOne();
        const koinDidapat = configPembayaran ? 
          calculateCoin(booking.total_pesanan, configPembayaran.persentase_coin) : 0;
        
        // Set expired date (24 jam dari sekarang)
        const now = new Date();
        const expiredAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        // Buat record pembayaran
        const newPayment = await PembayaranHouseCall.create({
          house_call_checkout_id: booking.id,
          status: 'belum-bayar',
          kategori_status_history_id: 1, // ID untuk status 'belum-bayar'
          koin_didapat: koinDidapat,
          expired_at: expiredAt
        }, { transaction: t });
        
        // Catat history dengan pembayaran_house_call_id yang benar
        await HistoryLayanan.create({
          pembayaran_house_call_id: newPayment.id, // Gunakan ID pembayaran yang baru dibuat
          status_history_id: 1, // ID untuk status 'belum-bayar'
          user_id: userId,
          created_at: new Date()
        }, { transaction: t });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Metode pembayaran berhasil dipilih'
    });
  } catch (error) {
    console.error('Error selecting payment method:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memilih metode pembayaran',
      error: error.message
    });
  }
};