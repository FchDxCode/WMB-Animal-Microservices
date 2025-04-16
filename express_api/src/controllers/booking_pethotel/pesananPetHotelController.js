import { CheckoutPetHotel, CheckoutPetHotelDetail, TipeHotel, PembayaranPetHotel } from '../../models/bookingPetHotelModels.js';
import { HewanPeliharaan, JenisHewan, GambarHewan } from '../../models/petModels.js';
import { Klinik, GambarKlinik } from '../../models/klinikModels.js';
import { Payment } from '../../models/configPembayaranModels.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';
import { createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';

export const getPesanan = async (req, res) => {
  try {
    const user_id = req.user.id;

    const pesanan = await CheckoutPetHotel.findAll({
      where: { user_id },
      include: [
        {
          model: CheckoutPetHotelDetail,
          as: 'detail_booking',
          include: [
            {
              model: HewanPeliharaan,
              as: 'hewan',
              include: [
                {
                  model: JenisHewan,
                  as: 'jenis',
                  attributes: ['jenis_hewan_peliharaan']
                },
                {
                  model: GambarHewan,
                  as: 'gambar',
                  attributes: ['profile_hewan']
                }
              ]
            },
            {
              model: TipeHotel,
              as: 'tipe',
            }
          ]
        },
        {
          model: Klinik,
          as: 'klinik',
          include: [
            {
              model: GambarKlinik,
              as: 'gambar',
              attributes: ['logo_klinik', 'thumbnail_klinik']
            }
          ]
        },
        {
          model: PembayaranPetHotel,
          as: 'pembayaran',
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'nama_metode', 'slug', 'gambar_payment']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedPesanan = pesanan.map(p => {
      // Hitung rincian harga per tipe hotel dan total
      const detailHargaTipeHotel = p.detail_booking?.map(detail => ({
        id: detail.tipe?.id,
        nama: detail.tipe?.tipe_hotel,
        harga: parseFloat(detail.tipe?.harga_pet_hotel || 0)
      })) || [];
      
      // Jumlahkan semua harga tipe hotel
      const totalHargaTipeHotel = detailHargaTipeHotel.reduce((total, item) => total + item.harga, 0);
      
      // Total harga dari database
      const totalHarga = parseFloat(p.total_harga || 0);
      
      // Biaya admin adalah selisih antara total harga dan total harga tipe hotel
      const biayaAdmin = totalHarga - totalHargaTipeHotel;

      return {
        id: p.id,
        status_pesanan: p.pembayaran?.status || 'belum-bayar',
        no_invoice: p.invoice,
        tanggal_pembelian: p.created_at,
        informasi_booking: {
          layanan: 'Pet Hotel',
          klinik: {
            nama: p.klinik?.nama_klinik,
            alamat: p.klinik?.alamat_klinik,
            telepon: p.klinik?.no_tlpn_klinik,
            logo_klinik: p.klinik?.gambar?.[0]?.logo_klinik 
              ? createImageUrl(p.klinik.gambar[0].logo_klinik, uploadFolders.klinikImages)
              : null,
            thumbnail_klinik: p.klinik?.gambar?.[0]?.thumbnail_klinik 
              ? createImageUrl(p.klinik.gambar[0].thumbnail_klinik, uploadFolders.klinikImages)
              : null
          },
          tanggal_check_in: p.tanggal_check_in,
          tanggal_check_out: p.tanggal_check_out,
          waktu_kedatangan: p.waktu_kedatangan,
          waktu_penjemputan: p.waktu_penjemputan
        },
        informasi_hewan: p.detail_booking?.map(detail => ({
          hewan: {
            nama: detail.hewan?.nama_hewan,
            jenis: detail.hewan?.jenis?.jenis_hewan_peliharaan || detail.hewan?.jenis_hewan_id,
            jenis_kelamin: detail.hewan?.jenis_kelamin,
            berat_badan: detail.hewan?.berat_badan,
            gambar_hewan: detail.hewan?.gambar?.[0]?.profile_hewan 
              ? createImageUrl(detail.hewan.gambar[0].profile_hewan, uploadFolders.petImages)
              : null
          },
          tipe_hotel: {
            nama: detail.tipe?.tipe_hotel,
            harga: parseFloat(detail.tipe?.harga_pet_hotel || 0)
          },
          kondisi_hewan: detail.kondisi_hewan,
          permintaan_khusus: detail.permintaan_khusus
        })) || [],
        metode_pembayaran: p.payment ? {
          id: p.payment.id,
          nama: p.payment.nama_metode,
          slug: p.payment.slug,
          gambar_payment: p.payment.gambar_payment 
            ? createImageUrl(p.payment.gambar_payment, uploadFolders.paymentImages)
            : null
        } : null,
        informasi_pembayaran: p.pembayaran ? {
          id: p.pembayaran.id,
          status: p.pembayaran.status,
          bukti_pembayaran: p.pembayaran.bukti_pembayaran 
            ? createBuktiTransferUrl(p.pembayaran.bukti_pembayaran)
            : null,
          tanggal_pembayaran: p.pembayaran.created_at,
          terakhir_diupdate: p.pembayaran.updated_at
        } : null,
        rincian_pesanan: {
          detail_tipe_hotel: detailHargaTipeHotel,
          total_harga_tipe_hotel: totalHargaTipeHotel,
          biaya_admin: biayaAdmin,
          total_harga: totalHarga
        },
        coin_didapat: p.pembayaran?.koin_didapat || 0
      };
    });

    return res.status(200).json({
      status: true,
      message: "Berhasil mengambil data pesanan",
      data: formattedPesanan
    });
  } catch (error) {
    console.error("Error in getPesanan:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};

export const getPesananById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Cek apakah id adalah numeric (ID) atau string (invoice)
    let where = {};
    if (!isNaN(id)) {
      where = { id: parseInt(id), user_id };
    } else {
      where = { invoice: id, user_id };
    }

    const pesanan = await CheckoutPetHotel.findOne({
      where,
      include: [
        {
          model: CheckoutPetHotelDetail,
          as: 'detail_booking',
          include: [
            {
              model: HewanPeliharaan,
              as: 'hewan',
              attributes: ['id', 'nama_hewan', 'jenis_hewan_id', 'jenis_kelamin', 'berat_badan', 'jenis_ras'],
              include: [
                {
                  model: GambarHewan,
                  as: 'gambar',
                  attributes: ['profile_hewan']
                }
              ]
            },
            {
              model: TipeHotel,
              as: 'tipe',
              attributes: ['id', 'tipe_hotel', 'harga_pet_hotel']
            }
          ]
        },
        {
          model: Klinik,
          as: 'klinik',
          attributes: ['id', 'nama_klinik', 'alamat_klinik', 'no_tlpn_klinik'],
          include: [
            {
              model: GambarKlinik,
              as: 'gambar',
              attributes: ['logo_klinik', 'thumbnail_klinik']
            }
          ]
        },
        {
          model: PembayaranPetHotel,
          as: 'pembayaran',
          attributes: ['id', 'status', 'koin_didapat', 'bukti_pembayaran', 'created_at', 'updated_at']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'nama_metode', 'slug', 'gambar_payment']
        }
      ],
      attributes: {
        exclude: ['updated_at']
      }
    });

    if (!pesanan) {
      return res.status(404).json({
        status: false,
        message: "Pesanan tidak ditemukan"
      });
    }

    // Hitung rincian harga per tipe hotel dan total
    const detailHargaTipeHotel = pesanan.detail_booking?.map(detail => ({
      id: detail.tipe?.id,
      nama: detail.tipe?.tipe_hotel,
      harga: parseFloat(detail.tipe?.harga_pet_hotel || 0)
    })) || [];
    
    // Jumlahkan semua harga tipe hotel
    const totalHargaTipeHotel = detailHargaTipeHotel.reduce((total, item) => total + item.harga, 0);
    
    // Total harga dari database
    const totalHarga = parseFloat(pesanan.total_harga || 0);
    
    // Biaya admin adalah selisih antara total harga dan total harga tipe hotel
    const biayaAdmin = totalHarga - totalHargaTipeHotel;

    // Format response dengan detail lengkap
    const formattedPesanan = {
      id: pesanan.id,
      user_id: pesanan.user_id,
      invoice: pesanan.invoice,
      status_pesanan: pesanan.pembayaran?.status || 'belum-bayar',
      tanggal_pemesanan: pesanan.created_at,
      total_harga: totalHarga,
      informasi_booking: {
        layanan: 'Pet Hotel',
        klinik: {
          id: pesanan.klinik?.id,
          nama: pesanan.klinik?.nama_klinik,
          alamat: pesanan.klinik?.alamat_klinik,
          telepon: pesanan.klinik?.no_tlpn_klinik,
          logo_klinik: pesanan.klinik?.gambar?.[0]?.logo_klinik 
            ? createImageUrl(pesanan.klinik.gambar[0].logo_klinik, uploadFolders.klinikImages)
            : null,
          thumbnail_klinik: pesanan.klinik?.gambar?.[0]?.thumbnail_klinik 
            ? createImageUrl(pesanan.klinik.gambar[0].thumbnail_klinik, uploadFolders.klinikImages)
            : null
        },
        tanggal_check_in: pesanan.tanggal_check_in,
        tanggal_check_out: pesanan.tanggal_check_out,
        waktu_kedatangan: pesanan.waktu_kedatangan,
        waktu_penjemputan: pesanan.waktu_penjemputan,
        tipe_booking: pesanan.tipe_booking_pet_hotel
      },
      informasi_hewan: pesanan.detail_booking?.map(detail => ({
        hewan: {
          id: detail.hewan?.id,
          nama: detail.hewan?.nama_hewan,
          jenis: detail.hewan?.jenis_hewan_id,
          jenis_kelamin: detail.hewan?.jenis_kelamin,
          berat_badan: detail.hewan?.berat_badan,
          warna: detail.hewan?.warna,
          ras: detail.hewan?.ras,
          umur: detail.hewan?.umur,
          gambar_hewan: detail.hewan?.gambar?.[0]?.profile_hewan 
            ? createImageUrl(detail.hewan.gambar[0].profile_hewan, uploadFolders.petImages)
            : null
        },
        tipe_hotel: {
          id: detail.tipe?.id,
          nama: detail.tipe?.tipe_hotel,
          harga: parseFloat(detail.tipe?.harga_pet_hotel)
        },
        kondisi_hewan: detail.kondisi_hewan,
        permintaan_khusus: detail.permintaan_khusus || ""
      })) || [],
      metode_pembayaran: pesanan.payment ? {
        id: pesanan.payment.id,
        nama: pesanan.payment.nama_metode,
        slug: pesanan.payment.slug,
        gambar_payment: pesanan.payment.gambar_payment 
          ? createImageUrl(pesanan.payment.gambar_payment, uploadFolders.paymentImages)
          : null
      } : null,
      informasi_pembayaran: pesanan.pembayaran ? {
        id: pesanan.pembayaran.id,
        status: pesanan.pembayaran.status,
        bukti_pembayaran: pesanan.pembayaran.bukti_pembayaran 
          ? createBuktiTransferUrl(pesanan.pembayaran.bukti_pembayaran)
          : null,
        tanggal_pembayaran: pesanan.pembayaran.created_at,
        terakhir_diupdate: pesanan.pembayaran.updated_at
      } : null,
      rincian_pesanan: {
        detail_tipe_hotel: detailHargaTipeHotel,
        total_harga_tipe_hotel: totalHargaTipeHotel,
        biaya_admin: biayaAdmin,
        total_harga: totalHarga
      },
      coin_didapat: pesanan.pembayaran?.koin_didapat || 0
    };

    return res.status(200).json({
      status: true,
      message: "Berhasil mengambil detail pesanan",
      data: formattedPesanan
    });
  } catch (error) {
    console.error("Error in getPesananById:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};