/**
 * Bantuin Provider & Helper Catalog Mock Data
 * Unified data store for Service Providers and Helpers
 * Membedakan dengan jelas antara:
 * 1. Katalog Jasa (Layanan Satuan dengan Foto & Harga)
 * 2. Paketan (Paket Borongan / Bundling dengan List Fitur)
 */

export const PROVIDERS_DATA = [
  {
    id: "fajar-ramadhan-desain",
    name: "Fajar Ramadhan, S.Ds",
    brandTitle: "Studio Desain Grafis & UI/UX",
    type: "specialist",
    category: "Desain",
    categoryLabel: "Desain Grafis & UI/UX",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    coverBanner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    rating: 4.98,
    reviewsCount: 54,
    completedJobs: 72,
    responseTime: "5 menit",
    location: "Purwokerto Utara, Banyumas",
    distanceMeters: 450,
    address: "Jl. HR Bunyamin No. 45, Grendeng, Purwokerto Utara",
    city: "Kabupaten Banyumas",
    latitude: -7.4112,
    longitude: 109.2458,
    isVerified: true,
    verificationBadge: "KTP Terverifikasi",
    bio: "Desainer grafis & UI/UX berpengalaman 5 tahun melayani branding UMKM, materi promosi event kampus, kemasan produk, dan desain antarmuka aplikasi mobile.",
    badges: ["Desainer Terverifikasi", "Garansi Revisi", "Rekber Aman"],
    skills: ["Figma", "Adobe Illustrator", "Photoshop", "Desain Logo", "Kemasan UMKM", "Banner Event"],

    // 1. KATALOG JASA (Layanan Satuan dengan Foto & Harga Langsung)
    catalog: [
      {
        id: "cat-fjr-1",
        title: "Desain Logo & Identitas Brand",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
        price: 75000,
        unit: "/ desain",
        category: "Logo",
        desc: "2 opsi konsep logo estetik, file PNG transparan & resolusi tinggi siap pakai."
      },
      {
        id: "cat-fjr-2",
        title: "Desain Kemasan & Label Produk UMKM",
        image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
        price: 120000,
        unit: "/ produk",
        category: "Kemasan",
        desc: "Desain pouch, botol, atau stiker toples dengan file siap cetak percetakan."
      },
      {
        id: "cat-fjr-3",
        title: "Desain Feed & Carousel Instagram",
        image: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=600&q=80",
        price: 35000,
        unit: "/ postingan",
        category: "Sosial Media",
        desc: "Template promosi atau carousel edukasi estetik bisa diedit di Canva."
      },
      {
        id: "cat-fjr-4",
        title: "Desain Spanduk, Banner & Baliho Acara",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80",
        price: 50000,
        unit: "/ banner",
        category: "Cetak",
        desc: "Desain banner seminar, wisuda, atau pameran ukuran bebas tanpa pecah."
      },
      {
        id: "cat-fjr-5",
        title: "Desain UI/UX Aplikasi Mobile (Figma)",
        image: "https://images.unsplash.com/photo-1581291518655-9523c932deda?auto=format&fit=crop&w=600&q=80",
        price: 350000,
        unit: "/ proyek",
        category: "UI/UX",
        desc: "Desain mockup aplikasi interaktif dengan sistem komponen siap koding."
      }
    ],

    // 2. PAKETAN (Paket Bundling Borongan dengan List Fitur)
    packages: [
      {
        id: "pkg-fjr-1",
        name: "Paket Logo Kilat",
        tier: "Paket Hemat",
        price: 75000,
        duration: "1 Hari",
        description: "Cocok untuk UMKM pemula atau tugas kampus yang butuh logo cepat jadi.",
        features: [
          "2 Konsep Logo Pilihan",
          "File Resolusi Tinggi (PNG Transparan & JPEG)",
          "Revisi 2 Kali",
          "Pengerjaan 24 Jam Selesai"
        ],
        isPopular: false
      },
      {
        id: "pkg-fjr-2",
        name: "Paket Brand Lengkap & Sosmed",
        tier: "Paket Standar",
        price: 175000,
        duration: "2 Hari",
        description: "Paling banyak dipilih! Paket komplit identitas brand dan template media sosial.",
        features: [
          "3 Konsep Desain Logo Eksklusif",
          "Master File Lengkap (AI / SVG / PDF)",
          "Panduan Warna & Font Resmi",
          "5 Template Postingan Instagram Siap Pakai",
          "Revisi Sampai Cocok"
        ],
        isPopular: true
      },
      {
        id: "pkg-fjr-3",
        name: "Paket UI/UX Mobile App Komplit",
        tier: "Paket Lengkap",
        price: 450000,
        duration: "4 Hari",
        description: "Solusi desain aplikasi mobile siap serah terima ke developer.",
        features: [
          "Hingga 10 Layar UI di Figma",
          "Prototipe Interaktif (Bisa Diklik)",
          "Komponen Design System Lengkap",
          "Aset Gambar Siap Koding (SVG / WebP)",
          "Konsultasi & Garansi Revisi"
        ],
        isPopular: false
      }
    ],

    portfolioPhotos: [
      {
        url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80",
        title: "Logo Brand Kopi Banyumas",
        description: "Desain logo minimalis modern dan panduan warna kemasan.",
        category: "Branding"
      },
      {
        url: "https://images.unsplash.com/photo-1581291518655-9523c932deda?auto=format&fit=crop&w=800&q=80",
        title: "UI App FinTech Mahasiswa",
        description: "12 layar aplikasi mobile interaktif berbasis Figma.",
        category: "UI/UX"
      },
      {
        url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80",
        title: "Banner Seminar Nasional",
        description: "Materi visual resolusi tinggi untuk cetak baliho 4x3 meter.",
        category: "Cetak"
      },
      {
        url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
        title: "Kemasan Snack Tradisional",
        description: "Desain kemasan standing pouch elegan siap cetak.",
        category: "Kemasan"
      },
      {
        url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
        title: "Landing Page Bisnis Lokal",
        description: "Desain halaman promosi responsif untuk desktop & HP.",
        category: "Web UI"
      },
      {
        url: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=800&q=80",
        title: "Template Carousel Instagram",
        description: "Set 10 template konten edukasi feed Instagram.",
        category: "Sosmed"
      }
    ],

    reviews: [
      {
        id: "rev-fjr-1",
        userName: "Dimas Anggara",
        userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "14 Sep 2026",
        packageName: "Paket Brand Lengkap & Sosmed",
        comment: "Mas Fajar sangat komunikatif. Logo warung kopi saya terlihat profesional dan template IG-nya mudah diedit."
      },
      {
        id: "rev-fjr-2",
        userName: "Anisa Rahmawati",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "08 Sep 2026",
        packageName: "Paket Logo Kilat",
        comment: "Butuh logo kilat buat pameran kampus, sehari beres dan hasilnya sangat rapi."
      }
    ]
  },
  {
    id: "bagus-wicaksono-helper",
    name: "Bagus Wicaksono",
    brandTitle: "Tenaga Bantuan Pindahan, Angkut & Harian",
    type: "helper",
    category: "Helper",
    categoryLabel: "Bantuan Tenaga & Pindahan",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80",
    coverBanner: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    rating: 4.96,
    reviewsCount: 42,
    completedJobs: 58,
    responseTime: "10 menit",
    location: "Karangwangkal, Purwokerto Utara",
    distanceMeters: 600,
    address: "Jl. Riyanto No. 18, Karangwangkal, Banyumas",
    city: "Kabupaten Banyumas",
    latitude: -7.4089,
    longitude: 109.2512,
    isVerified: true,
    verificationBadge: "KTP & SKCK Terverifikasi",
    bio: "Tenaga bantuan andalan anak kos dan warga Purwokerto. Siap bantu angkat barang berat, naik turun tangga kos, bongkar muat pickup, kirim dokumen cepat, dan bantuan fisik lapangan.",
    badges: ["Tenaga Terverifikasi", "Fisik Kuat", "Tepat Waktu", "Rekber Aman"],
    skills: ["Pindahan Kos", "Angkat Kasur & Lemari", "Bongkar Muat Pickup", "Antar Berkas Cepat", "Bantuan Lapangan"],

    // 1. KATALOG JASA (Layanan Satuan dengan Foto & Harga Langsung)
    catalog: [
      {
        id: "cat-bg-1",
        title: "Bantuan Angkat Kasur & Lemari Kos",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
        price: 50000,
        unit: "/ sesi",
        category: "Pindahan",
        desc: "Tenaga angkat kuat untuk springbed single dan lemari pakaian naik/turun tangga kos."
      },
      {
        id: "cat-bg-2",
        title: "Bantuan Bongkar Muat Mobil Pickup",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
        price: 60000,
        unit: "/ mobil",
        category: "Logistik",
        desc: "Membantu menaikkan dan menurunkan barang dari mobil pickup dengan tali pengaman."
      },
      {
        id: "cat-bg-3",
        title: "Antar Dokumen & Legalisir Berkas",
        image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80",
        price: 25000,
        unit: "/ rute",
        category: "Errand",
        desc: "Layanan antar titip dokumen resmi area Purwokerto dengan bukti foto tanda terima."
      },
      {
        id: "cat-bg-4",
        title: "Bantuan Pindahan Kamar Kos",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
        price: 75000,
        unit: "/ kamar",
        category: "Pindahan",
        desc: "Membantu angkut semua kardus dan perabotan kamar dari kos lama ke kos baru."
      },
      {
        id: "cat-bg-5",
        title: "Perakitan Meja Belajar & Rak Knockdown",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
        price: 40000,
        unit: "/ unit",
        category: "Perabot",
        desc: "Pemasangan furnitur yang dibeli online menggunakan perkakas lengkap."
      }
    ],

    // 2. PAKETAN (Paket Bundling Borongan dengan List Fitur)
    packages: [
      {
        id: "pkg-bg-1",
        name: "Paket Titip Berkas Cepat",
        tier: "Paket Hemat",
        price: 25000,
        duration: "1 Jam",
        description: "Layanan titip antar jemput berkas dan dokumen mendesak dalam kota.",
        features: [
          "Radius Antar hingga 7 km",
          "Bukti Serah Terima Foto Realtime",
          "Penanganan Aman & Tidak Kusut",
          "Tepat Waktu"
        ],
        isPopular: false
      },
      {
        id: "pkg-bg-2",
        name: "Paket Pindahan Kos Standar",
        tier: "Paket Standar",
        price: 60000,
        duration: "2 - 3 Jam",
        description: "Paling diminati mahasiswa! Bantuan tenaga fisik angkut perabotan kamar kos.",
        features: [
          "Tenaga Angkat Kasur, Lemari, dan Kardus",
          "Bongkar Muat ke Kendaraan / Pickup",
          "Naik Turun Tangga Lantai 1 - 3",
          "Termasuk Tali Pengikat Barang"
        ],
        isPopular: true
      },
      {
        id: "pkg-bg-3",
        name: "Paket Pindahan All-in (Setengah Hari)",
        tier: "Paket Lengkap",
        price: 130000,
        duration: "Hingga 5 Jam",
        description: "Bantuan menyeluruh mulai dari packing, angkut, sampai tata ulang di kos baru.",
        features: [
          "Pendampingan Pindahan Maksimal 5 Jam",
          "Bantuan Packing Kardus & Lakban",
          "Angkut Seluruh Perabotan Kamar",
          "Bantuan Penataan Kamar di Lokasi Baru"
        ],
        isPopular: false
      }
    ],

    portfolioPhotos: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        title: "Pindahan Kos Grendeng Unsoed",
        description: "Angkut springbed single dan lemari pakaian ke lantai 2 kamar kos.",
        category: "Pindahan"
      },
      {
        url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
        title: "Bongkar Muat Pickup",
        description: "Penataan perabotan dengan tali pengikat dan kain pelindung.",
        category: "Logistik"
      },
      {
        url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
        title: "Pengantaran Berkas Cepat",
        description: "Pengiriman map legalisir ijazah tepat waktu dengan tanda terima.",
        category: "Errand"
      }
    ],

    reviews: [
      {
        id: "rev-bg-1",
        userName: "Reza Pratama (Anak Kos)",
        userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "16 Sep 2026",
        packageName: "Paket Pindahan Kos Standar",
        comment: "Mas Bagus tenaganya kuat dan orangnya ramah. Lemari berat diangkat ke lantai 2 aman tanpa lecet."
      }
    ]
  },
  {
    id: "satria-lensa-fotografi",
    name: "Satria Lensa Creative",
    brandTitle: "Fotografer Wisuda, Event & Portrait",
    type: "specialist",
    category: "Fotografi",
    categoryLabel: "Fotografi & Dokumentasi",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
    coverBanner: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    rating: 4.97,
    reviewsCount: 46,
    completedJobs: 64,
    responseTime: "15 menit",
    location: "Purwokerto Utara, Banyumas",
    distanceMeters: 450,
    address: "Jl. Kampus Grendeng No. 12, Banyumas",
    city: "Kabupaten Banyumas",
    latitude: -7.4098,
    longitude: 109.2483,
    isVerified: true,
    verificationBadge: "Fotografer Terverifikasi",
    bio: "Fotografer profesional kamera Sony A7 IV & lensa G-Master. Melayani foto wisuda Unsoed/UMP, foto potret keluarga, maternity, dokumentasi seminar, dan gathering.",
    badges: ["Sony Pro Gear", "Lighting Lengkap", "Tone Alami", "Rekber Aman"],
    skills: ["Foto Wisuda", "Dokumentasi Event", "Foto Keluarga", "Lightroom Pro", "Studio Portable"],

    // 1. KATALOG JASA (Layanan Satuan dengan Foto & Harga Langsung)
    catalog: [
      {
        id: "cat-stl-1",
        title: "Sesi Foto Wisuda Solo Kampus",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80",
        price: 150000,
        unit: "/ sesi 45 mnt",
        category: "Wisuda",
        desc: "Sesi foto outdoor di kampus Unsoed/UMP, 100+ file mentah + 10 foto diedit tone warna."
      },
      {
        id: "cat-stl-2",
        title: "Sesi Foto Wisuda Bersama Keluarga",
        image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
        price: 250000,
        unit: "/ sesi 90 mnt",
        category: "Keluarga",
        desc: "Foto wisudawan bersama orang tua & keluarga, 25 foto diedit profesional + file Google Drive."
      },
      {
        id: "cat-stl-3",
        title: "Dokumentasi Seminar & Konferensi",
        image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
        price: 450000,
        unit: "/ acara",
        category: "Event",
        desc: "Liputan acara kampus atau instansi, semua momen pembicara & audiens terabadikan."
      },
      {
        id: "cat-stl-4",
        title: "Foto Profil Profesional & LinkedIn",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        price: 90000,
        unit: "/ orang",
        category: "Potret",
        desc: "Foto formal beresolusi tinggi dengan pencahayaan studio portable untuk CV dan profil kerja."
      },
      {
        id: "cat-stl-5",
        title: "Foto Produk Menu Makanan Cafe",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
        price: 120000,
        unit: "/ sesi",
        category: "Komersial",
        desc: "Foto makanan & minuman dengan styling estetik untuk banner menu dan ojek online."
      }
    ],

    // 2. PAKETAN (Paket Bundling Borongan dengan List Fitur)
    packages: [
      {
        id: "pkg-stl-1",
        name: "Paket Wisuda Solo",
        tier: "Paket Hemat",
        price: 150000,
        duration: "45 Menit",
        description: "Sesi foto outdoor solo di spot terbaik sekitar kampus.",
        features: [
          "Sesi Foto Outdoor 45 Menit",
          "Semua File Original via Google Drive",
          "10 Foto Diedit Tone Warna",
          "Bebas Bawa Toga & Buket"
        ],
        isPopular: false
      },
      {
        id: "pkg-stl-2",
        name: "Paket Wisuda Lengkap + Keluarga",
        tier: "Paket Standar",
        price: 280000,
        duration: "90 Menit",
        description: "Paling favorit! Sesi lengkap wisudawan bersama keluarga dan sahabat.",
        features: [
          "Sesi Foto 90 Menit Bebas Spot",
          "Foto Wisudawan, Orang Tua & Sahabat",
          "Semua File Mentah HD (200+ foto)",
          "25 Foto Diedit Profesional",
          "Bonus 1 Cetak 10R + Bingkai Minimalis"
        ],
        isPopular: true
      },
      {
        id: "pkg-stl-3",
        name: "Paket Dokumentasi Event (Setengah Hari)",
        tier: "Paket Lengkap",
        price: 550000,
        duration: "Hingga 4 Jam",
        description: "Dokumentasi menyeluruh untuk seminar kampus atau gathering komunitas.",
        features: [
          "Liputan Acara hingga 4 Jam",
          "Setup Lampu Lighting Studio",
          "Semua Foto Master Resolusi Penuh",
          "50 Foto Highlight Selesai 24 Jam"
        ],
        isPopular: false
      }
    ],

    portfolioPhotos: [
      {
        url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
        title: "Foto Wisuda Unsoed",
        description: "Momen wisuda outdoor di kampus Grendeng.",
        category: "Wisuda"
      },
      {
        url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
        title: "Foto Bersama Keluarga",
        description: "Potret hangat wisudawan dan orang tua.",
        category: "Keluarga"
      }
    ],

    reviews: [
      {
        id: "rev-stl-1",
        userName: "Dinda Pratiwi",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "12 Sep 2026",
        packageName: "Paket Wisuda Lengkap + Keluarga",
        comment: "Mas Satria pintar mengarahkan gaya keluarga. Hasil fotonya jernih dan warnanya hangat."
      }
    ]
  },
  {
    id: "banyumas-mandiri-teknik",
    name: "Banyumas Mandiri Teknik",
    brandTitle: "Spesialis Servis & Cuci AC Rumah / Kos",
    type: "specialist",
    category: "Teknisi",
    categoryLabel: "Teknisi AC & Listrik",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    coverBanner: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    rating: 4.95,
    reviewsCount: 68,
    completedJobs: 92,
    responseTime: "12 menit",
    location: "Purwokerto Timur, Banyumas",
    distanceMeters: 750,
    address: "Jl. Prof. Dr. Suharso No. 19, Purwokerto Timur",
    city: "Kabupaten Banyumas",
    latitude: -7.4261,
    longitude: 109.2553,
    isVerified: true,
    verificationBadge: "Teknisi AC 8+ Tahun",
    bio: "Jasa servis AC panggilan terpercaya untuk rumah dan kamar kos. Dilengkapi mesin jet cleaner bertekanan tinggi, pengisian freon standar pabrik, dan bergaransi.",
    badges: ["Peralatan Lengkap", "Garansi 30 Hari", "Bisa Dipanggil ke Kos", "Rekber Aman"],
    skills: ["Cuci AC Split", "Tambah Freon R32/R410", "Perbaikan AC Bocor", "Bongkar Pasang AC", "Kelistrikan Kos"],

    // 1. KATALOG JASA (Layanan Satuan dengan Foto & Harga Langsung)
    catalog: [
      {
        id: "cat-bmt-1",
        title: "Jasa Cuci AC Split 0.5 - 1 PK",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
        price: 65000,
        unit: "/ unit",
        category: "Cuci AC",
        desc: "Cuci bersih unit indoor dan outdoor dengan jet cleaner, filter dan evaporator disemprot bersih."
      },
      {
        id: "cat-bmt-2",
        title: "Tambah Freon R32 / R410A",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        price: 85000,
        unit: "/ unit",
        category: "Freon",
        desc: "Pengisian gas freon murni hingga tekanan optimal pabrik, AC kembali dingin maksimal."
      },
      {
        id: "cat-bmt-3",
        title: "Perbaikan AC Menetes / Bocor Air",
        image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
        price: 75000,
        unit: "/ unit",
        category: "Perbaikan",
        desc: "Pembersihan talang pembuangan tersumbat dan penggantian selang drainase fleksibel."
      },
      {
        id: "cat-bmt-4",
        title: "Bongkar Pasang AC Pindahan Kos",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
        price: 220000,
        unit: "/ unit",
        category: "Instalasi",
        desc: "Bongkar aman dari lokasi lama dan pasang di tempat baru dengan proses vacuum pipa."
      },
      {
        id: "cat-bmt-5",
        title: "Perbaikan Jalur MCB & Stop Kontak Kos",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
        price: 50000,
        unit: "/ titik",
        category: "Listrik",
        desc: "Perbaikan listrik sering jeglek, ganti stop kontak meleleh, dan penataan kabel aman."
      }
    ],

    // 2. PAKETAN (Paket Bundling Borongan dengan List Fitur)
    packages: [
      {
        id: "pkg-bmt-1",
        name: "Paket Cuci AC Rutin",
        tier: "Paket Hemat",
        price: 65000,
        duration: "45 Menit",
        description: "Layanan cuci rutin bersih total unit indoor & outdoor.",
        features: [
          "Cuci Evaporator Indoor dengan Plastik Pelindung",
          "Semprot Blower Fan & Talang Air",
          "Cuci Kondensor Outdoor",
          "Cek Arus Listrik & Ampere",
          "Garansi 14 Hari"
        ],
        isPopular: false
      },
      {
        id: "pkg-bmt-2",
        name: "Paket Cuci Bersih + Isi Freon Penuh",
        tier: "Paket Standar",
        price: 145000,
        duration: "1 - 1.5 Jam",
        description: "Paling direkomendasikan untuk AC yang sudah tidak dingin.",
        features: [
          "Cuci Menyeluruh Indoor & Outdoor",
          "Isi Freon R32 / R410 Sampai Tekanan Normal",
          "Cek Kebocoran Sambungan Nepel Pipa",
          "Pembersihan Filter Antibakteri",
          "Garansi Dingin 30 Hari"
        ],
        isPopular: true
      },
      {
        id: "pkg-bmt-3",
        name: "Paket Bongkar Pasang Pindahan",
        tier: "Paket Lengkap",
        price: 250000,
        duration: "2 - 3 Jam",
        description: "Solusi lengkap pindahan rumah/kos: lepas unit lama dan pasang di lokasi baru.",
        features: [
          "Bongkar Unit dengan Pump-down Freon",
          "Pemasangan Braket di Dinding Baru",
          "Proses Vacuum Pipa Pendingin",
          "Uji Coba Dingin & Getaran",
          "Garansi Pemasangan 30 Hari"
        ],
        isPopular: false
      }
    ],

    portfolioPhotos: [
      {
        url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        title: "Cuci Evaporator AC",
        description: "Pembersihan kisi-kisi AC kamar kos.",
        category: "Cuci AC"
      },
      {
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        title: "Pengisian Freon Manifold",
        description: "Pengecekan tekanan gas freon R32.",
        category: "Freon"
      }
    ],

    reviews: [
      {
        id: "rev-bmt-1",
        userName: "Hendro Saputro",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "17 Sep 2026",
        packageName: "Paket Cuci Bersih + Isi Freon Penuh",
        comment: "AC kos yang tadinya tidak dingin sekarang langsung sejuk kembali. Kerjanya rapi dan tidak bocor."
      }
    ]
  },
  {
    id: "budi-santoso-komputer",
    name: "Budi Santoso",
    brandTitle: "Teknisi Servis Laptop, PC & Upgrade SSD",
    type: "specialist",
    category: "Komputer",
    categoryLabel: "Servis Laptop & Komputer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    coverBanner: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=80",
    rating: 4.96,
    reviewsCount: 45,
    completedJobs: 61,
    responseTime: "10 menit",
    location: "Purwokerto Selatan, Banyumas",
    distanceMeters: 950,
    address: "Jl. Veteran No. 71, Purwokerto Selatan",
    city: "Kabupaten Banyumas",
    latitude: -7.439,
    longitude: 109.241,
    isVerified: true,
    verificationBadge: "Teknisi Hardware Terverifikasi",
    bio: "Spesialis perbaikan laptop lemot, ganti pasta termal pendingin, perbaikan engsel casing patah, upgrade SSD kencang tanpa hilang data, dan pembersihan sistem pendingin.",
    badges: ["Bisa Ditunggu", "Jaminan Data Aman", "Garansi Servis", "Rekber Aman"],
    skills: ["Upgrade SSD NVMe", "Ganti Pasta Noctua", "Servis Engsel", "Instal Windows", "Recovery Data"],

    // 1. KATALOG JASA (Layanan Satuan dengan Foto & Harga Langsung)
    catalog: [
      {
        id: "cat-bds-1",
        title: "Bersih Kipas & Ganti Pasta Termal Noctua",
        image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
        price: 55000,
        unit: "/ laptop",
        category: "Cleaning",
        desc: "Pembersihan debu kipas pendingin dan penggantian pasta termal agar laptop tidak overheat."
      },
      {
        id: "cat-bds-2",
        title: "Instal Bersih Windows 10/11 + Office Lengkap",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
        price: 65000,
        unit: "/ instal",
        category: "Software",
        desc: "Instalasi OS bersih bebas bloatware beserta aplikasi standar tugas & browser."
      },
      {
        id: "cat-bds-3",
        title: "Jasa Pasang SSD & Kloning Windows",
        image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
        price: 90000,
        unit: "/ laptop",
        category: "Hardware",
        desc: "Migrasi sistem dari harddisk lama ke SSD baru tanpa kehilangan data dan software tugas."
      },
      {
        id: "cat-bds-4",
        title: "Perbaikan Engsel Casing Laptop Patah",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
        price: 120000,
        unit: "/ sisi",
        category: "Hardware",
        desc: "Rekonstruksi dudukan baut engsel layar yang retak agar laptop bisa dibuka-tutup kokoh kembali."
      }
    ],

    // 2. PAKETAN (Paket Bundling Borongan dengan List Fitur)
    packages: [
      {
        id: "pkg-bds-1",
        name: "Paket Cleaning & Ganti Pasta",
        tier: "Paket Hemat",
        price: 55000,
        duration: "45 Menit",
        description: "Solusi laptop cepat panas dan kipas berisik.",
        features: [
          "Bongkar Casing & Bersihkan Debu Heatsink",
          "Aplikasi Pasta Termal Berkualitas Noctua",
          "Cek Temperatur Laptop",
          "Bisa Ditunggu Langsung"
        ],
        isPopular: false
      },
      {
        id: "pkg-bds-2",
        name: "Paket Servis Total + Optimasi OS",
        tier: "Paket Standar",
        price: 110000,
        duration: "1 - 2 Jam",
        description: "Paling laris! Servis gabungan hardware dan software agar laptop kencang kembali.",
        features: [
          "Semua Fasilitas Cleaning & Pasta Termal",
          "Instal Ulang / Optimasi Bersih Windows",
          "Pembersihan File Sampah & Cache Lemot",
          "Instalasi Software Produktivitas (Office/PDF)",
          "Garansi Software 30 Hari"
        ],
        isPopular: true
      },
      {
        id: "pkg-bds-3",
        name: "Paket Upgrade SSD + Kloning Data",
        tier: "Paket Lengkap",
        price: 210000,
        duration: "2 Jam",
        description: "Jasa upgrade SSD cepat tanpa perlu format ulang file tugas.",
        features: [
          "Pemasangan Fisik SSD M.2 NVMe / SATA",
          "Kloning Sistem Windows Lama ke SSD",
          "Semua Data & Aplikasi Tetap Utuh",
          "Booting 5 Detik Langsung Kencang"
        ],
        isPopular: false
      }
    ],

    portfolioPhotos: [
      {
        url: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
        title: "Ganti Pasta Termal",
        description: "Pembersihan debu kipas dan pasta Noctua.",
        category: "Cleaning"
      }
    ],

    reviews: [
      {
        id: "rev-bds-1",
        userName: "Fikri Maulana",
        userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "14 Sep 2026",
        packageName: "Paket Upgrade SSD + Kloning Data",
        comment: "Laptop jadul saya setelah diupgrade SSD sama Mas Budi langsung kencang. File tugas aman semua."
      }
    ]
  },
  {
    id: "nadia-safitri-developer",
    name: "Nadia Safitri, S.Kom",
    brandTitle: "Fullstack Web & IT Specialist",
    type: "specialist",
    category: "Programming",
    categoryLabel: "Web & IT Developer",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    coverBanner: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    rating: 4.99,
    reviewsCount: 39,
    completedJobs: 48,
    responseTime: "8 menit",
    location: "Purwokerto Barat, Banyumas",
    distanceMeters: 800,
    address: "Jl. Pasirmuncang No. 33, Purwokerto Barat",
    city: "Kabupaten Banyumas",
    latitude: -7.4215,
    longitude: 109.2291,
    isVerified: true,
    verificationBadge: "IT Specialist Terverifikasi",
    bio: "Pengembang web profesional berpengalaman Next.js, React, Tailwind CSS, dan Supabase. Membantu pembuatan landing page promosi, web profil bisnis, dan perbaikan bug koding.",
    badges: ["Fullstack Dev", "Kode Bersih", "Free Hosting Setup", "Rekber Aman"],
    skills: ["Next.js & React", "Tailwind CSS", "Supabase", "Landing Page", "Fixing Bug"],

    // 1. KATALOG JASA (Layanan Satuan dengan Foto & Harga Langsung)
    catalog: [
      {
        id: "cat-nds-1",
        title: "Pembuatan Landing Page Promosi Responsif",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
        price: 290000,
        unit: "/ website",
        category: "Landing Page",
        desc: "Desain 1 halaman modern, mobile friendly, terhubung tombol WhatsApp & Google Maps."
      },
      {
        id: "cat-nds-2",
        title: "Perbaikan Bug & Error Koding",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
        price: 80000,
        unit: "/ kendala",
        category: "Bug Fixing",
        desc: "Audit kode dan penyelesaian error JavaScript, React, CSS, atau database skripsi."
      },
      {
        id: "cat-nds-3",
        title: "Optimasi Kecepatan Loading Website (PageSpeed)",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
        price: 120000,
        unit: "/ website",
        category: "Performa",
        desc: "Kompresi aset gambar dan pengecilan bundle script agar web terbuka kilat."
      }
    ],

    // 2. PAKETAN (Paket Bundling Borongan dengan List Fitur)
    packages: [
      {
        id: "pkg-nds-1",
        name: "Paket Perbaikan Bug Kilat",
        tier: "Paket Hemat",
        price: 80000,
        duration: "1 Hari",
        description: "Solusi cepat membasmi bug tampilan atau fungsional koding.",
        features: [
          "Audit & Penelusuran Error",
          "Perbaikan hingga 3 Bug",
          "Tips Pencegahan Error Lanjutan"
        ],
        isPopular: false
      },
      {
        id: "pkg-nds-2",
        name: "Paket Landing Page Promosi",
        tier: "Paket Standar",
        price: 290000,
        duration: "2 - 3 Hari",
        description: "Landing page modern untuk jualan produk, jasa, atau profil UMKM.",
        features: [
          "Desain Modern 1 Halaman Lengkap",
          "100% Responsif HP & Laptop",
          "Integrasi Tombol WhatsApp Direct",
          "Free Setup Hosting Vercel & Domain"
        ],
        isPopular: true
      }
    ],

    portfolioPhotos: [
      {
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        title: "Landing Page Ekspor Kerajinan",
        description: "Website promosi produk lokal bilingual.",
        category: "Web"
      }
    ],

    reviews: [
      {
        id: "rev-nds-1",
        userName: "Agung Wicaksana",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        rating: 5,
        date: "15 Sep 2026",
        packageName: "Paket Landing Page Promosi",
        comment: "Mba Nadia profesional sekali. Landing page roastery kami jadi sangat elegan dan penjualan via WA meningkat."
      }
    ]
  }
];

