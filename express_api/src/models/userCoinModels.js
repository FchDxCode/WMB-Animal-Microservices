// models/userCoinModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export const CoinHistory = sequelize.define('CoinHistory', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  pembayaran_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  pembayaran_klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  pembayaran_konsultasi_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  pembayaran_pet_hotel_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  pembayaran_house_call_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  coin_di_dapat: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  coin_di_gunakan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  tanggal_digunakan: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tanggal_diperoleh: {
    type: DataTypes.DATE,
    allowNull: true,
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
  tableName: 'coin_history',
  timestamps: true,
  underscored: true,
});

export const TotalCoinUser = sequelize.define('TotalCoinUser', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  total_coin: {
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
  tableName: 'total_coin_user',
  timestamps: true,
  underscored: true,
});