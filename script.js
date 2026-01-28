const video = document.getElementById("video");
const captureBtn = document.getElementById("captureBtn");
const canvas = document.getElementById("canvas");
const photo = document.getElementById("photo");
const ctx = canvas.getContext("2d");



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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);
    photo.src = canvas.toDataURL("image/png");
});