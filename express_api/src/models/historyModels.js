// historyModels.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const StatusHistory = sequelize.define('StatusHistory', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
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
  tableName: 'status_history',
  timestamps: true,
  underscored: true,
});

const HistoryLayanan = sequelize.define('HistoryLayanan', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  pembayaran_konsultasi_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  pembayaran_klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  pembayaran_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  pembayaran_house_call_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  status_history_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
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
  tableName: 'history_layanan',
  timestamps: true,
  underscored: true,
});

export { StatusHistory, HistoryLayanan };