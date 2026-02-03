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
    // gambar frame ke canvas 
    // if (currentFrame) {
    //     const frameImg = new Image();
    //     frameImg.src = currentFrame;
    //     frameImg.onload = () => {
    //         ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
    //         savePhoto();
    //     };
    // } else {
    //     savePhoto();
    // }
});

function updatePreviewLayout() {
    photoGrid.classList.remove("grid", "strip");
    photoGrid.classList.add(layoutMode);
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
document.querySelectorAll("[data-frame]").forEach(btn => {
    btn.onclick = () => {
        frame.src = btn.dataset.frame;
        currentFrame = btn.dataset.frame;
    };
});

// Logic Download Foto dari canvas
downloadBtn.onclick = () => {
    if (photos.length === 0) return;

    const margin = 20;
    const photoW = photos[0].w / 2;     //600
    const photoH = photos[0].h / 2;     //600

    let cols, rows;

    //mode layout
    if (layoutMode === "grid") {
        cols = 2;
        rows = Math.ceil(photos.length / 2);
    } else {
        cols = 1;
        rows = photos.length;
    }

    canvas.width  = cols * photoW + (cols + 1) * margin;
    canvas.height = rows * photoH + (rows + 1) * margin + 60;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loaded = 0;

    photos.forEach((p, index) => {
        const img = new Image();
        img.src = p.src;
        img.onload = () => {
            const x = margin + (layoutMode === "grid" ? (index % 2) * (photoW + margin) : 0);
            const y = margin + Math.floor(index / (layoutMode === "grid" ? 2 : 1)) * (photoH + margin);

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

