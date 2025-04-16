// controllers/checkout_produk/checkoutProdukController.js
import { CheckoutProduk, CheckoutItem, PembayaranProduk, EkspedisiData } from '../../models/checkoutProdukModels.js';
import KeranjangProduk from '../../models/keranjangProdukModels.js';
import { Produk, GambarProduk } from '../../models/produkModels.js';
import { AlamatUser } from '../../models/alamatUserModels.js';
import { TotalCoinUser, CoinHistory } from '../../models/userCoinModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { generateInvoiceNumber } from '../../utils/invoiceGeneratorUtils.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import sequelize from '../../config/db.js';
import { StatusHistory, HistoryLayanan } from '../../models/historyModels.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';

/**
 * Mendapatkan data untuk tampilan halaman checkout
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const getCheckoutData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Ambil keranjang pengguna dengan include gambar produk
    const cartItems = await KeranjangProduk.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Produk,
          as: 'produk',
          attributes: ['id', 'nama_produk', 'harga_produk', 'diskon_produk', 'berat_produk'],
          include: [
            {
              model: GambarProduk,
              as: 'gambar_produk',
              attributes: ['id', 'gambar'],
              limit: 1 // Hanya ambil 1 gambar untuk setiap produk
            }
          ]
        }
      ]
    });
    
    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja kosong'
      });
    }
    
    // Format cart items untuk menyertakan URL gambar
    const formattedCartItems = cartItems.map(item => {
      const harga = item.produk.harga_produk;
      const diskon = item.produk.diskon_produk || 0;
      const hargaSetelahDiskon = harga - diskon;
      
      return {
        id: item.id,
        produk_id: item.produk_id,
        stok_produk_id: item.stok_produk_id,
        jumlah_dibeli: item.jumlah_dibeli,
        subtotal_harga: item.subtotal_harga,
        produk: {
          id: item.produk.id,
          nama_produk: item.produk.nama_produk,
          harga_produk: item.produk.harga_produk,
          diskon_produk: item.produk.diskon_produk,
          berat_produk: item.produk.berat_produk,
          harga_setelah_diskon: hargaSetelahDiskon,
          gambar_produk: item.produk.gambar_produk && item.produk.gambar_produk.length > 0 
            ? createImageUrl(item.produk.gambar_produk[0].gambar, uploadFolders.productImages)
            : null
        }
      };
    });
    
    // Ambil alamat pengguna
    const addresses = await AlamatUser.findAll({
      where: { user_id: userId },
      attributes: ['id', 'nama_lengkap', 'no_tlpn', 'detail_alamat', 'kode_pos']
    });
    
    // Ambil ekspedisi yang tersedia
    const ekspedisi = await EkspedisiData.findAll({
      attributes: ['id', 'nama_ekspedisi', 'ongkir']
    });
    
    // Ambil konfigurasi pembayaran
    const configPembayaran = await ConfigPembayaran.findOne();
    
    // Ambil total coin pengguna
    const userCoin = await TotalCoinUser.findOne({
      where: { user_id: userId }
    });
    
    // Hitung subtotal
    let subtotal = 0;
    cartItems.forEach(item => {
      const harga = item.produk.harga_produk;
      const diskon = item.produk.diskon_produk || 0;
      const hargaSetelahDiskon = harga - diskon;
      subtotal += hargaSetelahDiskon * item.jumlah_dibeli;
    });
    
    // Berapa maksimal coin yang bisa digunakan
    const maxCoinUsable = configPembayaran ? 
      Math.min(
        userCoin ? userCoin.total_coin : 0,
        subtotal * (configPembayaran.persentase_coin_digunakan / 100)
      ) : 0;
    
    return res.status(200).json({
      success: true,
      data: {
        cartItems: formattedCartItems,
        addresses,
        ekspedisi,
        subtotal,
        userCoin: userCoin ? userCoin.total_coin : 0,
        maxCoinUsable: Math.floor(maxCoinUsable),
        biayaAdmin: configPembayaran ? configPembayaran.biaya_admin : 0
      }
    });
  } catch (error) {
    console.error('Error getting checkout data:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data checkout',
      error: error.message
    });
  }
};

/**
 * Proses checkout produk
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const processCheckout = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { 
      alamatId, 
      ekspedisiId, 
      metodePembayaranId, 
      gunakanCoin
    } = req.body;
    
    // Validasi input
    if (!alamatId || !ekspedisiId || !metodePembayaranId) {
      return res.status(400).json({
        success: false,
        message: 'Alamat, ekspedisi, dan metode pembayaran harus dipilih'
      });
    }
    
    // Ambil keranjang pengguna
    const cartItems = await KeranjangProduk.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Produk,
          as: 'produk',
          attributes: ['id', 'nama_produk', 'harga_produk', 'diskon_produk', 'stok_produk']
        }
      ],
      transaction: t
    });
    
    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja kosong'
      });
    }
    
    // Verifikasi stok produk cukup
    for (const item of cartItems) {
      if (item.jumlah_dibeli > item.produk.stok_produk) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Stok produk ${item.produk.nama_produk} tidak mencukupi`
        });
      }
    }
    
    // Ambil ekspedisi
    const ekspedisi = await EkspedisiData.findByPk(ekspedisiId, { transaction: t });
    if (!ekspedisi) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ekspedisi tidak ditemukan'
      });
    }
    
    // Ambil config pembayaran
    const configPembayaran = await ConfigPembayaran.findOne({ transaction: t });
    if (!configPembayaran) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi pembayaran tidak ditemukan'
      });
    }
    
    // Hitung subtotal
    let subtotal = 0;
    cartItems.forEach(item => {
      const harga = item.produk.harga_produk;
      const diskon = item.produk.diskon_produk || 0;
      const hargaSetelahDiskon = harga - diskon;
      subtotal += hargaSetelahDiskon * item.jumlah_dibeli;
    });
    
    // Hitung ongkir dan total pesanan
    const ongkir = Number(ekspedisi.ongkir) || 0;
    const biayaAdmin = Number(configPembayaran.biaya_admin) || 0;
    const subtotalNum = Number(subtotal) || 0;
    const totalPesanan = subtotalNum + ongkir + biayaAdmin;
    
    // Proses penggunaan coin
    let finalCoinDigunakan = 0;

    if (gunakanCoin) {
      // Ambil total coin pengguna
      const userCoin = await TotalCoinUser.findOne({
        where: { user_id: userId },
        transaction: t
      });
      
      if (!userCoin || userCoin.total_coin <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Anda tidak memiliki coin untuk digunakan'
        });
      }
      
      // Konversi semua ke number yang valid
      const userTotalCoin = parseInt(userCoin.total_coin, 10) || 0;
      const persentaseCoin = parseFloat(configPembayaran.persentase_coin_digunakan) || 0;
      
      // Hitung maksimal coin yang bisa digunakan (berdasarkan persentase)
      const maxCoinUsable = Math.floor(totalPesanan * (persentaseCoin / 100));
      
      // Gunakan maksimal coin yang diperbolehkan
      finalCoinDigunakan = Math.min(maxCoinUsable, userTotalCoin);
      
      console.log('Debug coin calculation:', {
        totalPesanan, 
        persentaseCoin,
        maxCoinUsable,
        userTotalCoin,
        finalCoinDigunakan
      });
      
      // Kurangi coin user hanya jika ada coin yang digunakan
      if (finalCoinDigunakan > 0) {
        await userCoin.update({
          total_coin: userTotalCoin - finalCoinDigunakan
        }, { transaction: t });
      }
    }
    
    // Generate nomor invoice
    const invoice = generateInvoiceNumber();
    
    // Hitung total setelah coin digunakan
    const totalAfterCoin = Math.max(0, totalPesanan - finalCoinDigunakan);
    
    // Buat checkout produk
    const checkout = await CheckoutProduk.create({
      user_id: userId,
      alamat_id: alamatId,
      ekspedisi_id: ekspedisiId,
      config_pembayaran_id: configPembayaran.id,
      payment_id: metodePembayaranId,
      total_pesanan: totalAfterCoin,
      subtotal_produk: subtotalNum,
      invoice: invoice,
      tanggal_checkout_produk: new Date(),
      koin_digunakan: finalCoinDigunakan
    }, { transaction: t });
    
    // Buat checkout items
    for (const item of cartItems) {
      const harga = item.produk.harga_produk;
      const diskon = item.produk.diskon_produk || 0;
      const hargaSetelahDiskon = harga - diskon;
      
      await CheckoutItem.create({
        checkout_produk_id: checkout.id,
        produk_id: item.produk_id,
        stok_produk_id: item.stok_produk_id,
        jumlah: item.jumlah_dibeli,
        harga_satuan: harga,
        diskon_satuan: diskon,
        subtotal: hargaSetelahDiskon * item.jumlah_dibeli
      }, { transaction: t });
    }
    
    // Buat record pembayaran dengan status tertunda
    const pembayaran = await PembayaranProduk.create({
      checkout_produk_id: checkout.id,
      invoice: invoice,
      config_pembayaran_id: configPembayaran.id,
      status: 'tertunda',
      kategori_status_history_id: 1, // Asumsi 1 adalah ID untuk status 'menunggu pembayaran'
      koin_didapat: 0 // Coin akan ditambahkan saat pembayaran selesai
    }, { transaction: t });
    
    // Tambahkan record ke history layanan
    // Ambil status history untuk checkout
    const statusHistory = await StatusHistory.findOne({
      where: { slug: 'belum-bayar' }, // Sesuaikan dengan slug yang tersedia di tabel status_history
      transaction: t
    });
    
    if (!statusHistory) {
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: 'Status history tidak ditemukan'
      });
    }
    
    // Buat record history layanan
    await HistoryLayanan.create({
      pembayaran_produk_id: pembayaran.id,
      status_history_id: statusHistory.id,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction: t });
    
    // Hapus keranjang setelah checkout
    await KeranjangProduk.destroy({
      where: { user_id: userId },
      transaction: t
    });
    
    await t.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Checkout berhasil',
      data: {
        checkout_id: checkout.id,
        pembayaran_id: pembayaran.id,
        invoice: invoice,
        total_pesanan: totalAfterCoin
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error processing checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses checkout',
      error: error.message
    });
  }
};