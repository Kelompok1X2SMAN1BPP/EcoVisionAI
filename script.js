/* =========================================
   1. PENGATURAN MODEL & VARIABLE GLOBAL
   ========================================= */

// GANTI LINK DI BAWAH INI DENGAN LINK MODEL KAMU SENDIRI!
const URL_MODEL = "https://teachablemachine.withgoogle.com/models/GZxhojQW3/";

let model, webcam, labelContainer, maxPredictions;
let isWebcamActive = false;

/* =========================================
   2. FUNGSI MUAT AI (LOAD MODEL)
   ========================================= */
async function loadModel() {
    try {
        const modelURL = URL_MODEL + "model.json";
        const metadataURL = URL_MODEL + "metadata.json";
        
        // Memuat model AI
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("AI Berhasil Dimuat!");
    } catch (e) {
        console.error("Gagal muat AI. Periksa URL_MODEL kamu!", e);
    }
}
loadModel(); // Langsung jalankan saat web dibuka

/* =========================================
   3. LOGIKA NAVIGASI (HAMBURGER & SCROLL)
   ========================================= */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

// Toggle Menu HP
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('toggle');
});

// Tutup menu otomatis saat link diklik & Smooth Scroll
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Tutup menu
        navLinks.classList.remove('active');
        hamburger.classList.remove('toggle');

        // Scroll halus ke target
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            window.scrollTo({
                top: targetElement.offsetTop - navHeight,
                behavior: 'smooth'
            });
        }
    });
});

/* =========================================
   4. LOGIKA LIVE CAMERA
   ========================================= */
async function toggleCamera() {
    const btn = document.getElementById("camera-btn");
    const container = document.getElementById("webcam-container");
    const previewImg = document.getElementById("image-preview");

    if (!isWebcamActive) {
        // Sembunyikan preview foto upload
        previewImg.style.display = "none";
        container.style.display = "block";

        try {
            webcam = new tmImage.Webcam(350, 350, true); 
            await webcam.setup(); // Minta izin kamera
            await webcam.play();
            
            isWebcamActive = true;
            window.requestAnimationFrame(loop);

            container.innerHTML = "";
            container.appendChild(webcam.canvas);
            setupLabels();

            btn.innerHTML = "Stop Camera";
            btn.style.background = "#e74c3c"; // Merah
        } catch (err) {
            alert("Kamera gagal diakses! Pastikan pakai HTTPS atau Live Server.");
            console.error(err);
        }
    } else {
        // Matikan Kamera
        isWebcamActive = false;
        if (webcam) await webcam.stop();
        container.innerHTML = "";
        btn.innerHTML = "Live Camera";
        btn.style.background = "#6BCB2E"; // Hijau
        if (labelContainer) labelContainer.innerHTML = "";
    }
}

async function loop() {
    if (isWebcamActive && webcam && webcam.canvas) {
        webcam.update();
        await predict(webcam.canvas);
        window.requestAnimationFrame(loop);
    }
}

/* =========================================
   5. LOGIKA UPLOAD FOTO
   ========================================= */
async function handleUpload(input) {
    if (input.files && input.files[0]) {
        // Matikan kamera jika aktif
        if (isWebcamActive) await toggleCamera();

        const reader = new FileReader();
        reader.onload = function (e) {
            const imgElement = document.getElementById("image-preview");
            const container = document.getElementById("webcam-container");
            const clearBtn = document.getElementById("clear-btn");

            // Masukkan gambar & paksa tampil
            imgElement.src = e.target.result;
            imgElement.style.display = "block";
            imgElement.style.margin = "0 auto";
            container.style.display = "none";

            if (clearBtn) clearBtn.style.display = "inline-block";

            imgElement.onload = async function () {
                setupLabels();
                await predict(imgElement);
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/* =========================================
   6. LOGIKA PREDIKSI & UI
   ========================================= */
async function predict(source) {
    if (!model) return;
    const prediction = await model.predict(source);
    
    for (let i = 0; i < maxPredictions; i++) {
        const res = prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(0) + "%";
        if (labelContainer && labelContainer.childNodes[i]) {
            labelContainer.childNodes[i].innerHTML = res;
        }
    }
}

function setupLabels() {
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        const div = document.createElement("div");
        labelContainer.appendChild(div);
    }
}

/* =========================================
   7. FUNGSI CLEAR / RESET
   ========================================= */
function clearImage() {
    const img = document.getElementById("image-preview");
    const container = document.getElementById("webcam-container");
    const clearBtn = document.getElementById("clear-btn");
    const fileInput = document.getElementById("file-input");

    img.style.display = "none";
    img.src = "#";
    container.style.display = "block";
    container.innerHTML = "";
    if (labelContainer) labelContainer.innerHTML = "";
    if (fileInput) fileInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";
}

