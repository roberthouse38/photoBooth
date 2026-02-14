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
let photoCount = 0;                 // berapa kali capture foto
let currentFrame = null;            // overlay png 
let layoutMode = "grid";            // "grid" | "strip"
let useFrameOnDownload = true;

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
    //reset setelah 4x take foto
    if (photoCount >= 4) {
        photoGrid.innerHTML = "";
        photos.length = 0;
        photoCount = 0;
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

// fungsi simpan foto as a data
function savePhoto() {
    const data = canvas.toDataURL("image/png");

    photos.push({
        src: data,          //gambar
        w: canvas.width,    //lebar ukuran picture device
        h: canvas.height,   //panjang ukuran picture device
        time: new Date()    //timestamp
    });

    const img = document.createElement("img");
    img.src = data;
    photoGrid.appendChild(img);

    photoCount++;
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