// Helper Functions
export function getAllProviders() {
  if (typeof window !== "undefined") {
    return PROVIDERS_DATA.map((p) => {
      try {
        const saved = localStorage.getItem(`bantuin_provider_${p.id}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return p;
    });
  }
  return PROVIDERS_DATA;
}

export function getProviderById(id) {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`bantuin_provider_${id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
  }
  return PROVIDERS_DATA.find((p) => p.id === id) || null;
}

export function saveProviderData(provider) {
  if (typeof window !== "undefined" && provider?.id) {
    try {
      localStorage.setItem(`bantuin_provider_${provider.id}`, JSON.stringify(provider));
      // Dispatch storage event so other components update immediately if needed
      window.dispatchEvent(new Event("bantuin_provider_updated"));
    } catch (e) {
      console.warn("Could not save provider data:", e);
    }
  }
}

export function getProvidersByCategory(category) {
  const all = getAllProviders();
  if (!category || category === "Semua") return all;
  const catLower = category.toLowerCase();
  return all.filter((p) => {
    return (
      p.category.toLowerCase() === catLower ||
      p.categoryLabel.toLowerCase().includes(catLower) ||
      ((catLower === "helper" || catLower.includes("tenaga") || catLower.includes("bantuan")) && p.type === "helper")
    );
  });
}

export function getStartingPrice(provider) {
  if (!provider) return 0;
  const packagePrices = provider.packages?.map((pkg) => pkg.price) || [];
  const catalogPrices = provider.catalog?.map((item) => item.price) || [];
  const allPrices = [...packagePrices, ...catalogPrices];
  if (allPrices.length === 0) return 0;
  return Math.min(...allPrices);
}

/**
 * Mengambil seluruh item katalog dari semua mitra penyedia & helper
 * menjadi daftar produk jasa terpadu (lengkap dengan data toko/mitra).
 */
export function getAllCatalogServices() {
  const services = [];
  const providers = getAllProviders();
  for (const provider of providers) {
    if (provider.catalog && provider.catalog.length > 0) {
      for (const item of provider.catalog) {
        services.push({
          id: item.id,
          title: item.title,
          image: item.image,
          photos: [
            item.image,
            ...(provider.portfolioPhotos?.map((p) => p.url) || [])
          ],
          price: item.price,
          unit: item.unit || "",
          category: item.category,
          categoryGroup: provider.category, // e.g. "Desain", "Helper", "Teknisi", "Fotografi", "Komputer", "Web", "Bahasa"
          desc: item.desc,
          provider: {
            id: provider.id,
            name: provider.name,
            brandTitle: provider.brandTitle,
            type: provider.type,
            avatar: provider.avatar,
            coverBanner: provider.coverBanner,
            bio: provider.bio,
            badges: provider.badges || [],
            skills: provider.skills || [],
            rating: provider.rating,
            reviewsCount: provider.reviewsCount,
            completedJobs: provider.completedJobs,
            location: provider.location,
            address: provider.address,
            city: provider.city,
            latitude: provider.latitude,
            longitude: provider.longitude,
            isVerified: provider.isVerified,
            responseTime: provider.responseTime
          },
          packages: provider.packages || [],
          reviews: provider.reviews || []
        });
      }
    }
  }
  return services;
}

/**
 * Mengambil satu produk jasa berdasarkan ID
 */
export function getCatalogServiceById(id) {
  const all = getAllCatalogServices();
  const found = all.find((s) => s.id === id);
  if (found) return found;

  // Cek jika yang dioper adalah ID penyedia
  const foundByProv = all.find((s) => s.provider && s.provider.id === id);
  if (foundByProv) return foundByProv;

  // Fallback jika ID tidak cocok
  return all[0] || null;
}

