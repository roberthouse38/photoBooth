//installan library
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

//konek ke database.js
const db = require("./database");


const app = express();

//Middleware 1 "auth & routing"
app.use(cors());
//Middleware 2 "json req into object JS server"
app.use(express.json());
app.use("/uploads", express.static(uploadDir)); 

//Middleware 3 (Multer) "data related 4 reading, saving, renaming, req.file creating" 
const storage = multer.diskStorage({
    
    destination: (req, file, cb) => { 
        cb(null, uploadDir);
    },
    
    filename: (req, file, cb) => {
        cb(null, Date.now() + ".png");
    }
});

const uploads = multer({storage});



//ROOT
app.get("/", (req, res) => {
    res.send("Photobooth API by L&C is running baby!");
});

//GET ALL Photo
app.get("/photos", (req, res) => {
    
    db.all(
        `SELECT * FROM photos
        ORDER BY created_at DESC
        `,
        [],
        (err, rows) => {
        if(err){
            console.log(err.message);
            return res.status(500).json({
                error: "Failed to Fetch Photo Data"
            });
        }
            res.json(rows);
        }
    );
});

//Route Handling "(req,res) => {}"
app.post("/upload", uploads.single("photo"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "A photo file is required" });
    }

    const body = { ...req.body };

    console.log(body);

    console.log(req.file);

    const filename = req.file.filename;
    const filter = body.filter;
    const layout = body.layout;

        db.run(`
        INSERT INTO photos(filename, filter, layout)
        VALUES(?,?,?)
        `,
        [filename,filter,layout],
        function(err){
            if (err) {
                console.error(err.message);
                return res.status(500).json({error: "Database Error"});
            }        

            res.json({
                message: "Upload Success",
                id: this.lastID,
                filename
            });
        });
});

app.post("/photos", (req, res) => {
    const newPhoto = req.body;  //dirubah ke object JS biasaa

    console.log("Foto Baru: ");
    console.log(newPhoto);

    res.json({
        message: "foto ditambahkan",
        data: newPhoto
    });


});


app.listen(3000, () => {
    console.log("Server Running on Port 3000!");
});