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

//State or variabel kontrol         
let currentFilter = "none";         // filter aktif diawal? (tidak) 
let currentFrame = null;            // overlay png 
let layoutMode = "grid";            // "grid" | "strip"
let useFrameOnDownload = true;      // lol idk
let retakeIndex = null;             // null = mode normal

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
    if (photos.length >= 4 && retakeIndex === null) {
        return;
    }

    //ukuran foto 
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    //filter kamera
    ctx.filter = 
        currentFilter === "grayscale" ? "grayscale(100%)" :
        currentFilter === "sepia" ? "sepia(100%)" :
        "none";

    //snapshot 1 frame kamera ke canvas
    ctx.drawImage(video, 0, 0);
    ctx.filter = "none";

    savePhoto();
    updatePreviewLayout();

    //disabling mode retake
    if (photos.length >= 4 && retakeIndex === null){
        captureBtn.disabled = true;
        captureBtn.classList.add("opacity-50");
    }
});

// Layout
const LAYOUTS = {
    grid: {
        canvasWidth: 700,
        canvasHeight: 600,
        cols: 2,
        rows: 2
    },
    strip: {
        canvasWidth: 360,
        canvasHeight: 1120,
        cols: 1,
        rows: 4
    }
};

//Preview
function updatePreviewLayout() {
    const layout = LAYOUTS[layoutMode];
    const previewBox = document.querySelector(".preview-box");
    const grid = document.getElementById("photoGrid");

    //grid class change system anjay
    grid.className = "photo-grid " + layoutMode;

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
        if (btn.dataset.layout === layoutMode){
            btn.disabled = false;
            btn.classList.remove("btn-secondary");
        } else {
            btn.disabled = true;
            btn.classList.add("btn-secondary");
        }
    });
}

// Fungsi layout dan frame saling terhubung
function highlightActiveLayout() {
    const layoutButtons = document.querySelectorAll(".layout-btn");

    layoutButtons.forEach(btn => {
        if (btn.dataset.layout === layoutMode) {
            btn.classList.remove("btn-outline-secondary");
            btn.classList.add("btn-primary");
        } else {
            btn.classList.remove("btn-primary");
            btn.classList.add("btn-outline-secondary");
        }
    });
}

function setLayout(mode) {
    layoutMode = mode;

    // auto set default frame
    currentFrame = layoutConfig[mode].defaultFrame;
    document.getElementById("framePreview").src = currentFrame;
    
    updatePreviewLayout();  
    updateLayoutButtons();
    highlightActiveLayout();
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
    if (retakeIndex != null) {

        photos[retakeIndex] = photoData;
        //update gambar di grid
        photoGrid.children[retakeIndex].src = data;
        //hapus highlight
        photoGrid.children[retakeIndex].classList.remove("selected");
        //keluar dari mode retake
        retakeIndex = null;

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

        retakeIndex = Array.from(photoGrid.children).indexOf(img);
        alert("Retake photo #" + (retakeIndex + 1));

        //saat sudah 4x take, captureBtn aktif
        captureBtn.disabled = false;
        captureBtn.classList.remove("opacity-50")
    });
}

// Filter foto (untuk pas preview video)
document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", ()=> {
        currentFilter = btn.dataset.filter;

        video.className = "rounded shadow w-100";
        if (currentFilter === "grayscale") {
            video.classList.add("filter-grayscale"); //ini di css class            
        } else if (currentFilter === "sepia") {
            video.classList.add("filter-sepia"); //ini juga
        }
    });
});

// Frame Foto
const framePreview = document.getElementById("framePreview");

document.querySelectorAll("[data-frame]").forEach(btn => {
    btn.onclick = () => {
        currentFrame = btn.dataset.frame;

        // kanan (preview)
        framePreview.src = currentFrame;
    };
});

// Logic Reset Button
const resetBtn = document.getElementById("resetBtn");

resetBtn.addEventListener("click", () => {
    
    photoGrid.innerHTML = "";
    photos.length = 0;
    retakeIndex = null;

    captureBtn.disabled = false;
    captureBtn.classList.remove("opacity-50");
});


// Logic Download Foto dari canvas
downloadBtn.onclick = () => {
    if (photos.length === 0) return;

    const layout = LAYOUTS[layoutMode];

    canvas.width = layout.canvasWidth;
    canvas.height = layout.canvasHeight;

    ctx.fillStyle = "#fff";
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
    if (useFrameOnDownload && currentFrame) {
        const frameImg = new Image();
        frameImg.src = currentFrame;
        frameImg.onload = () => {
            ctx.drawImage(
                frameImg,
                0,
                0,
                canvas.width,
                canvas.height
            );
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

