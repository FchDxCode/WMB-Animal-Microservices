// models/checkoutProdukModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ConfigPembayaran } from './configPembayaranModels.js';
import { AlamatUser } from './alamatUserModels.js';
import { User } from './userModels.js';

const EkspedisiData = sequelize.define('EkspedisiData', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nama_ekspedisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  ongkir: {
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
  tableName: 'ekspedisi_data',
  timestamps: true,
  underscored: true,
});

const CheckoutProduk = sequelize.define('CheckoutProduk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  alamat_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  ekspedisi_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  config_pembayaran_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  payment_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  total_pesanan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal_produk: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  invoice: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tanggal_checkout_produk: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  koin_digunakan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
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
  tableName: 'checkout_produk',
  timestamps: true,
  underscored: true,
});

// CheckoutItem model
const CheckoutItem = sequelize.define('CheckoutItem', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  checkout_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  stok_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  jumlah: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  harga_satuan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  diskon_satuan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  subtotal: {
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
  tableName: 'checkout_items',
  timestamps: true,
  underscored: true,
});

const PembayaranProduk = sequelize.define('PembayaranProduk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  checkout_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  invoice: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  config_pembayaran_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  bukti_pembayaran: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('selesai', 'tertunda', 'dibatalkan'),
    allowNull: false,
    defaultValue: 'tertunda',
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
  tableName: 'pembayaran_produk',
  timestamps: true,
  underscored: true,
});

// Relasi antara CheckoutProduk dan EkspedisiData
CheckoutProduk.belongsTo(EkspedisiData, { foreignKey: 'ekspedisi_id', as: 'ekspedisi' });
EkspedisiData.hasMany(CheckoutProduk, { foreignKey: 'ekspedisi_id', as: 'checkout_produk' });

// Relasi antara PembayaranProduk dan CheckoutProduk
PembayaranProduk.belongsTo(CheckoutProduk, { foreignKey: 'checkout_produk_id', as: 'checkout' });
CheckoutProduk.hasOne(PembayaranProduk, { foreignKey: 'checkout_produk_id', as: 'pembayaran' });

// Relasi antara CheckoutProduk dan CheckoutItem
CheckoutProduk.hasMany(CheckoutItem, { foreignKey: 'checkout_produk_id', as: 'items' });
CheckoutItem.belongsTo(CheckoutProduk, { foreignKey: 'checkout_produk_id', as: 'checkout' });

// Relasi antara ConfigPembayaran dan PembayaranProduk
PembayaranProduk.belongsTo(ConfigPembayaran, { foreignKey: 'config_pembayaran_id', as: 'config_pembayaran' });
ConfigPembayaran.hasMany(PembayaranProduk, { foreignKey: 'config_pembayaran_id', as: 'pembayaran_produk' });

// Relasi antara CheckoutProduk dan AlamatUser
CheckoutProduk.belongsTo(AlamatUser, { foreignKey: 'alamat_id', as: 'alamat' });
AlamatUser.hasMany(CheckoutProduk, { foreignKey: 'alamat_id', as: 'checkout_produk' });

// Relasi antara CheckoutProduk dan User
CheckoutProduk.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(CheckoutProduk, { foreignKey: 'user_id', as: 'checkout_produk' });

export { EkspedisiData, CheckoutProduk, PembayaranProduk, CheckoutItem };