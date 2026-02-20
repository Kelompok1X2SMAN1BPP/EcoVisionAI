/* =========================================
   PENGATURAN MODEL & VARIABLE GLOBAL
   ========================================= */

// GANTI "KODE_KAMU" dengan ID model asli dari Teachable Machine milikmu
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
        
        // Memuat model AI
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Model AI Berhasil Dimuat!");
    } catch (e) {
        console.error("Gagal memuat model. Pastikan URL model benar!", e);
    }
}
loadModel(); // Langsung jalankan saat halaman dibuka

/* =========================================
   2. LOGIKA NAVIGASI (SMOOTH SCROLL)
   ========================================= */
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
/* --- FUNGSI PINTAR TOGGLE KAMERA (NYALA/MATI) --- */
async function toggleCamera() {
    const btn = document.getElementById("camera-btn");

    if (!isWebcamActive) {
        // --- PROSES MENYALAKAN KAMERA ---
        document.getElementById("image-preview").style.display = "none";
        
        const flip = true;
        webcam = new tmImage.Webcam(300, 300, flip);
        await webcam.setup();
        await webcam.play();
        
        isWebcamActive = true;
        window.requestAnimationFrame(loop);

        const container = document.getElementById("webcam-container");
        container.innerHTML = "";
        container.appendChild(webcam.canvas);
        setupLabels();

        // Ganti tampilan tombol jadi STOP
        btn.innerHTML = "Stop Camera";
        btn.classList.add("stopping"); // Kita kasih warna merah lewat CSS nanti
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
// FUNGSI LOOP: Inilah yang bikin kamera GERAK/REAL-TIME
async function loop() {
    if (isWebcamActive && webcam && webcam.canvas) {
        webcam.update(); // Ambil frame terbaru dari kamera
        await predict(webcam.canvas); // Prediksi frame tersebut
        window.requestAnimationFrame(loop); // Ulangi terus menerus
    }
}
/* =========================================
   4. LOGIKA UPLOAD FOTO (FILE INPUT)
   ========================================= */
async function handleUpload(input) {
    if (input.files && input.files[0]) {
        
        if (isWebcamActive) {
            await toggleCamera(); 
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const imgElement = document.getElementById("image-preview");
            const container = document.getElementById("webcam-container");
            const clearBtn = document.getElementById("clear-btn"); // AMBIL TOMBOL CLEAR
            const uploadBtn = document.querySelector('.btn-upload'); // AMBIL TOMBOL UPLOAD

            container.innerHTML = ""; 
            imgElement.src = e.target.result; 
            imgElement.style.display = "block"; 

            // --- TAMBAHAN: TUKAR TOMBOL ---
            if (clearBtn) clearBtn.style.display = "block";
            if (uploadBtn) uploadBtn.style.display = "none";

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
    if (!model) return; // Jangan prediksi kalau model belum siap
    
    const prediction = await model.predict(imageSource);
    
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(0) + "%";
        
        if (labelContainer && labelContainer.childNodes[i]) {
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }
    }
}

// Fungsi pembantu untuk membuat kotak teks hasil prediksi
function setupLabels() {
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; 
    for (let i = 0; i < maxPredictions; i++) {
        const labelDiv = document.createElement("div");
        labelContainer.appendChild(labelDiv);
    }
}
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active'); // Buka/Tutup Menu
    
    // Animasi tombol garis 3 jadi tanda silang (X)
    hamburger.classList.toggle('toggle');
});
/* --- FITUR TAMBAHAN: AUTO-CLOSE MENU PAS DIKLIK (KHUSUS HP) --- */
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        // Hapus class active biar menu nutup lagi setelah kita pilih section
        navLinks.classList.remove('active');
        // Balikin ikon X jadi garis 3 lagi
        hamburger.classList.remove('toggle');
    });
});
/* =========================================
   6. FUNGSI HAPUS GAMBAR (CLEAR)
   ========================================= */
function clearImage() {
    const imgElement = document.getElementById("image-preview");
    const labelContainer = document.getElementById("label-container");
    const clearBtn = document.getElementById("clear-btn");
    const uploadBtn = document.querySelector('.btn-upload');
    const fileInput = document.getElementById("file-input");

    // 1. Sembunyikan gambar & hapus isinya
    imgElement.style.display = "none";
    imgElement.src = "#";
    
    // 2. Bersihkan hasil prediksi AI
    if (labelContainer) labelContainer.innerHTML = "";
    
    // 3. Reset input file biar bisa upload foto yang sama lagi
    if (fileInput) fileInput.value = "";

    // 4. Balikin tombolnya seperti semula
    if (clearBtn) clearBtn.style.display = "none";
    if (uploadBtn) uploadBtn.style.display = "block";

}
// 1. Ambil elemen hamburger dan daftar menu berdasarkan ID-nya
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

// 2. Kasih fungsi 'klik' ke hamburger
hamburger.addEventListener('click', () => {
    // 3. Toggle class 'active' pada nav-links (biar muncul/hilang)
    navLinks.classList.toggle('active');
    
    // 4. Toggle class 'toggle' pada hamburger (biar garisnya berubah jadi X)
    hamburger.classList.toggle('toggle');
});
