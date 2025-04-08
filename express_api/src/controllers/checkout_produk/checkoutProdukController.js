import { AlamatUser, Provinsi, KabupatenKota, Kecamatan } from '../models/alamatUserModels.js';
import { EkspedisiData, CheckoutProduk, PembayaranProduk } from '../models/checkoutProdukModels.js';
import { CoinHistory, TotalCoinUser } from '../models/userCoinModels.js';
import { ConfigPembayaran } from '../models/configPembayaranModels.js';
import { KeranjangProduk } from '../models/keranjangProdukModels.js';
import { Produk, GambarProduk } from '../models/produkModels.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// Helper function untuk generate invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `INV/${year}${month}${day}/${random}`;
};

// Get alamat user
export const getAlamatUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const alamatList = await AlamatUser.findAll({
      where: { user_id: userId },
      include: [
        { model: Provinsi, as: 'provinsi' },
        { model: KabupatenKota, as: 'kabupatenKota' },
        { model: Kecamatan, as: 'kecamatan' }
      ],
      order: [['created_at', 'DESC']]
    });
    
    if (alamatList.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alamat belum ditambahkan, silakan tambahkan alamat terlebih dahulu'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: alamatList
    });
  } catch (error) {
    console.error('Error mendapatkan alamat user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data alamat',
      error: error.message
    });
  }
};

// Get ekspedisi
export const getEkspedisi = async (req, res) => {
  try {
    const ekspedisiList = await EkspedisiData.findAll({
      order: [['nama_ekspedisi', 'ASC']]
    });
    
    if (ekspedisiList.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data ekspedisi tidak ditemukan'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: ekspedisiList
    });
  } catch (error) {
    console.error('Error mendapatkan ekspedisi:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data ekspedisi',
      error: error.message
    });
  }
};

