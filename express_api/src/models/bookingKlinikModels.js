// models/bookingKlinikModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { Klinik } from './klinikModels.js'; // pastikan import model Klinik
import { Payment } from './configPembayaranModels.js'; // Tambahkan import Payment
// Tambahkan import BookingKlinik kalau dipisahkan file-nya
// (Saya asumsikan BookingKlinik, CheckoutBookingKlinik, dsb. memang di file ini)


// === Model BookingKlinik ===
const BookingKlinik = sequelize.define('BookingKlinik', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  layanan_klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  alamat_user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  tipe_booking: {
    type: DataTypes.ENUM('booking_antar_jemput', 'booking_ke_klinik'),
    allowNull: false,
  },
  tanggal_booking: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  waktu_booking: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'booking_klinik',
  timestamps: true,
  underscored: true,
});

// === Model CheckoutBookingKlinik ===
const CheckoutBookingKlinik = sequelize.define('CheckoutBookingKlinik', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  // Tambahkan di sini:
  booking_klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  keluhan_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  config_pembayaran_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  tanggal_checkout_booking_klinik: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  invoice: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'checkout_booking_klinik',
  timestamps: true,
  underscored: true,
});

// === Model PembayaranKlinik ===
const PembayaranKlinik = sequelize.define('PembayaranKlinik', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  checkout_booking_klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  payment_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  total_biaya: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('selesai', 'tertunda', 'dibatalkan'),
    allowNull: false,
    defaultValue: 'tertunda',
  },
  bukti_pembayaran: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  kategori_status_history_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  koin_didapat: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'pembayaran_klinik',
  timestamps: true,
  underscored: true,
});

// === Relasi ===

// BookingKlinik → Klinik
BookingKlinik.belongsTo(Klinik, { foreignKey: 'klinik_id', as: 'klinik' });

// (1) PERBAIKI: CheckoutBookingKlinik → BookingKlinik
CheckoutBookingKlinik.belongsTo(BookingKlinik, { 
  foreignKey: 'booking_klinik_id', 
  as: 'booking' 
});

// (2) PembayaranKlinik → CheckoutBookingKlinik
PembayaranKlinik.belongsTo(CheckoutBookingKlinik, { 
  foreignKey: 'checkout_booking_klinik_id', 
  as: 'checkout' 
});

// Tambahkan relasi PembayaranKlinik → Payment
PembayaranKlinik.belongsTo(Payment, {
  foreignKey: 'payment_id',
  as: 'payment'
});

export { BookingKlinik, CheckoutBookingKlinik, PembayaranKlinik };
