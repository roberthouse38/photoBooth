// VIDEO  → preview
// CANVAS → hasil
// PHOTOS → data
// GRID   → UI
// DOWNLOAD → canvas final

//Setup, id diambil dari laman html
const video = document.getElementById("video");             //live cam         
const captureBtn = document.getElementById("captureBtn");   //tombol capture
const canvas = document.getElementById("canvas");           //hasil capture
const photo = document.getElementById("photo");             //
const ctx = canvas.getContext("2d");                        //kuas
const photoGrid = document.getElementById("photoGrid");     //preview grid
const downloadBtn = document.getElementById("downloadBtn"); //tombol download canvas
const photos = [];                                          //array hasil foto (album mentah)
const frame = document.getElementById("frame");             //frame custom

// //State or variabel kontrol  (METODE LAMA)        
// let currentFilter = "none";         // filter aktif diawal? (tidak) 
// let currentFrame = null;            // overlay png 
// let layoutMode = "grid";            // "grid" | "strip"
// let useFrameOnDownload = true;      // lol idk
// let retakeIndex = null;             // null = mode normal

// State (METODE BARU)   
const STATE = {
    layout: "grid",
    filter: "none",
    frame: null,
    retakeIndex: null,
    maxPhotos: 4,

    effects: {
        grain: false,
        lightLeak: false,
        vignette: false,
        duotone: false
    }
};
// Layout
const LAYOUTS = {
    grid: {
        canvasWidth: 700,
        canvasHeight: 600,
        cols: 2,
        rows: 2,
        frames: ["frame/frame1.png"]
    },
    strip: {
        canvasWidth: 360,
        canvasHeight: 1120,
        cols: 1,
        rows: 4,
        frames: ["frame/frame2.png"]
    }
};
// Filters
const FILTERS = {
  normal: "none",
  grayscale: "grayscale(1)",
  sepia: "sepia(1)",
  vintage: "contrast(1.1) brightness(1.05) sepia(0.6)",
  neon: "contrast(1.6) saturate(2) hue-rotate(90deg)",
  purple: "hue-rotate(260deg) saturate(1.5)",
  goldenHour: "sepia(0.4) contrast(1.2) brightness(1.1) hue-rotate(-10deg)",
  DisposableCamera: "contrast(1.3) saturate(1.4) brightness(1.05)"
};

// Akses Kamera (real-time)
navigator.mediaDevices.getUserMedia( {video: true} )    //izin kamera ke browser  
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        alert("Camera access denied!");                 //alert message  
        console.error(err);
    });

// Tombol Ambil Foto (hasilnya berubah sesuai filter)
captureBtn.addEventListener("click", () => {

    // kalau sudah 4 dan bukan retake -> stop
    if (photos.length >= STATE.maxPhotos && STATE.retakeIndex === null){
        return;
    }

    //ukuran foto 
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    //filter kamera
    ctx.filter = FILTERS[STATE.filter] || "none";


    //snapshot 1 frame kamera ke canvas
    ctx.drawImage(video, 0, 0);
    ctx.filter = "none";

    savePhoto();
    updatePreviewLayout();

    //disabling mode retake
    if (photos.length >= 4 && STATE.retakeIndex === null){
        captureBtn.disabled = true;
        captureBtn.classList.add("opacity-50");
    }
});

//Preview
function updatePreviewLayout() {
    const layout = LAYOUTS[STATE.layout];
    const previewBox = document.querySelector(".preview-box");
    const grid = document.getElementById("photoGrid");

    //grid class change system anjay
    grid.className = "photo-grid " + STATE.layout;

    // set aspect ratio preview sesuai canvas
    previewBox.style.aspectRatio =
        layout.canvasWidth + " / " + layout.canvasHeight;
}

// const
const layoutConfig = {
    grid: {
        defaultFrame: "frame/frame1.png"
    },
    strip: {
        defaultFrame: "frame/frame2.png"
    }
};

// Fungsi pasang frame
function updateLayoutButtons() {
    const frameButtons = document.querySelectorAll(".frame-btn");

    frameButtons.forEach(btn => {
        if (btn.dataset.layout === STATE.layout){
            btn.disabled = false;
            btn.classList.remove("btn-secondary");
        } else {
            btn.disabled = true;
            btn.classList.add("btn-secondary");
        }
    });
}

document.querySelectorAll(".frame-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        const framePath = btn.dataset.frame;

        if (!framePath) {
            STATE.frame = null;
            framePreview.src = "";
            return;
        }

        STATE.frame = framePath;
        framePreview.src = framePath;
    });
});

document.querySelectorAll(".effect-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        const effectName = btn.dataset.effect;

        // toggle true/false
        STATE.effects[effectName] = !STATE.effects[effectName];

        // highlight tombol aktif
        if (STATE.effects[effectName]) {
            btn.classList.remove("btn-outline-dark");
            btn.classList.add("btn-dark");
        } else {
            btn.classList.remove("btn-dark");
            btn.classList.add("btn-outline-dark");
        }
    });
});


// Fungsi layout dan frame saling terhubung
function highlightActiveLayout() {
    const layoutButtons = document.querySelectorAll(".layout-btn");

    layoutButtons.forEach(btn => {
        if (btn.dataset.layout === STATE.layout) {
            btn.classList.remove("btn-outline-secondary");
            btn.classList.add("btn-primary");
        } else {
            btn.classList.remove("btn-primary");
            btn.classList.add("btn-outline-secondary");
        }
    });
}

function setLayout(mode) {
    STATE.layout = mode;

    // reset frame
    STATE.frame = null;
    framePreview.src = "";
    
    updatePreviewLayout();  
    updateLayoutButtons();
    highlightActiveLayout();
}

