/* =========================================
   1. PENGATURAN MODEL & VARIABLE GLOBAL
   ========================================= */
const URL_MODEL = "https://teachablemachine.withgoogle.com/models/clHoD9cPB/";

let model, webcam, labelContainer, maxPredictions;
let isWebcamActive = false;

async function loadModel() {
    try {
        const modelURL = URL_MODEL + "model.json";
        const metadataURL = URL_MODEL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("AI Berhasil Dimuat!");
    } catch (e) {
        console.error("Gagal muat AI.", e);
    }
}
loadModel();

/* =========================================
   2. LOGIKA LIVE CAMERA
   ========================================= */
async function toggleCamera() {
    const btn = document.getElementById("camera-btn");
    const container = document.getElementById("webcam-container");
    const previewImg = document.getElementById("image-preview");
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");
    const wrapper = document.getElementById("webcam-wrapper"); // Ambil wrapper

    if (!isWebcamActive) {
        // MUNCULKAN KOTAK MONITOR
        wrapper.classList.add("active-monitor");
        
        previewImg.style.display = "none";
        container.style.display = "block";

        try {
            webcam = new tmImage.Webcam(350, 350, true); 
            await webcam.setup();
            await webcam.play();
            
            isWebcamActive = true;
            window.requestAnimationFrame(loop);

            container.innerHTML = "";
            container.appendChild(webcam.canvas);
            setupLabels();

            btn.innerHTML = "Stop Camera";
            btn.style.background = "#e74c3c";
            statusDot.style.backgroundColor = "#6BCB2E";
            statusText.innerText = "SYSTEM ACTIVE";
        } catch (err) {
            alert("Kamera gagal diakses!");
            wrapper.classList.remove("active-monitor"); // Tutup lagi kalau gagal
        }
    } else {
        isWebcamActive = false;
        if (webcam) await webcam.stop();
        
        // SEMBUNYIKAN KOTAK MONITOR
        wrapper.classList.remove("active-monitor");
        
        container.innerHTML = "";
        btn.innerHTML = "Start Scanner";
        btn.style.background = "#6BCB2E";
        statusDot.style.backgroundColor = "#ff4d4d";
        statusText.innerText = "SYSTEM READY";
        if (labelContainer) labelContainer.innerHTML = '<p class="placeholder-text">Waiting for input data...</p>';
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
   3. LOGIKA PREDIKSI & SMART GUIDANCE
   ========================================= */
async function predict(source) {
    if (!model) return;
    const prediction = await model.predict(source);
    const instruction = document.getElementById("instruction-text");
    
    for (let i = 0; i < maxPredictions; i++) {
        const prob = (prediction[i].probability * 100).toFixed(0);
        const className = prediction[i].className;
        
        if (labelContainer && labelContainer.childNodes[i]) {
            labelContainer.childNodes[i].innerHTML = `<span>${className}</span> <span>${prob}%</span>`;
            
            if (prediction[i].probability > 0.6) {
                labelContainer.childNodes[i].style.opacity = "1";
                labelContainer.childNodes[i].style.transform = "scale(1.02)";
                
                if (className === "Organik") {
                    instruction.innerHTML = "🌱 <strong>Organik:</strong> Bisa diolah jadi kompos. Buang ke tong sampah HIJAU.";
                } else if (className === "Anorganik") {
                    instruction.innerHTML = "♻️ <strong>Anorganik:</strong> Bisa didaur ulang. Buang ke tong sampah KUNING.";
                } else if (className === "B3") {
                    instruction.innerHTML = "⚠️ <strong>B3:</strong> BAHAYA! Limbah kimia/medis. Gunakan wadah khusus.";
                }
            } else {
                labelContainer.childNodes[i].style.opacity = "0.5";
                labelContainer.childNodes[i].style.transform = "scale(1)";
            }
        }
    }
}

function setupLabels() {
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    const classNames = ["organik", "anorganik", "b3"]; 

    for (let i = 0; i < maxPredictions; i++) {
        const div = document.createElement("div");
        div.classList.add("result-item");
        div.classList.add(classNames[i]);
        labelContainer.appendChild(div);
    }
}

/* =========================================
   4. UPLOAD & RESET (PENTING)
   ========================================= */
async function handleUpload(input) {
    if (input.files && input.files[0]) {
        // MUNCULKAN KOTAK MONITOR
        document.getElementById("webcam-wrapper").classList.add("active-monitor");

        if (isWebcamActive) await toggleCamera();
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgElement = document.getElementById("image-preview");
            const container = document.getElementById("webcam-container");
            const clearBtn = document.getElementById("clear-btn");

            imgElement.src = e.target.result;
            imgElement.style.display = "block";
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

function clearImage() {
    const img = document.getElementById("image-preview");
    const container = document.getElementById("webcam-container");
    const clearBtn = document.getElementById("clear-btn");
    const fileInput = document.getElementById("file-input");
    
    // SEMBUNYIKAN KOTAK MONITOR PAS RESET
    document.getElementById("webcam-wrapper").classList.remove("active-monitor");

    img.style.display = "none";
    img.src = "";
    container.style.display = "block";
    container.innerHTML = "";
    if (labelContainer) labelContainer.innerHTML = '<p class="placeholder-text">Waiting for input data...</p>';
    if (fileInput) fileInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    document.getElementById("instruction-text").innerText = "Arahkan kamera ke objek sampah untuk memulai identifikasi.";
}
