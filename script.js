const video = document.getElementById("video");
const captureBtn = document.getElementById("captureBtn");
const canvas = document.getElementById("canvas");
const photo = document.getElementById("photo");
const ctx = canvas.getContext("2d");
const photoGrid = document.getElementById("photoGrid");
let currentFilter = "none";
let photoCount = 0;

// Akses Kamera
navigator.mediaDevices.getUserMedia( {video: true} )
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        alert("Camera access denied!");
        console.error(err);
    });

// Ambil Foto
captureBtn.addEventListener("click", () => {
    if (photoCount >= 4) {
        photoGrid.innerHTML = "";
        photoCount = 0;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (currentFilter === "grayscale") {
        ctx.filter = "grayscale(100%)";
    } else if (currentFilter === "sepia") {
        ctx.filter = "sepia(100%)";
    } else {
        ctx.filter = "none";
    }

    ctx.drawImage(video, 0, 0);
    ctx.filter = "none";

    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");

    photoGrid.appendChild(img);
    photoCount++;
});


// Filter foto
document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", ()=> {
        currentFilter = btn.dataset.filter;
    });
});
