// bookingKonsultasiModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import ChatKonsultasi from './chatKonsultasiModels.js';
import { HistoryLayanan, StatusHistory } from './historyModels.js';
import { Klinik } from './klinikModels.js';
import { Dokter } from './dokterModels.js';
import { HewanPeliharaan } from './petModels.js';
import { User } from './userModels.js';
import { Payment } from './configPembayaranModels.js';

const CheckoutKonsultasi = sequelize.define('CheckoutKonsultasi', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  dokter_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  hewan_peliharaan_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  payment_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  keluhan: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tanggal_checkout_konsultasi: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lama_konsultasi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Durasi konsultasi dalam menit',
  },
  total_harga: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '* lama_konsultasi * tarif_konsultasi',
  },
  invoice: {
    type: DataTypes.STRING(255),
    allowNull: false,
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
  tableName: 'checkout_konsultasi',
  timestamps: true,
  underscored: true,
});

const PembayaranKonsultasi = sequelize.define('PembayaranKonsultasi', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  checkout_konsultasi_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  bukti_pembayaran: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Path gambar bukti pembayaran',
  },
  status: {
    type: DataTypes.ENUM('belum_bayar', 'diproses', 'selesai', 'tertunda', 'dibatalkan'),
    allowNull: false,
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
  tableName: 'pembayaran_konsultasi',
  timestamps: true,
  underscored: true,
});

// Relasi antara CheckoutKonsultasi dan Payment
CheckoutKonsultasi.belongsTo(Payment, { 
  foreignKey: 'payment_id', 
  as: 'payment' 
});

// Relasi antara PembayaranKonsultasi dan CheckoutKonsultasi
PembayaranKonsultasi.belongsTo(CheckoutKonsultasi, { 
  foreignKey: 'checkout_konsultasi_id', 
  as: 'checkout' 
});
CheckoutKonsultasi.hasOne(PembayaranKonsultasi, { 
  foreignKey: 'checkout_konsultasi_id', 
  as: 'pembayaran' 
});

// Relasi antara PembayaranKonsultasi dan StatusHistory
PembayaranKonsultasi.belongsTo(StatusHistory, { 
  foreignKey: 'kategori_status_history_id', 
  as: 'statusHistory' 
});

// Relasi antara PembayaranKonsultasi dan HistoryLayanan
PembayaranKonsultasi.hasMany(HistoryLayanan, {
  foreignKey: 'pembayaran_konsultasi_id',
  as: 'historyLayanan',
});
HistoryLayanan.belongsTo(PembayaranKonsultasi, {
  foreignKey: 'pembayaran_konsultasi_id',
  as: 'pembayaranKonsultasi',
});

// Relasi antara CheckoutKonsultasi dan ChatKonsultasi
CheckoutKonsultasi.hasMany(ChatKonsultasi, {
  foreignKey: 'checkout_konsultasi_id',
  as: 'chatKonsultasi'
});

// Relasi antara CheckoutKonsultasi dan Klinik
CheckoutKonsultasi.belongsTo(Klinik, { foreignKey: 'klinik_id', as: 'klinik' });

// Relasi antara CheckoutKonsultasi dan Dokter
CheckoutKonsultasi.belongsTo(Dokter, { foreignKey: 'dokter_id', as: 'dokter' });

// Relasi antara CheckoutKonsultasi dan HewanPeliharaan
CheckoutKonsultasi.belongsTo(HewanPeliharaan, { foreignKey: 'hewan_peliharaan_id', as: 'hewan' });

CheckoutKonsultasi.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export { CheckoutKonsultasi, PembayaranKonsultasi };