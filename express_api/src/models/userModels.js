// models/userModels.js

import { DataTypes } from 'sequelize'; 
import sequelize from '../config/db.js'; 
import { Op } from 'sequelize';

// relasi import
import {AlamatUser} from './alamatUserModels.js';

// Model User
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    id_google: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    remember_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    otp_code: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    otp_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

// Model GambarUser
const GambarUser = sequelize.define(
  'GambarUser',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    users_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    gambar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'gambar_user',
    timestamps: true,
    underscored: true,
  }
);

// Relasi
User.hasMany(GambarUser, { foreignKey: 'users_id', as: 'gambar' });
GambarUser.belongsTo(User, { foreignKey: 'users_id', as: 'user' });
User.hasMany(AlamatUser, { foreignKey: 'user_id', as: 'alamat' });

// Ekspor model
export { User, GambarUser };