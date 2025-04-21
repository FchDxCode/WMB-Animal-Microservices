import { Payment } from '../models/configPembayaranModels.js';
import { createImageUrl, uploadFolders } from '../utils/uploadUtils.js';

/**
 * Mendapatkan semua data metode pembayaran
 */
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      order: [['created_at', 'DESC']]
    });

    // Tambahkan URL gambar lengkap
    const paymentsWithImageUrl = payments.map(payment => {
      const paymentData = payment.toJSON();
      if (paymentData.gambar_payment) {
        paymentData.gambar_payment_url = createImageUrl(
          paymentData.gambar_payment,
          uploadFolders.paymentImages
        );
      }
      return paymentData;
    });

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data metode pembayaran',
      data: paymentsWithImageUrl
    });
  } catch (error) {
    console.error('Error in getAllPayments:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
};

/**
 * Mendapatkan data metode pembayaran berdasarkan ID
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Metode pembayaran tidak ditemukan'
      });
    }

    const paymentData = payment.toJSON();
    if (paymentData.gambar_payment) {
      paymentData.gambar_payment_url = createImageUrl(
        paymentData.gambar_payment,
        uploadFolders.paymentImages
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data metode pembayaran',
      data: paymentData
    });
  } catch (error) {
    console.error('Error in getPaymentById:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
};

/**
 * Mendapatkan data metode pembayaran berdasarkan slug
 */
export const getPaymentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const payment = await Payment.findOne({
      where: { slug }
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Metode pembayaran tidak ditemukan'
      });
    }

    const paymentData = payment.toJSON();
    if (paymentData.gambar_payment) {
      paymentData.gambar_payment_url = createImageUrl(
        paymentData.gambar_payment,
        uploadFolders.paymentImages
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data metode pembayaran',
      data: paymentData
    });
  } catch (error) {
    console.error('Error in getPaymentBySlug:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
};