const video = document.getElementById("video");

const captureBtn = document.getElementById("captureBtn");

const canvas = document.getElementById("canvas");

const photo = document.getElementById("photo");

const ctx = canvas.getContext("2d");

const photoGrid = document.getElementById("photoGrid");

let currentFilter = "none";

let photoCount = 0;

const downloadBtn = document.getElementById("downloadBtn");

let currentFrame = null;

const photos = [];

const frame = document.getElementById("frame");

let layoutMode = "grid"; // "grid" | "strip"


// Akses Kamera
navigator.mediaDevices.getUserMedia( {video: true} )
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        alert("Camera access denied!");
        console.error(err);
    });

// Ambil Foto (hasilnya berubah sesuai filter)
captureBtn.addEventListener("click", () => {
    
    //reset setelah 4x take foto
    if (photoCount >= 4) {
        photoGrid.innerHTML = "";
        photos.length = 0;
        photoCount = 0;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    //filter
    ctx.filter = 
        currentFilter === "grayscale" ? "grayscale(100%)" :
        currentFilter === "sepia" ? "sepia(100%)" :
        "none";

    ctx.drawImage(video, 0, 0);
    ctx.filter = "none";

    // gambar frame ke canvas
    if (currentFrame) {
        const frameImg = new Image();
        frameImg.src = currentFrame;
        frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            savePhoto();
        };
    } else {
        savePhoto();
    }
});
function savePhoto() {
    const data = canvas.toDataURL("image/png");

    photos.push({
        src: data,
        w: canvas.width,
        h: canvas.height,
        time: new Date()
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
    const photoW = photos[0].w / 2;
    const photoH = photos[0].h / 2;

    let cols, rows;

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
            if (loaded === photos.length) drawFooter();
        };
    });
};

function downloadFinal() {
    const link = document.createElement("a");
    link.download = "photobooth.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function drawFooter() {
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        "PhotoBooth Team",
        canvas.width / 2,
        canvas.height - 30
    );
    downloadFinal();
}

const time = new Date().toLocaleString();
ctx.font = "14px Arial";
ctx.fillText(time, canvas.width / 2, canvas.height - 10);
