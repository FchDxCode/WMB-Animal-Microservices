// utils/coinCalculator.js
/**
 * Fungsi untuk menghitung koin berdasarkan total biaya dan persentase koin
 * @param {number} totalBiaya Total biaya dalam Rupiah
 * @param {number} persentaseKoin Persentase koin (misalnya, 10 untuk 10%)
 * @returns {number} Jumlah koin yang didapat
 */
export const calculateCoin = (totalBiaya, persentaseKoin) => {
  
  const persentaseDesimal = persentaseKoin / 100;
  return Math.floor(totalBiaya * persentaseDesimal);
};