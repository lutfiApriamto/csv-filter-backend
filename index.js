const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const Papa = require('papaparse');

const app = express();
const port = 5000;

// Mengizinkan permintaan dari front-end yang berjalan di localhost:5173
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Setup multer untuk menyimpan file yang di-upload di folder 'uploads'
const upload = multer({ dest: 'uploads/' });

// Route untuk upload dan proses file CSV
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;

    // Membaca file CSV yang di-upload
    const data = fs.readFileSync(file.path, 'utf8');

    // Parsing CSV menggunakan papaparse
    const parsedData = Papa.parse(data, { header: true });

    // Filter dan ubah nama kolom phone_number menjadi number
    const filteredData = parsedData.data
      .filter(row => row.name && row.phone_number && row.phone_number.startsWith('08')) // Hanya baris dengan nomor telepon yang dimulai dengan 08
      .map(row => {
        // Membersihkan nama (tanpa tanda petik ganda di dalam)
        const cleanedName = row.name.replace(/"+/g, '');  // Hapus tanda petik ganda jika ada
        const finalName = `"${cleanedName}"`;  // Tambahkan tanda petik tunggal di awal dan akhir

        // Bersihkan nomor telepon, hilangkan tanda '-' dan ubah 0 menjadi +62
        const cleanedNumber = row.phone_number.replace(/-/g, '').replace(/^0/, '+62');

        return {
          name: finalName,
          number: cleanedNumber
        };
      });

    // Menyusun CSV secara manual
    let csvContent = 'name,number\n';
    filteredData.forEach(row => {
      csvContent += `${row.name},${row.number}\n`;
    });

    // Hapus file yang di-upload setelah selesai diproses
    fs.unlinkSync(file.path);

    // Mengirim file CSV yang sudah difilter kepada client
    res.attachment('filtered_data.csv');
    res.status(200).send(csvContent);

  } catch (err) {
    // Error handling jika terjadi kesalahan saat proses
    res.status(500).send('Error processing file');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
