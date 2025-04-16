// routes/konsultasiRoutes.js

import express from 'express';
import * as checkoutController from '../controllers/booking_konsultasi/checkoutKonsultasiController.js';
import * as pembayaranController from '../controllers/booking_konsultasi/pembayaranKonsultasiController.js';
import * as pesananController from '../controllers/booking_konsultasi/pesananKonsultasiController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadBuktiTransfer } from '../utils/uploadBuktiTransferUtils.js';

const router = express.Router();

// Middleware untuk semua route
router.use(authMiddleware);

// Routes untuk checkout konsultasi
router.get('/checkout-form', checkoutController.getCheckoutForm);
router.post('/checkout', checkoutController.createCheckout);

// Routes untuk pesanan
router.get('/orders/:id', pesananController.getOrderById);
router.get('/orders/invoice/:invoice', pesananController.getOrderByInvoice);

// Routes untuk pembayaran
router.post('/payment/:id/upload', uploadBuktiTransfer.single('bukti_pembayaran'), pembayaranController.uploadBuktiPembayaran);
router.put('/payment/:id/status', pembayaranController.updatePaymentStatus); 

export default router;