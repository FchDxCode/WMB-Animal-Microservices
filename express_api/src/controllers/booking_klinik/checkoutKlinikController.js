// controllers/booking_klinik/CheckoutController.js
import { BookingKlinik, CheckoutBookingKlinik } from '../../models/bookingKlinikModels.js';
import { Keluhan } from '../../models/keluhanModels.js';
import { HewanPeliharaan } from '../../models/petModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { Klinik, LayananKlinik } from '../../models/klinikModels.js';
import { generateInvoiceNumber } from '../../utils/invoiceGeneratorUtils.js';
import sequelize  from '../../config/db.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';

/**
 * Controller untuk handle checkout booking klinik
 * Menyimpan data booking dan keluhan sekaligus
 */
export const checkoutBookingKlinik = async (req, res) => {
  // Mulai transaction untuk memastikan data tersimpan konsisten
  const transaction = await sequelize.transaction();

  try {
    // Data booking berdasarkan tipe booking
    const { 
      tipe_booking, // 'booking_antar_jemput' atau 'booking_ke_klinik'
      klinik_id, 
      tanggal_booking, 
      waktu_booking,
      alamat_user_id, // Hanya diperlukan untuk 'booking_antar_jemput'
      layanan_klinik_id, // Hanya diperlukan untuk 'booking_antar_jemput'
      hewan_keluhan // Array objek [{hewan_peliharaan_id, keluhan}]
    } = req.body;
    
    const user_id = req.user.id;

    // Validasi input dasar
    if (!tipe_booking || !klinik_id || !tanggal_booking || !waktu_booking) {
      return res.status(400).json({
        success: false,
        message: 'Data booking tidak lengkap. Tipe booking, klinik, tanggal dan waktu harus diisi.'
      });
    }

    // Validasi hewan dan keluhan
    if (!hewan_keluhan || !Array.isArray(hewan_keluhan) || hewan_keluhan.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal 1 hewan dengan keluhan diperlukan.'
      });
    }

    // Validasi tambahan untuk booking antar jemput
    if (tipe_booking === 'booking_antar_jemput' && (!alamat_user_id || !layanan_klinik_id)) {
      return res.status(400).json({
        success: false,
        message: 'Untuk booking antar jemput, alamat dan layanan klinik harus diisi.'
      });
    }

    // Cek keberadaan klinik
    const klinik = await Klinik.findByPk(klinik_id);
    if (!klinik) {
      return res.status(404).json({
        success: false,
        message: 'Klinik tidak ditemukan'
      });
    }

    // Set nilai default untuk booking datang ke klinik
    const finalAlamatUserId = tipe_booking === 'booking_antar_jemput' ? alamat_user_id : null;
    let finalLayananKlinikId = layanan_klinik_id;

    // Untuk booking datang ke klinik, gunakan layanan default jika tidak disediakan
    if (tipe_booking === 'booking_ke_klinik' && !finalLayananKlinikId) {
      // Bisa diambil dari layanan default klinik atau layanan pertama yang tersedia
      const defaultLayanan = await LayananKlinik.findOne({
        where: { klinik_id },
        order: [['created_at', 'ASC']]
      });
      
      if (defaultLayanan) {
        finalLayananKlinikId = defaultLayanan.id;
      } else {
        // Jika tidak ada layanan, gunakan nilai default
        finalLayananKlinikId = null;
      }
    }

    // 1. Buat booking
    const booking = await BookingKlinik.create({
      user_id,
      klinik_id,
      layanan_klinik_id: finalLayananKlinikId,
      alamat_user_id: finalAlamatUserId,
      tipe_booking,
      tanggal_booking,
      waktu_booking
    }, { transaction });

    // 2. Proses setiap hewan dan keluhan
    const keluhanPromises = hewan_keluhan.map(async (item) => {
      // Cek keberadaan hewan
      const hewan = await HewanPeliharaan.findByPk(item.hewan_peliharaan_id);
      if (!hewan) {
        throw new Error(`Hewan dengan ID ${item.hewan_peliharaan_id} tidak ditemukan`);
      }

      // Buat keluhan baru
      return Keluhan.create({
        user_id,
        hewan_peliharaan_id: item.hewan_peliharaan_id,
        keluhan: item.keluhan,
        tipe_layanan: 'klinik' // Karena ini untuk klinik
      }, { transaction });
    });

    // Tunggu semua keluhan selesai dibuat
    const keluhanResults = await Promise.all(keluhanPromises);

    if (keluhanResults.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Gagal membuat keluhan'
      });
    }

    // 3. Dapatkan konfigurasi pembayaran
    const configPembayaran = await ConfigPembayaran.findOne({
      order: [['created_at', 'DESC']] // Ambil yang terbaru
    });

    if (!configPembayaran) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi pembayaran tidak ditemukan'
      });
    }

    // 4. Generate invoice number
    const invoice = generateInvoiceNumber();

    // 5. Buat checkout dengan keluhan pertama
    // (Sebenarnya kita perlu redesain database untuk mendukung multiple keluhan,
    // tapi untuk solusi cepat kita gunakan keluhan pertama saja)
    const firstKeluhan = keluhanResults[0];
    
    const checkout = await CheckoutBookingKlinik.create({
      booking_klinik_id: booking.id,
      keluhan_id: firstKeluhan.id,
      config_pembayaran_id: configPembayaran.id,
      tanggal_checkout_booking_klinik: new Date(),
      invoice
    }, { transaction });

    // Commit transaction jika semua berhasil
    await transaction.commit();

    // Dapatkan info layanan untuk response
    const layananKlinik = await LayananKlinik.findByPk(finalLayananKlinikId);

    // Buat response
    return res.status(201).json({
      success: true,
      message: 'Checkout berhasil dibuat',
      data: {
        checkout_id: checkout.id,
        invoice: checkout.invoice,
        tanggal_checkout: checkout.tanggal_checkout_booking_klinik,
        informasi_layanan: {
          tipe_booking: booking.tipe_booking,
          klinik: klinik.nama_klinik,
          alamat_klinik: klinik.alamat_klinik,
          tanggal_booking: booking.tanggal_booking,
          waktu_booking: booking.waktu_booking,
          layanan: layananKlinik ? layananKlinik.nama_layanan : null
        },
        informasi_hewan: await Promise.all(keluhanResults.map(async (keluhan) => {
          const hewan = await HewanPeliharaan.findByPk(keluhan.hewan_peliharaan_id, {
            include: [{ association: 'gambar' }]
          });
          return {
            id: hewan.id,
            nama_hewan: hewan.nama_hewan,
            jenis_hewan_id: hewan.jenis_hewan_id,
            jenis_kelamin: hewan.jenis_kelamin,
            tanggal_lahir: hewan.tanggal_lahir_hewan,
            berat_badan: hewan.berat_badan,
            profile_hewan: hewan.gambar && hewan.gambar.length > 0 
              ? createImageUrl(hewan.gambar[0].profile_hewan, uploadFolders.petImages)
              : null,
            keluhan: keluhan.keluhan
          };
        })),
        biaya_booking: configPembayaran.biaya_booking
      }
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    await transaction.rollback();
    
    console.error('Error in checkoutBookingKlinik:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat checkout',
      error: error.message
    });
  }
};