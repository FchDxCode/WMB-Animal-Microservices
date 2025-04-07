import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// === Model ConfigPembayaran ===
const ConfigPembayaran = sequelize.define('ConfigPembayaran', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  admin_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  biaya_admin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  no_rekening_admin: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  biaya_booking: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  persentase_coin: {
    type: DataTypes.DECIMAL(5, 2),
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
  tableName: 'config_pembayaran',
  timestamps: true,
  underscored: true,
});

export { ConfigPembayaran };
