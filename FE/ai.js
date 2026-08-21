let faceLandmarker = null;
let aiEnabled = false;
let aiRunning = false;
let lastVideoTime = -1;

import { 
    FaceLandmarker,
    FilesetResolver     //JS -> Task MediaPipe -> WASM/runtime -> AI MOdel
 } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";
    console.log("MediaPipe Face Landmarker loaded successfully");


const video = document.getElementById("video");
const faceCanvas = document.getElementById("faceCanvas");
const faceCtx = faceCanvas.getContext("2d");
const aiButton = document.querySelector(".AI-controls button");


async function initializeAI(){
    console.log("Initializing AI...");

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
                // outputFaceBlendshapes: false,
                // outputFacialTransformationMatrixes: false,
                // result_callback: Optional[Callable[[FaceLandmarkerResult, image_lib.Image, int], None]] = None
            }
        );
    console.log("Face Landmarker Ready!");   
}

aiButton.addEventListener("click", async () => {
    if(!aiEnabled){
        await enableAI();
    } else {
        disableAI();
    }
});

async function enableAI(){
    aiButton.disabled = true;
    aiButton.textContent = "Initializing AI...";

    try {
        if (!faceLandmarker){
            await initializeAI();
        }

        aiEnabled = true;
        aiButton.textContent = "Disable AI";
        aiButton.classList.remove("btn-primary");
        aiButton.classList.add("btn-outline-primary");
        startDecision();
    } catch (error) {
        console.error("Error initializing AI:", error);
        alert("AI Error");
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
            console.log(results);

            if (results.faceLandmarks.length > 0) {
                console.log("Face detected!");
            }
        }
    }
    requestAnimationFrame(detectFace);
}

function startDecision() {
    if(aiRunning) return;
    aiRunning = true;
    detectFace();
    }





detectFace();