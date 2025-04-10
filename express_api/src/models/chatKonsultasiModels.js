// chatKonsultasiModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ChatKonsultasi = sequelize.define('ChatKonsultasi', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  konsultasi_online_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  dokter_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  pesan_konsultasi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status_pesan_konsultasi: {
    type: DataTypes.ENUM('terkirim', 'dibaca', 'dihapus'),
    allowNull: false,
    defaultValue: 'terkirim',
  },
  waktu_mulai_konsultasi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  waktu_selesai_konsultasi: {
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
  tableName: 'chat_konsultasi',
  timestamps: true,
  underscored: true,
});

export default ChatKonsultasi;