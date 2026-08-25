let faceLandmarker = null;
let aiEnabled = false;
let aiRunning = false;
let lastVideoTime = -1;
let smileHistory = [];
let currentExpression = "Neutral";

const video = document.getElementById("video");
const faceCanvas = document.getElementById("faceCanvas");
const faceCtx = faceCanvas.getContext("2d");
const aiButton = document.getElementById("aiToggleBtn");
const SMOOTHING_WINDOW = 5;

import { 
    FaceLandmarker,
    FilesetResolver     //JS -> Task MediaPipe -> WASM/runtime -> AI MOdel
 } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";
    console.log("MediaPipe Face Landmarker loaded successfully");

async function initializeAI(){
    console.log("Load AI...");

        const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");

            console.log("MediaPipe Vision Runtime Ready!");


        faceLandmarker = await FaceLandmarker.createFromOptions( 
            vision, 
            {
                baseOptions: {modelAssetPath: "./models/face_landmarker.task"},
                runningMode: "VIDEO",
                numFaces:  1,
                minFaceDetectionConfidence:0.5,
                minFacePresenceConfidence:0.5,
                minTrackingConfidence:0.5,

                outputFaceBlendshapes: true,
                // outputFacialTransformationMatrixes: false,
                // result_callback: Optional[Callable[[FaceLandmarkerResult, image_lib.Image, int], None]] = None
            }
        );
    console.log("Face Landmarker Ready!");   
}

async function enableAI(){
    aiButton.disabled = true;
    aiButton.textContent = "Initializing AI...";

    try {
        if (!faceLandmarker){
            await initializeAI();
        }

        aiEnabled = true;
        aiButton.textContent = "Disable AI";
        aiButton.classList.remove("btn-outline-primary");
        aiButton.classList.add("btn-primary");
        startDetection();
    } catch (error) {
        console.error("Error initializing AI:", error);
        alert("Failed to initialize AI. Please check the console for details.");
        aiButton.textContent = "Enable AI";
    } finally {
        
        aiButton.disabled = false;
    }
}

function disableAI(){
    aiEnabled = false;
    aiRunning = false;

    smileHistory = [];
    currentExpression = "Neutral";
    
    aiButton.textContent = "Enable AI";

    aiButton.classList.remove("btn-primary");
    aiButton.classList.add("btn-outline-primary");

    faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
    console.log("AI Disabled");
}

function startDetection(){
    if(aiRunning) return;
    aiRunning = true;
    detectFace();
}

