let faceLandmarker = null;
let aiEnabled = false;
let aiRunning = false;
let lastVideoTime = -1;

const video = document.getElementById("video");
const faceCanvas = document.getElementById("faceCanvas");
const faceCtx = faceCanvas.getContext("2d");
const aiButton = document.getElementById("aiToggleBtn");

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

function drawBoundingBox(box){
    const x = box.x * faceCanvas.width;
    const y = box.y * faceCanvas.height;
    const width = box.width * faceCanvas.width;
    const height = box.height * faceCanvas.height;

    faceCtx.clearRect(0,0,faceCanvas.width, faceCanvas.height);
    faceCtx.strokeStyle = "#00ff88";
    faceCtx.lineWidth = 3;
    faceCtx.strokeRect(x, y, width, height);
}

function classifyExpression(smileScore){
    if (smileScore < 0.15) {
        return "Neutral";
    }
    if (smileScore < 0.40) {
        return "Slight Smile";
    }  
    if (smileScore < 0.70) {
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
            
            if (results.faceLandmarks.length > 0) {
                const landmarks = results.faceLandmarks[0];
                const box = getBoundingBox(landmarks);
                drawBoundingBox(box);
            }

            //Pengkondisian apakah AI mendeteksi wajah atau tidak
            if (results.faceBlendshapes.length > 0) {
                const blendshapes = results.faceBlendshapes[0].categories;
                
                const smileLeft = getBlendshapeScore(blendshapes, "mouthSmileLeft");
                const smileRight = getBlendshapeScore(blendshapes, "mouthSmileRight");

                const smileScore = (smileLeft + smileRight) / 2;
                // console.log("Smile Score:", smileScore);

                const expression = classifyExpression(smileScore); 
                
                console.log("Smile:", smileScore.toFixed(3), " | Expression:", expression);
                // console.log(
                //     results.faceBlendshapes[0].categories
                // );
            }
            // console.log(results);
            else {
                faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
                // console.log("No face detected.");
            }
        }
    }
    requestAnimationFrame(detectFace);
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

    faceCtx.strokeStyle = "red";
    faceCtx.lineWidth = 10;

    faceCtx.strokeRect(
        50,
        50,
        200,
        200
    );
});
