// models/keranjangProdukModels.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const KeranjangProduk = sequelize.define('KeranjangProduk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  stok_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  jumlah_dibeli: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0,
  },
  subtotal_harga: {
    type: DataTypes.DECIMAL(10, 2),
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
  tableName: 'keranjang_produk',
  timestamps: true,
  underscored: true,
});

export default KeranjangProduk;