function applyFilmGrain(intensity = 30) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;

        data[i] += noise;     // R
        data[i + 1] += noise; // G
        data[i + 2] += noise; // B
    }

    ctx.putImageData(imageData, 0, 0);
}
function applyLightLeak() {
    const gradient = ctx.createLinearGradient(
        0, 0,
        canvas.width,
        canvas.height
    );

    gradient.addColorStop(0, "rgba(255, 0, 120, 0.25)");
    gradient.addColorStop(0.5, "rgba(255, 200, 0, 0.15)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function applyDuotone(color1, color2) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;

        data[i]     = (avg / 255) * color1.r + (1 - avg/255) * color2.r;
        data[i + 1] = (avg / 255) * color1.g + (1 - avg/255) * color2.g;
        data[i + 2] = (avg / 255) * color1.b + (1 - avg/255) * color2.b;
    }

    ctx.putImageData(imageData, 0, 0);
}
function applyVignette() {
    const gradient = ctx.createRadialGradient(
        canvas.width/2,
        canvas.height/2,
        canvas.width/4,
        canvas.width/2,
        canvas.height/2,
        canvas.width/1.2
    );

    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.5)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);
}


// fungsi simpan foto as a data
function savePhoto() {
    const data = canvas.toDataURL("image/png");

    //data foto
    const photoData = {
        src: data,
        w: canvas.width,
        h: canvas.height,
        time: new Date()
    };

    // kalau sedang masuk mode retake
    if (STATE.retakeIndex != null) {

        photos[STATE.retakeIndex] = photoData;
        //update gambar di grid
        photoGrid.children[STATE.retakeIndex].src = data;
        //hapus highlight
        photoGrid.children[STATE.retakeIndex].classList.remove("selected");
        //keluar dari mode retake
        STATE.retakeIndex = null;

        if (photos.length >= 4){
            captureBtn.disabled = true;
            captureBtn.classList.add("opacity-50")
        }

        return;
    }

    // mode normal
    photos.push(photoData);

    const img = document.createElement("img");
    img.src = data;
    img.dataset.index = photos.length - 1;

    photoGrid.appendChild(img);

    img.addEventListener("click", () => {
        document.querySelectorAll(".photo-grid img").forEach(i => i.classList.remove("selected"));

        img.classList.add("selected");

        STATE.retakeIndex = Array.from(photoGrid.children).indexOf(img);
        alert("Retake photo #" + (STATE.retakeIndex + 1));

        //saat sudah 4x take, captureBtn aktif
        captureBtn.disabled = false;
        captureBtn.classList.remove("opacity-50")
    });
}

// Filter foto (untuk pas preview video)
document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", ()=> {
        STATE.filter = btn.dataset.filter;

        video.className = "rounded shadow w-100";
        if (STATE.filter === "grayscale") {
            video.classList.add("filter-grayscale"); //ini di css class            
        } else if (STATE.filter === "sepia") {
            video.classList.add("filter-sepia"); //ini juga
        }
    });
});

// Frame Foto
const framePreview = document.getElementById("framePreview");

// Logic Reset Button
const resetBtn = document.getElementById("resetBtn");

resetBtn.addEventListener("click", () => {
    
    photoGrid.innerHTML = "";
    photos.length = 0;
    STATE.retakeIndex = null;

    captureBtn.disabled = false;
    captureBtn.classList.remove("opacity-50");
});


// Logic Download Foto dari canvas
downloadBtn.onclick = () => {
    if (photos.length === 0) return;

    const layout = LAYOUTS[STATE.layout];

    canvas.width = layout.canvasWidth;
    canvas.height = layout.canvasHeight;

    ctx.fillStyle = "#fff";
    // ctx.fillStyle = "rgba(255, 0, 150, 0.2)";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    const margin = 20;
    const availableW = canvas.width - (layout.cols + 1) * margin;
    const availableH = canvas.height - (layout.rows + 1) * margin - 60;

    const photoW = availableW / layout.cols;
    const photoH = availableH / layout.rows;

    let loaded = 0;

    photos.forEach((p, index) => {
        const img = new Image();
        img.src = p.src;
        img.onload = () => {
            const col = index % layout.cols;
            const row = Math.floor(index/layout.cols);

            const x = margin + col * (photoW + margin);
            const y = margin + row * (photoH + margin);

            ctx.drawImage(img, x, y, photoW, photoH);

            loaded++;
            if (loaded === photos.length) drawFinal();
        };
    });
};

function downloadFinal() {
    const link = document.createElement("a");
    link.download = "photobooth.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function drawFinal() {

    if (STATE.effects.duotone) {
        applyDuotone(
            {r:255,g:0,b:120},
            {r:0,g:0,b:80}
        );
    }

    if (STATE.effects.grain) {
        applyFilmGrain(25);
    }

    if (STATE.effects.lightLeak) {
        applyLightLeak();
    }

    if (STATE.effects.vignette) {
        applyVignette();
    }

    if (STATE.frame){
        const frameImg = new Image();
        frameImg.src = STATE.frame;
        frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            drawFooter();
        };
    } else {
        drawFooter();
    }
}


function drawFooter() {
    ctx.fillStyle = "#333";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    const time = new Date().toLocaleString();
    ctx.fillText(
        "PhotoBooth Team",
        canvas.width / 2,
        canvas.height - 35
    );
    ctx.font = "14px Arial";
    ctx.fillText(
        time,
        canvas.width / 2,
        canvas.height - 15
    );
    downloadFinal();
}

