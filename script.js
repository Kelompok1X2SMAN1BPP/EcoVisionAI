/* =========================================
   PENGATURAN MODEL & VARIABLE GLOBAL
   ========================================= */

// GANTI "KODE_KAMU" dengan ID model asli dari Teachable Machine milikmu
// Contoh: "https://teachablemachine.withgoogle.com/models/abcd12345/"
const URL_MODEL = "https://teachablemachine.withgoogle.com/models/KODE_KAMU/";

let model, webcam, labelContainer, maxPredictions;
let isWebcamActive = false; // Penanda apakah kamera sedang jalan

/* =========================================
   1. FUNGSI LOAD MODEL (OTAK AI)
   ========================================= */
async function loadModel() {
    try {
        const modelURL = URL_MODEL + "model.json";
        const metadataURL = URL_MODEL + "metadata.json";
        
        // Memuat model AI dari Google Teachable Machine
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Model AI Berhasil Dimuat!");
    } catch (e) {
        console.error("Gagal memuat model. Pastikan URL model benar!", e);
    }
}
loadModel(); // Langsung jalankan saat halaman dibuka agar AI siap sedia

/* =========================================
   2. LOGIKA NAVIGASI & HAMBURGER MENU
   ========================================= */

// Ambil elemen hamburger dan daftar menu
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

// Fungsi klik untuk membuka/menutup menu di HP
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active'); // Munculkan menu
    hamburger.classList.toggle('toggle'); // Animasi garis jadi X
});

// Fitur Auto-Close: Menu menutup otomatis setelah kita klik salah satu menu (khusus HP)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('toggle');
    });
});

// Smooth Scroll: Agar perpindahan antar bagian (Home, Detection, dll) halus
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

/* =========================================
   3. LOGIKA LIVE CAMERA (WEB-CAM)
   ========================================= */
async function toggleCamera() {
    const btn = document.getElementById("camera-btn");

    if (!isWebcamActive) {
        // --- PROSES MENYALAKAN KAMERA ---
        // Sembunyikan preview gambar jika ada
        document.getElementById("image-preview").style.display = "none";
        
        const flip = true; // mirror kamera
        webcam = new tmImage.Webcam(300, 300, flip);
        await webcam.setup(); // Minta izin akses kamera
        await webcam.play();
        
        isWebcamActive = true;
        window.requestAnimationFrame(loop); // Mulai pengulangan prediksi

        const container = document.getElementById("webcam-container");
        container.innerHTML = ""; // Bersihkan container
        container.appendChild(webcam.canvas); // Masukkan canvas kamera
        setupLabels(); // Siapkan teks hasil prediksi

        // Ganti tampilan tombol jadi STOP (warna merah diatur via class 'stopping')
        btn.innerHTML = "Stop Camera";
        btn.classList.add("stopping");
    } else {
        // --- PROSES MEMATIKAN KAMERA ---
        isWebcamActive = false;
        if (webcam) {
            await webcam.stop();
        }
        
        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("label-container").innerHTML = "";

        // Balikkan tampilan tombol jadi LIVE
        btn.innerHTML = "Live Camera";
        btn.classList.remove("stopping");
    }
}

// Fungsi Loop: Menjalankan prediksi terus menerus selama kamera aktif
async function loop() {
    if (isWebcamActive && webcam && webcam.canvas) {
        webcam.update(); // Ambil frame terbaru
        await predict(webcam.canvas); // Prediksi frame tersebut
        window.requestAnimationFrame(loop);
    }
}

/* =========================================
   4. LOGIKA UPLOAD FOTO (FILE INPUT)
   ========================================= */
async function handleUpload(input) {
    if (input.files && input.files[0]) {
        
        // Jika kamera lagi nyala, matikan dulu agar tidak bentrok
        if (isWebcamActive) {
            await toggleCamera(); 
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const imgElement = document.getElementById("image-preview");
            const container = document.getElementById("webcam-container");
            const clearBtn = document.getElementById("clear-btn");
            const uploadBtn = document.querySelector('.btn-upload');

            container.innerHTML = ""; // Bersihkan area kamera
            imgElement.src = e.target.result; // Masukkan foto ke elemen <img>
            imgElement.style.display = "block"; // Munculkan fotonya

            // Tukar tombol Upload dengan tombol Clear Image
            if (clearBtn) clearBtn.style.display = "block";
            if (uploadBtn) uploadBtn.style.display = "none";

            // Jalankan AI setelah gambar selesai dimuat (loading)
            imgElement.onload = async function () {
                setupLabels();
                await predict(imgElement); 
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/* =========================================
   5. LOGIKA PREDIKSI (INTI AI)
   ========================================= */
async function predict(imageSource) {
    if (!model) return; // Proteksi jika model belum siap
    
    const prediction = await model.predict(imageSource);
    
    // Tampilkan persentase hasil tiap kategori sampah
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(0) + "%";
        
        if (labelContainer && labelContainer.childNodes[i]) {
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }
    }
}

// Fungsi untuk membuat elemen kotak teks hasil prediksi secara dinamis
function
