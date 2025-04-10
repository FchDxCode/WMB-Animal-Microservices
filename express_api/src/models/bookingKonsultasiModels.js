// bookingKonsultasiModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CheckoutKonsultasi = sequelize.define('CheckoutKonsultasi', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  konsultasi_online_id: {
    type: DataTypes.BIGINT.UNSIGNED,
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

// Relasi antara PembayaranKonsultasi dan CheckoutKonsultasi
PembayaranKonsultasi.belongsTo(CheckoutKonsultasi, { foreignKey: 'checkout_konsultasi_id', as: 'checkout' });
CheckoutKonsultasi.hasOne(PembayaranKonsultasi, { foreignKey: 'checkout_konsultasi_id', as: 'pembayaran' });

export { CheckoutKonsultasi, PembayaranKonsultasi };