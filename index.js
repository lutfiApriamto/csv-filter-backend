const multer = require('multer');
const cors = require('cors');
const Papa = require('papaparse');
const express = require('express');

// Setup express
const app = express();
const port = 5000;

// Mengizinkan permintaan dari front-end
app.use(cors({
  origin: 'https://dot-filter-app.vercel.app'
}));

// Menggunakan penyimpanan di memori untuk multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route untuk upload dan proses file CSV
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;

    // Membaca file CSV dari buffer
    const data = file.buffer.toString('utf8');

    // Parsing CSV menggunakan papaparse
    const parsedData = Papa.parse(data, { header: true });

    // Track numbers that have been seen
    const uniqueNumbers = new Set();

    // Filter, remove duplicates, dan ubah nama kolom phone_number menjadi number
    const filteredData = parsedData.data
      .filter(row => row.name && row.phone_number && row.phone_number.startsWith('08')) 
      .map(row => {
        const cleanedName = row.name.replace(/"+/g, '');  // Membersihkan tanda petik ganda
        const finalName = `"${cleanedName}"`;  // Menambahkan tanda petik ganda di awal dan akhir
        const cleanedNumber = row.phone_number.replace(/-/g, '').replace(/^0/, '+62');  // Ubah format nomor

        return {
          name: finalName,
          number: cleanedNumber
        };
      })
      .filter(row => {
        if (!uniqueNumbers.has(row.number)) {
          uniqueNumbers.add(row.number);  // Tambahkan nomor ke set jika belum ada
          return true;
        }
        return false;
      });

    // Menyusun CSV secara manual
    let csvContent = 'name,number\n';
    filteredData.forEach(row => {
      csvContent += `${row.name},${row.number}\n`;
    });

    // Mengirim file CSV yang sudah difilter kepada client
    res.attachment('filtered_data.csv');
    res.status(200).send(csvContent);

  } catch (err) {
    res.status(500).send('Error processing file');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
