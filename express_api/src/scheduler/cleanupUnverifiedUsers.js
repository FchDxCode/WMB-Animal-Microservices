import cron from 'node-cron';
import { User } from '../models/userModels.js';

// Jadwalkan job setiap menit
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // Hapus user yang belum diverifikasi dan OTP kadaluarsa
    const deleted = await User.destroy({
      where: {
        email_verified_at: null,
        otp_expires_at: { [Op.lt]: now }, // menggunakan operator Sequelize
      },
    });
    if (deleted > 0) {
      console.log(`Deleted ${deleted} unverified user(s) at ${now.toISOString()}`);
    }
  } catch (error) {
    console.error('Error cleaning up unverified users:', error);
  }
});
