/**
 * Mock data untuk Toko Mitra Terpercaya di Bantuin.id
 * Fokus 100% untuk Penyewaan / Rental Barang Resmi & Terverifikasi
 */

export const MITRA_STORES = {
  "mitra-kamera": {
    id: "mitra-kamera",
    name: "Focus Lens Studio & Rental Kamera",
    tagline: "Rental Kamera Mirrorless, Lensa Premium & Perlengkapan Sinematografi",
    category: "Penyewaan Kamera & Multimedia",
    badge: "Mitra Rental Terverifikasi",
    avatar: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80",
    rating: 4.9,
    reviewCount: 148,
    completedOrders: 520,
    responseTime: "< 10 menit",
    joinedYear: "2023",
    operationalHours: "Setiap Hari, 08:00 - 22:00 WIB",
    address: "Jl. Prof. Dr. Suharso No. 18 (Dekat GOR Satria)",
    whatsapp: "081234567890",
    about: "Pusat persewaan kamera digital profesional, mirrorless Sony/Canon/Fujifilm, lensa bokeh/tele, stabilizer gimbal, lighting studio, dan drone. Melayani kebutuhan tugas kuliah, wisuda, dokumentasi event, hingga produksi film indie. Unit terawat, sensor bersih, dan garansi fungsi.",
    securityDepositPolicy: "Wajib menitipkan 1 identitas asli (KTP/KTM) dan verifikasi akun Bantuin saat serah terima barang sewa.",
    catalog: [
      {
        id: "cam-1",
        name: "Sony Alpha A7 III (Body Only)",
        category: "Kamera",
        type: "sewa",
        price: 185000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 4.9,
        reviews: 42,
        stockStatus: "Siap Sewa",
        tag: "Terlaris",
        desc: "Sensor Full-Frame 24.2MP, 4K HDR Video, Dual SD Slot. Termasuk 2 baterai & charger.",
      },
      {
        id: "cam-2",
        name: "Lensa Sony FE 24-70mm F/2.8 GM",
        category: "Lensa",
        type: "sewa",
        price: 150000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 5.0,
        reviews: 29,
        stockStatus: "Siap Sewa",
        tag: "Lensa Primadona",
        desc: "Lensa standar zoom kelas master dengan bokeh tajam dan autofokus instan.",
      },
      {
        id: "cam-3",
        name: "DJI Ronin RS 3 Gimbal Stabilizer",
        category: "Aksesoris",
        type: "sewa",
        price: 95000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1589872766859-ac52827ca1f1?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1589872766859-ac52827ca1f1?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 4.8,
        reviews: 18,
        stockStatus: "Siap Sewa",
        tag: "Stabilizer",
        desc: "Stabilisasi 3-axis mutakhir untuk pengambilan video sinematik bebas getaran.",
      },
      {
        id: "cam-4",
        name: "Godox SL60W LED Video Light + Softbox",
        category: "Lighting",
        type: "sewa",
        price: 60000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1589872766859-ac52827ca1f1?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 4.9,
        reviews: 23,
        stockStatus: "Siap Sewa",
        tag: "Studio Light",
        desc: "Lampu penerangan continuous 60W daylight 5600K dengan softbox payung diffuser.",
      },
      {
        id: "cam-5",
        name: "Fujifilm X-T30 II + XF 18-55mm",
        category: "Kamera",
        type: "sewa",
        price: 125000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 4.9,
        reviews: 36,
        stockStatus: "Siap Sewa",
        tag: "Warna Alami",
        desc: "Warna film recipe legendaris Fujifilm, cocok untuk foto wisuda & street photography.",
      },
      {
        id: "cam-6",
        name: "Wireless Mic Hollyland Lark M1 (Dual TX)",
        category: "Audio",
        type: "sewa",
        price: 50000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 4.8,
        reviews: 15,
        stockStatus: "Siap Sewa",
        tag: "Audio Bersih",
        desc: "Mikrofon klip nirkabel untuk wawancara, konten reels/tiktok, dan dokumentasi seminar.",
      },
      {
        id: "cam-7",
        name: "Drone DJI Mini 2 4K Fly More Combo",
        category: "Drone",
        type: "sewa",
        price: 150000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 4.9,
        reviews: 28,
        stockStatus: "Siap Sewa",
        tag: "Foto Udara",
        desc: "Drone 4K kompak dengan 3 baterai cadangan, jangkauan sinyal jauh, include tas.",
      },
      {
        id: "cam-8",
        name: "Tripod Beike Q999H Heavy Duty",
        category: "Aksesoris",
        type: "sewa",
        price: 35000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80",
        photos: [
          "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1589872766859-ac52827ca1f1?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 4.7,
        reviews: 19,
        stockStatus: "Siap Sewa",
        tag: "Kokoh",
        desc: "Tripod monopod multifungsi dengan arm horizontal untuk flat-lay photography.",
      }
    ],
    reviews: [
      {
        id: "rev-1",
        userName: "Dimas Anggoro",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "2 hari yang lalu",
        item: "Sony Alpha A7 III (Body Only)",
        comment: "Kamera bersih banget, sensor kinclong no debu. Baterai dikasih 2 buah awet seharian buat hunting wisuda. Pelayanan ramah dan tempatnya gampang dicari!",
      },
      {
        id: "rev-2",
        userName: "Natasha Caroline",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "1 minggu yang lalu",
        item: "Fujifilm X-T30 II + XF 18-55mm",
        comment: "Sangat terbantu buat sewa kamera wisuda teman seangkatan. Rekber Bantuin bikin tenang gak takut uang hilang. Tokonya amanah dan tepat waktu!",
      },
      {
        id: "rev-3",
        userName: "Rifky Fauzi",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "2 minggu yang lalu",
        item: "DJI Ronin RS 3 Gimbal Stabilizer",
        comment: "Gimbal dalam kondisi sangat prima. Dipandu cara balancingnya juga sama mas-mas tokonya. Top rekomen buat vendor sewa di sini.",
      },
      {
        id: "rev-4",
        userName: "Siti Rahmawati",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
        rating: 4,
        date: "1 bulan yang lalu",
        item: "Godox SL60W LED Video Light",
        comment: "Lighting terang benderang. Cuma softboxnya agak butuh waktu masang tapi hasilnya memuaskan!",
      },
    ],
    packages: [
      {
        id: "pkg-rnt-1",
        name: "Paket Dokumentasi Wisuda Kilat",
        tier: "Paket Hemat",
        price: 250000,
        duration: "1 Hari (24 Jam)",
        description: "Set lengkap kamera mirrorless + lensa portrait tajam bokeh untuk momen wisuda berkesan.",
        features: [
          "Sony Alpha A7 III / Fujifilm X-T30 II",
          "Lensa Portrait F/1.8 / F/2.8",
          "2 Baterai Cadangan & Dual Charger",
          "SD Card 64GB High Speed V30",
          "Tas Kamera Waterproof"
        ],
        isPopular: true
      },
      {
        id: "pkg-rnt-2",
        name: "Paket Sinematografi & Video Event",
        tier: "Paket Lengkap",
        price: 395000,
        duration: "1 Hari (24 Jam)",
        description: "Set lengkap untuk video sinematik bebas goyang, audio jernih dan lighting studio.",
        features: [
          "Sony Alpha A7 III 4K HDR",
          "Lensa Zoom 24-70mm GM",
          "DJI Ronin RS 3 Gimbal Stabilizer",
          "Wireless Mic Hollyland Lark M1 (Dual TX)",
          "Godox SL60W Video Light + Softbox"
        ],
        isPopular: false
      },
      {
        id: "pkg-rnt-3",
        name: "Paket Podcast & Wawancara Dual Host",
        tier: "Paket Standar",
        price: 180000,
        duration: "1 Hari (24 Jam)",
        description: "Audio kristal jernih dengan 2 mic nirkabel dan lighting portable untuk podcast atau interview.",
        features: [
          "Wireless Mic Hollyland Lark M1 Dual TX",
          "Godox SL60W LED Continuous Light",
          "Tripod Beike Q999H Heavy Duty",
          "Kabel Audio Lightning & Type-C Lengkap"
        ],
        isPopular: false
      }
    ],
    portfolioPhotos: [
      {
        url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        title: "Setup Sony A7 III & Rig Sinematik",
        category: "Kamera & Rig",
        description: "Unit kamera full frame siap pakai untuk dokumentasi video profesional dan event."
      },
      {
        url: "https://images.unsplash.com/photo-1589872766859-ac52827ca1f1?auto=format&fit=crop&w=800&q=80",
        title: "DJI Ronin RS 3 Balancing Test",
        category: "Stabilizer",
        description: "Uji coba balancing gimbal sebelum diserahkan ke penyewa agar hasil pengambilan video mulus."
      },
      {
        url: "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=800&q=80",
        title: "Lighting Studio Godox Softbox Setup",
        category: "Lighting",
        description: "Penyusunan lighting studio daylight 5600K untuk kebutuhan photoshoot wisuda indoor."
      }
    ]
  },

  "mitra-cetak": {
    id: "mitra-cetak",
    name: "Mitra Rental Printer & Mesin Event",
    tagline: "Pusat Penyewaan Printer Laser, Scanner High-Speed & Mesin Dokumen Event",
    category: "Penyewaan Alat Kantor & Event",
    badge: "Mitra Rental Terverifikasi",
    avatar: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1600&q=80",
    rating: 4.8,
    reviewCount: 310,
    completedOrders: 1250,
    responseTime: "< 5 menit",
    joinedYear: "2022",
    operationalHours: "Setiap Hari, 07:00 - 22:00 WIB",
    address: "Jl. Kampus No. 42 (Depan Gerbang Timur Kampus)",
    whatsapp: "081299887766",
    about: "Penyedia sewa printer laser multifungsi, scanner dokumen berkecepatan tinggi, dan mesin jilid/laminating untuk kepanitiaan seminar, registrasi event besar, pameran, serta kebutuhan kantor darurat. Unit lengkap siap pakai sudah termasuk tinta toner penuh.",
    securityDepositPolicy: "Wajib verifikasi identitas (KTP/KTM panitia) dan dana sewa terkunci aman di Rekber Bantuin.",
    catalog: [
      {
        id: "prt-1",
        name: "Sewa Printer Laserjet HP / Brother (High-Speed Wireless)",
        category: "Printer",
        type: "sewa",
        price: 75000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 98,
        stockStatus: "Siap Sewa",
        tag: "Favorit Panitia",
        desc: "Cetak super cepat 30 lembar/menit, koneksi WiFi/USB, termasuk toner penuh siap pakai.",
      },
      {
        id: "prt-2",
        name: "Sewa Scanner Dokumen Otomatis ADF (50 Halaman/Menit)",
        category: "Scanner",
        type: "sewa",
        price: 85000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviews: 42,
        stockStatus: "Siap Sewa",
        tag: "Scan Cepat",
        desc: "Cocok untuk arsip berkas, akreditasi kampus, atau registrasi formulir peserta seminar.",
      },
      {
        id: "prt-3",
        name: "Sewa Printer Foto Warna Epson L8050 (6 Warna)",
        category: "Printer",
        type: "sewa",
        price: 110000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1589384267710-7a25bf614742?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 35,
        stockStatus: "Siap Sewa",
        tag: "Cetak Foto",
        desc: "Kualitas cetak foto laboratorium untuk photobooth event, cetak ID Card, dan sertifikat.",
      },
      {
        id: "prt-4",
        name: "Sewa Mesin Laminating A3 Heavy Duty + Pemotong",
        category: "Finishing",
        type: "sewa",
        price: 35000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviews: 27,
        stockStatus: "Siap Sewa",
        tag: "Praktis",
        desc: "Pemanas ganda cepat panas, anti kusut untuk laminasi ID card & sertifikat event.",
      }
    ],
    reviews: [
      {
        id: "rev-p1",
        userName: "Annisa Larasati",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "3 hari yang lalu",
        item: "Sewa Printer Laserjet HP / Brother",
        comment: "Penyelamat acara seminar kampus! Printer laser lancar jaya buat cetak 500 sertifikat peserta. Tonernya beneran penuh dan admin responsif banget.",
      },
      {
        id: "rev-p2",
        userName: "Fajar Pratama",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "1 minggu yang lalu",
        item: "Sewa Scanner Dokumen Otomatis ADF",
        comment: "Scanner cepat banget, narik kertas lancar tanpa nyangkut. Sewa lewat Rekber Bantuin sangat praktis.",
      }
    ]
  },

  "mitra-sound": {
    id: "mitra-sound",
    name: "ProSound & Audio Equipment",
    tagline: "Sewa Sound System Portable, Wireless Mic & Paket Panggung Acara",
    category: "Penyewaan Audio & Sound System",
    badge: "Mitra Rental Terverifikasi",
    avatar: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
    rating: 4.9,
    reviewCount: 92,
    completedOrders: 280,
    responseTime: "< 15 menit",
    joinedYear: "2023",
    operationalHours: "Setiap Hari, 07:00 - 23:00 WIB",
    address: "Jl. Gerilya Barat No. 88 (Dekat Bunderan)",
    whatsapp: "081322114455",
    about: "Solusi sewa audio profesional untuk berbagai kegiatan: seminar kampus, pengajian, pesta ulang tahun, pentas seni, dan konser akustik. Menyediakan paket sound aktif portable hingga 5000 watt, mixer digital, mic wireless UHF anti putus-putus, serta teknisi standby.",
    securityDepositPolicy: "Unit diantar dan di-setting langsung oleh tim teknisi kami di lokasi acara.",
    catalog: [
      {
        id: "snd-1",
        name: "Sewa Speaker Portable 15 Inch + 2 Mic Wireless",
        category: "Paket Sound",
        type: "sewa",
        price: 200000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 48,
        stockStatus: "Siap Sewa",
        tag: "Favorit Seminar",
        desc: "Speaker aktif trolley dengan roda & baterai tahan 6 jam, Bluetooth & USB audio.",
      },
      {
        id: "snd-2",
        name: "Sewa Sound System Akustik 2000 Watt Komplit",
        category: "Paket Event",
        type: "sewa",
        price: 650000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
        rating: 5.0,
        reviews: 32,
        stockStatus: "Siap Sewa",
        tag: "Event Panggung",
        desc: "Termasuk 2 speaker active 15', 1 sub, mixer 8 channel, 4 mic wireless & operator.",
      },
      {
        id: "snd-3",
        name: "Sewa Mic Wireless Shure UHF (Set 4 Mic)",
        category: "Aksesoris Audio",
        type: "sewa",
        price: 120000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1520523839898-507127042a98?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviews: 21,
        stockStatus: "Siap Sewa",
        tag: "Suara Jernih",
        desc: "Frekuensi UHF stabil tanpa interferensi, baterai awet hingga 8 jam penggunaan.",
      },
      {
        id: "snd-4",
        name: "Sewa Mixer Audio Yamaha 12-Channel USB",
        category: "Mixer",
        type: "sewa",
        price: 150000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 17,
        stockStatus: "Siap Sewa",
        tag: "Mixer Pro",
        desc: "Mixer analog dengan efek SPX digital reverb, koneksi audio interface rekaman laptop.",
      }
    ],
    reviews: [
      {
        id: "rev-s1",
        userName: "Budi Setiawan",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "5 hari yang lalu",
        item: "Sewa Speaker Portable 15 Inch",
        comment: "Acara gathering kantor jadi seru banget berkat sound ini. Suara bass bulet dan mic wirelessnya jernih no kresek-kresek.",
      }
    ]
  },

  "mitra-studio": {
    id: "mitra-studio",
    name: "Lumina Rental Studio & Lighting Foto",
    tagline: "Sewa Studio Foto Per Jam, Lighting Godox, Backdrop & Kostum Toga",
    category: "Penyewaan Studio & Lighting",
    badge: "Mitra Rental Terverifikasi",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80",
    rating: 4.9,
    reviewCount: 165,
    completedOrders: 610,
    responseTime: "< 15 menit",
    joinedYear: "2023",
    operationalHours: "Selasa - Minggu, 09:00 - 20:00 WIB",
    address: "Jl. HR Bunyamin No. 102 (Samping Kafe Kopi)",
    whatsapp: "081255443322",
    about: "Persewaan ruang studio foto berkonsep modern minimalis dengan tata cahaya profesional. Menyediakan sewa studio per jam/sesi, berbagai pilihan backdrop estetik (seamless paper, textured wall), kostum toga wisuda lengkap, dan lighting kit Godox.",
    securityDepositPolicy: "Pemesanan jadwal sewa studio via Escrow Bantuin menjamin slot foto kamu aman tanpa khawatir bentrok antrean.",
    catalog: [
      {
        id: "std-1",
        name: "Sewa Ruang Studio Foto Polos (Backdrop Seamless)",
        category: "Ruang Studio",
        type: "sewa",
        price: 120000,
        unit: "/ jam",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80",
        rating: 5.0,
        reviews: 78,
        stockStatus: "Siap Sewa",
        tag: "Best Seller",
        desc: "Termasuk akses AC dingin, ruang ganti privat, cermin makeup, dan 3 pilihan warna backdrop.",
      },
      {
        id: "std-2",
        name: "Sewa Paket Studio Lengkap + Lighting Godox 300W",
        category: "Paket Studio",
        type: "sewa",
        price: 185000,
        unit: "/ jam",
        image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 84,
        stockStatus: "Siap Sewa",
        tag: "All-in Lighting",
        desc: "Lengkap dengan 2 strobe Godox 300W, softbox oktagonal, trigger wireless & stand.",
      },
      {
        id: "std-3",
        name: "Sewa Kostum Toga Wisuda Kampus Lengkap (Jubah, Topi, Samir)",
        category: "Kostum",
        type: "sewa",
        price: 45000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviews: 35,
        stockStatus: "Siap Sewa",
        tag: "Wisuda Kilat",
        desc: "Baju toga bersih wangi, tersedia berbagai ukuran S sampai XXL dan berbagai warna fakultas.",
      },
      {
        id: "std-4",
        name: "Sewa Studio Lightbox Foto Produk Meja Mini",
        category: "Lighting",
        type: "sewa",
        price: 35000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviews: 29,
        stockStatus: "Siap Sewa",
        tag: "Foto Produk",
        desc: "Tenda kotak foto produk mini 40x40cm dengan LED ringlight terpasang untuk foto online shop.",
      }
    ],
    reviews: [
      {
        id: "rev-st1",
        userName: "Clara Salsabila",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "4 hari yang lalu",
        item: "Sewa Ruang Studio Foto Polos",
        comment: "Studionya bersih dan lightingnya lengkap banget! AC-nya dingin dan penjaga studionya sangat membantu pas pasang background.",
      }
    ]
  },

  "mitra-event": {
    id: "mitra-event",
    name: "Megatent & Event Production",
    tagline: "Sewa Tenda Sarnafil, Panggung Rigging, Kursi Futura & Cooling Fan",
    category: "Penyewaan Perlengkapan Event",
    badge: "Mitra Rental Terverifikasi",
    avatar: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
    rating: 4.8,
    reviewCount: 76,
    completedOrders: 210,
    responseTime: "< 20 menit",
    joinedYear: "2022",
    operationalHours: "Setiap Hari, 08:00 - 21:00 WIB",
    address: "Jl. Veteran Timur No. 15",
    whatsapp: "081277665544",
    about: "Penyedia sewa perlengkapan acara terlengkap untuk bazaar, pameran, resepsi pernikahan, konser musik, dan gathering institusi. Koleksi sewa tenda sarnafil putih elegan, tenda plafon dekorasi, panggung modular, karpet merah, cooling fan blower, dan ratusan kursi lipat Futura.",
    securityDepositPolicy: "Tim instalasi berpengalaman, survei lokasi gratis, dan pembayaran bertahap lewat escrow Bantuin.",
    catalog: [
      {
        id: "evt-1",
        name: "Sewa Tenda Kerucut / Sarnafil 3x3 Meter",
        category: "Tenda",
        type: "sewa",
        price: 150000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 32,
        stockStatus: "Siap Sewa",
        tag: "Bazaar & Stand",
        desc: "Tenda putih bersih anti bocor, rangka kokoh, cocok untuk stan kuliner dan bazaar expo.",
      },
      {
        id: "evt-2",
        name: "Sewa Kursi Lipat Futura + Cover Ketat Hitam/Putih",
        category: "Kursi",
        type: "sewa",
        price: 6000,
        unit: "/ buah / hari",
        image: "https://images.unsplash.com/photo-1580481077195-c9f28df1379c?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviews: 45,
        stockStatus: "Siap Sewa",
        tag: "Minimal 50 Pcs",
        desc: "Busa empuk, bersih tanpa noda, cover stretch rapi siap pakai untuk seminar & pesta.",
      },
      {
        id: "evt-3",
        name: "Sewa Kipas Embun Cooling Fan Air / Blower Kabut",
        category: "Pendingin",
        type: "sewa",
        price: 175000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 20,
        stockStatus: "Siap Sewa",
        tag: "Bikin Sejuk",
        desc: "Menurunkan suhu luar ruangan seketika dengan semprotan kabut air halus yang segar.",
      },
      {
        id: "evt-4",
        name: "Sewa Panggung Modular Karpet Hitam / Merah (Per Meter)",
        category: "Panggung",
        type: "sewa",
        price: 65000,
        unit: "/ meter persegi",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 18,
        stockStatus: "Siap Sewa",
        tag: "Rigging Kuat",
        desc: "Panggung kokoh sistem modular tinggi 50cm - 100cm, karpet rapi dan trap tangga.",
      }
    ],
    reviews: [
      {
        id: "rev-e1",
        userName: "Hendro Wibowo",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "1 minggu yang lalu",
        item: "Sewa Tenda Kerucut / Sarnafil 3x3 Meter",
        comment: "Pemasangan tepat waktu banget sebelum acara festival dimulai. Krunya cekatan dan ramah.",
      }
    ]
  },

  "mitra-laptop": {
    id: "mitra-laptop",
    name: "QuickFix Rental Laptop & Proyektor Event",
    tagline: "Pusat Sewa Laptop Core i5/i7, Proyektor 3600 Lumens & Layar Tripod",
    category: "Penyewaan Komputer & Multimedia",
    badge: "Mitra Rental Terverifikasi",
    avatar: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1600&q=80",
    rating: 4.9,
    reviewCount: 220,
    completedOrders: 890,
    responseTime: "< 10 menit",
    joinedYear: "2022",
    operationalHours: "Senin - Sabtu, 08:30 - 21:30 WIB",
    address: "Jl. Overste Isdiman No. 24 (Ruko Deretan IT Center)",
    whatsapp: "081388776655",
    about: "Pusat persewaan laptop dan perangkat multimedia terlengkap untuk ujian CAT/CPNS, seminar, rapat direksi, pelatihan workshop, dan pameran. Menyediakan puluhan unit laptop Core i5/i7 seragam, proyektor tajam 3600 lumens, layar tripod besar, dan tablet iPad.",
    securityDepositPolicy: "Wajib menitipkan identitas asli dan verifikasi rekening bersama escrow Bantuin.",
    catalog: [
      {
        id: "it-1",
        name: "Sewa Laptop Asus Core i5 RAM 16GB SSD 512GB (Siap Pakai)",
        category: "Laptop",
        type: "sewa",
        price: 75000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
        rating: 5.0,
        reviews: 92,
        stockStatus: "Siap Sewa",
        tag: "Terpopuler",
        desc: "Performa kencang, Windows 11 + Office siap pakai, baterai sehat, charger original include tas.",
      },
      {
        id: "it-2",
        name: "Sewa Proyektor Epson 3600 Lumens + Layar Tripod 70 Inch",
        category: "Proyektor",
        type: "sewa",
        price: 120000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 67,
        stockStatus: "Siap Sewa",
        tag: "Presentasi Tajam",
        desc: "Pancaran terang benderang meski di ruangan dengan lampu menyala, kabel HDMI & VGA lengkap.",
      },
      {
        id: "it-3",
        name: "Sewa iPad Air + Apple Pencil untuk Registrasi Tamu Event",
        category: "Tablet",
        type: "sewa",
        price: 90000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviews: 38,
        stockStatus: "Siap Sewa",
        tag: "Elegan",
        desc: "Tablet Apple elegan untuk buku tamu digital, registrasi QR code seminar, dan display katalog.",
      },
      {
        id: "it-4",
        name: "Sewa Smart TV LED 50 Inch 4K + Stand Roda Pameran",
        category: "Display",
        type: "sewa",
        price: 250000,
        unit: "/ hari",
        image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviews: 44,
        stockStatus: "Siap Sewa",
        tag: "Display Booth",
        desc: "Resolusi 4K tajam untuk display video company profile di stan pameran & expo.",
      }
    ],
    reviews: [
      {
        id: "rev-i1",
        userName: "Rangga Pratama",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "2 hari yang lalu",
        item: "Sewa Laptop Asus Core i5 RAM 16GB",
        comment: "Sewa 5 unit laptop buat ujian sertifikasi kampus. Semua laptop dalam kondisi sangat fit, bersih, dan booting kencang. Recomended!",
      }
    ]
  }
};

/**
 * Helper untuk mengambil seluruh toko mitra (termasuk yang tersimpan di localStorage)
 */
export function getAllMitraStores() {
  if (typeof window !== "undefined") {
    return Object.values(MITRA_STORES).map((s) => {
      try {
        const saved = localStorage.getItem(`bantuin_mitra_store_${s.id}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return s;
    });
  }
  return Object.values(MITRA_STORES);
}

/**
 * Helper untuk mengambil data toko mitra berdasarkan ID (sinkron dengan localStorage)
 */
export function getMitraStoreById(id) {
  let resolvedId = "mitra-kamera";
  if (id) {
    if (MITRA_STORES[id]) resolvedId = id;
    else if (MITRA_STORES[`mitra-${id}`]) resolvedId = `mitra-${id}`;
    else if (id === "owner-1" || id === "owner-2") resolvedId = "mitra-kamera";
    else if (id.toLowerCase().includes("kamera") || id.toLowerCase().includes("cam")) resolvedId = "mitra-kamera";
    else if (id.toLowerCase().includes("laptop") || id.toLowerCase().includes("it")) resolvedId = "mitra-laptop";
    else if (id.toLowerCase().includes("cetak") || id.toLowerCase().includes("print")) resolvedId = "mitra-cetak";
    else if (id.toLowerCase().includes("sound") || id.toLowerCase().includes("audio")) resolvedId = "mitra-sound";
  }

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`bantuin_mitra_store_${resolvedId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
  }

  return MITRA_STORES[resolvedId] || MITRA_STORES["mitra-kamera"];
}

/**
 * Menyimpan pembaruan data toko mitra ke localStorage dan memicu update event
 */
export function saveMitraStoreData(store) {
  if (typeof window !== "undefined" && store?.id) {
    try {
      localStorage.setItem(`bantuin_mitra_store_${store.id}`, JSON.stringify(store));
      window.dispatchEvent(new Event("bantuin_mitra_store_updated"));
    } catch (e) {
      console.warn("Could not save mitra store data:", e);
    }
  }
}