// Checkout kalkulasi
export const checkoutCalculation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { alamat_id, ekspedisi_id, use_coin } = req.body;
    
    // Validasi input
    if (!alamat_id || !ekspedisi_id) {
      return res.status(400).json({
        success: false,
        message: 'Alamat dan ekspedisi harus dipilih'
      });
    }
    
    // Cek alamat
    const alamat = await AlamatUser.findOne({
      where: { id: alamat_id, user_id: userId },
      include: [
        { model: Provinsi, as: 'provinsi' },
        { model: KabupatenKota, as: 'kabupatenKota' },
        { model: Kecamatan, as: 'kecamatan' }
      ]
    });
    
    if (!alamat) {
      return res.status(404).json({
        success: false,
        message: 'Alamat tidak ditemukan'
      });
    }
    
    // Cek ekspedisi
    const ekspedisi = await EkspedisiData.findByPk(ekspedisi_id);
    if (!ekspedisi) {
      return res.status(404).json({
        success: false,
        message: 'Ekspedisi tidak ditemukan'
      });
    }
    
    // Ambil config pembayaran
    const configPembayaran = await ConfigPembayaran.findOne({
      order: [['created_at', 'DESC']]
    });
    
    if (!configPembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi pembayaran tidak ditemukan'
      });
    }
    
    // Ambil produk dari keranjang
    const keranjangItems = await KeranjangProduk.findAll({
      where: { user_id: userId },
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
    
    if (keranjangItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Keranjang kosong, tidak ada produk untuk di-checkout'
      });
    }
    
    // Kalkulasi subtotal produk
    let totalBeratProduk = 0;
    let subtotalProduk = 0;
    let totalItems = 0;
    
    const produkItems = keranjangItems.map(item => {
      const hargaSetelahDiskon = item.produk.diskon_produk 
        ? item.produk.harga_produk - item.produk.diskon_produk 
        : item.produk.harga_produk;
      
      totalBeratProduk += (item.produk.berat || 0) * item.jumlah_dibeli;
      subtotalProduk += parseFloat(item.subtotal_harga);
      totalItems += item.jumlah_dibeli;
      
      return {
        id: item.id,
        produk_id: item.produk_id,
        stok_produk_id: item.stok_produk_id,
        nama_produk: item.produk.nama_produk,
        harga_satuan: item.produk.harga_produk,
        diskon_satuan: item.produk.diskon_produk || 0,
        harga_setelah_diskon: hargaSetelahDiskon,
        jumlah: item.jumlah_dibeli,
        subtotal: item.subtotal_harga,
        gambar: item.produk.gambar_produk.length > 0 
          ? item.produk.gambar_produk[0].gambar 
          : null
      };
    });
    
    // Hitung ongkir
    const ongkir = parseFloat(ekspedisi.ongkir);
    
    // Hitung biaya admin
    const biayaAdmin = parseFloat(configPembayaran.biaya_admin);
    
    // Cek koin user
    const userCoin = await TotalCoinUser.findOne({
      where: { user_id: userId }
    });
    
    const totalCoin = userCoin ? parseFloat(userCoin.total_coin) : 0;
    
    // Hitung penggunaan koin
    let koinDipakai = 0;
    if (use_coin && totalCoin > 0) {
      if (subtotalProduk < 20000) {
        // Gunakan 1/2 dari koin yang dimiliki
        koinDipakai = Math.min(totalCoin / 2, subtotalProduk);
      } else {
        // Gunakan maksimal 10.000 koin jika harga di atas 20.000
        koinDipakai = Math.min(totalCoin, 10000, subtotalProduk);
      }
    }
    
    // Hitung total pesanan
    const totalPesanan = subtotalProduk + ongkir + biayaAdmin - koinDipakai;
    
    // Hitung perkiraan koin yang akan didapat
    const persentaseCoin = parseFloat(configPembayaran.persentase_coin) / 100;
    const koinDidapat = Math.floor(subtotalProduk * persentaseCoin);
    
    return res.status(200).json({
      success: true,
      data: {
        alamat: {
          id: alamat.id,
          nama_lengkap: alamat.nama_lengkap,
          no_tlpn: alamat.no_tlpn,
          provinsi: alamat.provinsi.provinsi,
          kabupaten_kota: alamat.kabupatenKota.nama_kabupaten_kota,
          kecamatan: alamat.kecamatan.nama_kecamatan,
          kode_pos: alamat.kode_pos,
          detail_alamat: alamat.detail_alamat
        },
        ekspedisi: {
          id: ekspedisi.id,
          nama_ekspedisi: ekspedisi.nama_ekspedisi,
          ongkir: ekspedisi.ongkir
        },
        produk_items: produkItems,
        ringkasan_pesanan: {
          total_items: totalItems,
          total_berat: totalBeratProduk,
          subtotal_produk: subtotalProduk,
          ongkir: ongkir,
          biaya_admin: biayaAdmin,
          koin_dipakai: koinDipakai,
          total_pesanan: totalPesanan,
          koin_akan_didapat: koinDidapat
        },
        koin_tersedia: totalCoin,
        config_pembayaran: {
          id: configPembayaran.id,
          biaya_admin: configPembayaran.biaya_admin,
          persentase_coin: configPembayaran.persentase_coin,
          no_rekening_admin: configPembayaran.no_rekening_admin
        }
      }
    });
  } catch (error) {
    console.error('Error kalkulasi checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat kalkulasi checkout',
      error: error.message
    });
  }
};

