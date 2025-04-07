import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { HewanPeliharaan } from './petModels.js';

// === Model Keluhan ===
const Keluhan = sequelize.define('Keluhan', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  hewan_peliharaan_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  keluhan: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipe_layanan: {
    type: DataTypes.ENUM('klinik', 'housecall', 'konsultasi'),
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
  tableName: 'keluhan',
  timestamps: true,
  underscored: true,
});

Keluhan.belongsTo(HewanPeliharaan, { foreignKey: 'hewan_peliharaan_id', as: 'hewan' });

export { Keluhan };
