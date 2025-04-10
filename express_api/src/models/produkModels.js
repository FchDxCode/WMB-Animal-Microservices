// models/produkModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import KeranjangProduk from './keranjangProdukModels.js';
import { CheckoutItem } from './checkoutProdukModels.js';

// Model Kategori Produk
const KategoriProduk = sequelize.define('KategoriProduk', {
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
  tableName: 'kategori_produk',
  timestamps: true,
  underscored: true,
});

// Model Produk
const Produk = sequelize.define('Produk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  kategori_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  nama_produk: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tampilkan_produk: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  harga_produk: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  diskon_produk: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  berat_produk :{
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  stok_produk: {
    type: DataTypes.INTEGER,
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
  tableName: 'produk',
  timestamps: true,
  underscored: true,
});

// Model Gambar Produk
const GambarProduk = sequelize.define('GambarProduk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  gambar: {
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
  tableName: 'gambar_produk',
  timestamps: true,
  underscored: true,
});

// Relasi antara Produk dan KategoriProduk
Produk.belongsTo(KategoriProduk, { foreignKey: 'kategori_produk_id', as: 'kategori' });
KategoriProduk.hasMany(Produk, { foreignKey: 'kategori_produk_id', as: 'produk' });

// Relasi antara Produk dan GambarProduk
Produk.hasMany(GambarProduk, { foreignKey: 'produk_id', as: 'gambar_produk' });
GambarProduk.belongsTo(Produk, { foreignKey: 'produk_id', as: 'produk' });

// Relasi antara Produk dan KeranjangProduk
Produk.hasMany(KeranjangProduk, { foreignKey: 'produk_id', as: 'keranjang_items' });
KeranjangProduk.belongsTo(Produk, { foreignKey: 'produk_id', as: 'produk' });

// Relasi antara Produk dan CheckoutItem
CheckoutItem.belongsTo(Produk, { foreignKey: 'produk_id', as: 'produk' });
Produk.hasMany(CheckoutItem, { foreignKey: 'produk_id', as: 'checkout_items' });

export { KategoriProduk, Produk, GambarProduk };