// Proses checkout
export const processCheckout = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const {
      alamat_id,
      ekspedisi_id,
      use_coin,
      metode_pembayaran,
      item_ids // ID keranjang yang akan di-checkout
    } = req.body;
    
    // Validasi input
    if (!alamat_id || !ekspedisi_id || !metode_pembayaran || !item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Data checkout tidak lengkap'
      });
    }
    
    // Validasi metode pembayaran
    if (!['whatsapp', 'transfer'].includes(metode_pembayaran)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran tidak valid'
      });
    }
    
    // Cek alamat
    const alamat = await AlamatUser.findOne({
      where: { id: alamat_id, user_id: userId },
      transaction
    });
    
    if (!alamat) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Alamat tidak ditemukan'
      });
    }
    
    // Cek ekspedisi
    const ekspedisi = await EkspedisiData.findByPk(ekspedisi_id, { transaction });
    if (!ekspedisi) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ekspedisi tidak ditemukan'
      });
    }
    
    // Ambil config pembayaran
    const configPembayaran = await ConfigPembayaran.findOne({
      order: [['created_at', 'DESC']],
      transaction
    });
    
    if (!configPembayaran) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi pembayaran tidak ditemukan'
      });
    }
    
    // Ambil produk dari keranjang
    const keranjangItems = await KeranjangProduk.findAll({
      where: { 
        id: { [Op.in]: item_ids },
        user_id: userId
      },
      include: [
        {
          model: Produk,
          as: 'produk'
        }
      ],
      transaction
    });
    
    if (keranjangItems.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan di keranjang'
      });
    }
    
    // Cek stok produk
    for (const item of keranjangItems) {
      if (item.produk.stok_produk < item.jumlah_dibeli) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Stok produk ${item.produk.nama_produk} tidak mencukupi`
        });
      }
      
      // Kurangi stok produk
      await Produk.update(
        { stok_produk: item.produk.stok_produk - item.jumlah_dibeli },
        { 
          where: { id: item.produk_id },
          transaction
        }
      );
    }
    
    // Kalkulasi subtotal produk
    let subtotalProduk = 0;
    
    keranjangItems.forEach(item => {
      subtotalProduk += parseFloat(item.subtotal_harga);
    });
    
    // Hitung ongkir
    const ongkir = parseFloat(ekspedisi.ongkir);
    
    // Hitung biaya admin
    const biayaAdmin = parseFloat(configPembayaran.biaya_admin);
    
    // Cek koin user
    const userCoin = await TotalCoinUser.findOne({
      where: { user_id: userId },
      transaction
    });
    
    const totalCoin = userCoin ? parseFloat(userCoin.total_coin) : 0;
    
    // Hitung penggunaan koin
    let koinDipakai = 0;
    if (use_coin && totalCoin > 0) {
      if (subtotalProduk < 20000) {
        // Gunakan 1/2 dari koin yang dimiliki
        koinDipakai = Math.min(totalCoin / 2, subtotalProduk);
      } else {
        // Gunakan maksimal 10.000 koin jika harga di atas 20.000
        koinDipakai = Math.min(totalCoin, 10000, subtotalProduk);
      }
    }
    
    // Hitung total pesanan
    const totalPesanan = subtotalProduk + ongkir + biayaAdmin - koinDipakai;
    
    // Generate invoice
    const invoice = generateInvoiceNumber();
    
    // Buat checkout
    const checkout = await CheckoutProduk.create({
      user_id: userId,
      alamat_id,
      ekspedisi_id,
      config_pembayaran_id: configPembayaran.id,
      metode_pembayaran,
      total_pesanan: totalPesanan,
      subtotal_produk: subtotalProduk,
      invoice,
      tanggal_checkout_produk: new Date(),
      koin_digunakan: koinDipakai
    }, { transaction });
    
    // Simpan detail checkout items
    const checkoutItems = [];
    for (const item of keranjangItems) {
      const checkoutItem = await CheckoutItem.create({
        checkout_produk_id: checkout.id,
        produk_id: item.produk_id,
        stok_produk_id: item.stok_produk_id,
        jumlah: item.jumlah_dibeli,
        harga_satuan: item.produk.harga_produk,
        diskon_satuan: item.produk.diskon_produk || 0,
        subtotal: item.subtotal_harga
      }, { transaction });
      
      checkoutItems.push(checkoutItem);
    }
    
    // Buat pembayaran
    const pembayaran = await PembayaranProduk.create({
      checkout_produk_id: checkout.id,
      invoice,
      config_pembayaran_id: configPembayaran.id,
      status: 'tertunda',
      kategori_status_history_id: 1 // Asumsi 1 adalah status "Menunggu Pembayaran"
    }, { transaction });
    
    // Jika menggunakan koin, reservasi koin (belum dikurangi)
    if (koinDipakai > 0) {
      await CoinHistory.create({
        user_id: userId,
        pembayaran_produk_id: pembayaran.id,
        coin_di_gunakan: koinDipakai,
        tanggal_digunakan: new Date(),
        status_coin: 'reserved' // Status reservasi untuk diverifikasi nanti
      }, { transaction });
    }
    
    // Hapus produk dari keranjang
    await KeranjangProduk.destroy({
      where: { 
        id: { [Op.in]: item_ids },
        user_id: userId
      },
      transaction
    });
    
    await transaction.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Checkout berhasil',
      data: {
        checkout_id: checkout.id,
        pembayaran_id: pembayaran.id,
        invoice,
        total_pesanan: totalPesanan,
        koin_digunakan: koinDipakai,
        metode_pembayaran
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error proses checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat proses checkout',
      error: error.message
    });
  }
};