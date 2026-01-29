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
    photos.push(data);

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
            video.classList.add("filter-sepia");
        }
    });
});

// Framme Foto
document.querySelectorAll("[data-frame]").forEach(btn => {
    btn.onclick = () => {
        frame.src = btn.dataset.frame;
        currentFrame = btn.dataset.frame;
    };
});

// Logic Download Foto
downloadBtn.onclick = () => {
    if(photos.length === 0) return;

    const size = 300;
    const cols = 2;
    const rows = Math.ceil(photos.length/2); 

    canvas.width = size * cols;
    canvas.height = size * rows;

    let loaded = 0

    photos.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const x = (index % 2) * size;
            const y = Math.floor(index / 2) * size;
            ctx.drawImage(img, x, y, size, size);
            
            loaded++;
            if (loaded === photos.length) {
                downloadFinal();
            }
        };
    });
};

function downloadFinal() {
    const link = document.createElement("a");
    link.download = "photobooth.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}