function getBoundingBox(landmarks){
    let minX = 1; 
    let minY = 1;
    let maxX = 0; 
    let maxY = 0;

    landmarks.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

function drawBoundingBox(box, expression){
    const x = box.x * faceCanvas.width;
    const y = box.y * faceCanvas.height;
    const width = box.width * faceCanvas.width;
    const height = box.height * faceCanvas.height;

    //Detail Kotak Deteksi Wajah
    faceCtx.clearRect(0,0,faceCanvas.width, faceCanvas.height);
    faceCtx.strokeStyle = "#00ff88";
    faceCtx.lineWidth = 3;
    faceCtx.strokeRect(x, y, width, height);

    //Font
    faceCtx.font = " bold 20px Arial";

    const text = expression;
    const paddingX = 10;
    const paddingY = 6;

    // Mengukur ukuran teks agar label dapat ditempatkan dengan benar di atas kotak deteksi
    const textWidth = faceCtx.measureText(text).width;
    const labelHeight = 30; 

    const labelx = x;
    const labely = Math.max(0, y - labelHeight);

    // Background label
    faceCtx.fillStyle = "#00ff88";
    faceCtx.fillRect(labelx, labely, textWidth + paddingX * 2, labelHeight);    

    // Teks label
    faceCtx.fillStyle = "#000000";
    faceCtx.textBaseline = "middle";
    faceCtx.fillText(text, labelx + paddingX, labely + labelHeight / 2);

}

function classifyExpression(blendshapes){

    // Mengambil skor senyum dan frown dari blendshapes
    const smileScore = getAverageScore(blendshapes, "mouthSmileLeft","mouthSmileRight");        //Happy
    
    // Mengambil skor frown dari blendshapes untuk ekspresi sedih  
    const frownScore = getAverageScore(blendshapes, "mouthFrownLeft","mouthFrownRight");        //Sad

    //Skor untuk ekspresi terkejut (surprised) berdasarkan mulut dan mata
    const surpriseMouth = getBlendshapeScore(blendshapes, "jawOpen");
    const surpriseEyes = getAverageScore(blendshapes, "eyeWideLeft", "eyeWideRight");

    //Skor untuk ekspresi marah (angry) berdasarkan alis
    const angryScore = getAverageScore(blendshapes, "browDownLeft", "browDownRight");
    const squintScore = getAverageScore(blendshapes, "eyeSquintLeft", "eyeSquintRight");

    //Smoothing untuk mengurangi fluktuasi skor senyum agar ekspresi wajah lebih stabil
    const smoothSmile = smoothSmileScore(smileScore);

    // const surpriseScore = (surpriseMouth + surpriseEyes) / 2;

    //debugging output untuk memantau skor ekspresi wajah
    console.log(
        "Smile:", smileScore.toFixed(3),
        "| Frown:", frownScore.toFixed(3),
        "| Jaw:", surpriseMouth.toFixed(3),
        "| Eyes:", surpriseEyes.toFixed(3),
        "| Brow:", angryScore.toFixed(3),
        "| Squint:", squintScore.toFixed(3)
    );

    //Threshold untuk menentukan ekspresi wajah berdasarkan skor f
    if (frownScore > 0.30 && smoothSmile < 0.20) {
        return "Sad";
    }
    if (surpriseMouth > 0.35 && surpriseEyes > 0.15) {
        return "Surprised";
    }
    if (angryScore > 0.40 && frownScore > 0.15) {
        return "Angry";
    }
    if (smoothSmile < 0.15) {
        return "Neutral";
    }
    if (smoothSmile < 0.40) {
        return "Slight Smile";
    }  
    if (smoothSmile < 0.70) {
        return "Happy";
    }
    return "Super Happy";
}

function getBlendshapeScore(categories, categoryName){
    const category = categories.find(
        item => item.categoryName === categoryName
    );

    if (!category) {
        console.warn(`Blendshape category "${categoryName}" not found.`);
        return 0;
    }
    
    return category.score;
}

function getAverageScore(categories, leftName, rightName){
    const leftScore = getBlendshapeScore(categories, leftName);
    const rightScore = getBlendshapeScore(categories, rightName);
    return (leftScore + rightScore) / 2;
}

function detectFace(){
    if(!aiEnabled){ 
        aiRunning = false;
        return;
    }
    
    if(
        video.readyState >= 2 &&
        video.videoWidth > 0  &&
        video.videoHeight > 0
    ){
        if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;    // Perform face detection logic here 
            
            const results = faceLandmarker.detectForVideo(video, performance.now());
            
            // Pengkondisian apakah AI mendeteksi wajah atau tidak
            if (results.faceLandmarks.length > 0 && results.faceBlendshapes.length > 0) {
                
                const landmarks = results.faceLandmarks[0];
                const box = getBoundingBox(landmarks);

                // Mengambil data blendshapes dari hasil deteksi wajah (misal mulut, mata, alis, dll)
                const blendshapes = results.faceBlendshapes[0].categories;
            
                // Klasifikasi ekspresi berdasarkan semua data blendshape
                const expression = classifyExpression(blendshapes);

                //RESULTS
                drawBoundingBox(box, expression);

                console.log("Expression:", expression);
            
            }
            else {
                faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
                // console.log("No face detected.");
            }
        }
    }
    requestAnimationFrame(detectFace);
}

function smoothSmileScore(newScore){
    smileHistory.push(newScore);
    if (smileHistory.length > SMOOTHING_WINDOW) {
        smileHistory.shift(); // Remove the oldest score
    }
    const total = smileHistory.reduce((sum, score) => sum + score, 0);
    return total / smileHistory.length;
}

aiButton.addEventListener("click", async () => {
    if(!aiEnabled){
        await enableAI();
    } else {
        disableAI();
    }
});

video.addEventListener("loadedmetadata", () => {

    console.log(
        "VIDEO:",
        video.videoWidth,
        video.videoHeight
    );

    faceCanvas.width =
        video.videoWidth;

    faceCanvas.height =
        video.videoHeight;

    console.log(
        "CANVAS:",
        faceCanvas.width,
        faceCanvas.height
    );

    // faceCtx.strokeStyle = "red";
    // faceCtx.lineWidth = 10;

    // faceCtx.strokeRect(
    //     50,
    //     50,
    //     200,
    //     200
    // );
});
