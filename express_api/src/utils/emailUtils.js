import transporter from '../config/mail.js';
import { config } from 'dotenv';

config();

const sendOtpEmail = async (to, name, otp) => {
  try {
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to,
      subject: 'Kode Verifikasi Akun Anda',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Verifikasi Akun</h2>
          <p>Halo <b>${name}</b>,</p>
          <p>Terima kasih telah mendaftar. Berikut adalah kode OTP Anda:</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.</p>
          <p>Jika Anda tidak melakukan pendaftaran, silakan abaikan email ini.</p>
          <p>Terima kasih,<br>Tim ${process.env.MAIL_FROM_NAME}</p>
        </div>
      `,
    };  

    const info = await transporter.sendMail(mailOptions);
    console.log('Email terkirim:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Gagal mengirim email:', error);
    return { success: false, error: error.message };
  }
};

// Tes fungsi
// (async () => {
//   const result = await sendOtpEmail('test@example.com', 'Test User', '123456');
//   console.log(result);
// })();

export { sendOtpEmail };