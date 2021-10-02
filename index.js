
const express = require("express");
const ffmpeg = require("fluent-ffmpeg");

const bodyParser = require("body-parser");

const fs = require("fs");

const fileUpload = require("express-fileupload");

const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.io = io;

const PORT = process.env.PORT || 5000

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());


app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);


// ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg");

// ffmpeg.setFfprobePath("/usr/local/bin/ffprobe");

// ffmpeg.setFlvtoolPath("/usr/local/flvtool");


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

let globalFile;


app.post("/convert", (req, res) => {
  let to = req.body.to;
  let file = req.files.file;
  globalFile = file.name;

console.log(file.name);
  file.mv("tmp/" + file.name, function (err) {
    if (err) return res.sendStatus(500).send(err);
    console.log("File Uploaded successfully", file.name);
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/html");
    res.send("File Uploaded successfully");
      });

});

app.post('/test', (req, res) => {

  let to = req.body.to;
  let fileNameMp4 = `outputMp4.${to}`;
  let fileNameLibx264 = `outputLibx264.${to}`;
  let fileNameVp9 = `outputVp9.${to}`;
  let fileNameAv1 = `outputAv1.${to}`;
  let param = req.body.param;
  let preset = param === "encoding" ? "ultrafast" : "veryslow";

  let bitrate = req.body.bitrate;
  let resolution = `?x${req.body.resolution}`;
  let fps = req.body.fps;
  var result = ffmpeg("tmp/" + globalFile)
    .withFpsInput(fps)
    .videoBitrate(bitrate, true)
    .size(resolution)
    .withFps(fps)
    .format(to)
    .videoCodec('libx265')
    .outputOptions([ `-preset ${preset}`, '-crf 22', `-b ${bitrate}k`, `-minrate ${bitrate}k`, `-maxrate ${bitrate}k` ])
    .on('progress', function(progress) {
        req.app.io.emit('progress', { progress: progress.percent, frames: progress.frames,
                                     currentFps: progress.currentFps, currentKbps: progress.currentKbps, 
                                      targetSize: progress.targetSize }); 

      })
    .on('codecData', function(data) {
      })
    .on("end", function (err, stdout, stderr) {

        ffmpeg.ffprobe(__dirname  + '/output/' + fileNameMp4, function(err, metadata) {
            req.app.io.emit('metadataMp4', 
              { profile: metadata.streams[0].profile,
                duration: metadata.streams[0].duration,
                bit_rate: metadata.streams[0].bit_rate,
                size: metadata.format.size,
                level: metadata.streams[0].level,
                avg_frame_rate: metadata.streams[0].avg_frame_rate,
              });
        });

          ffmpeg("output/outputMp4.mp4")
          .outputOptions(['-psnr'])
          .on("end", function (err, stdout, stderr) {
      
              var regex = /PSNR Mean Y:([0-9\.]+) U:([0-9\.]+) V:([0-9\.]+) Avg:([0-9\.]+)/
              var psnr = stdout.match(regex);
              req.app.io.emit('psnrMp4', 
              { 
                psnr: psnr[4]
              });
      
          }).saveToFile(__dirname  + '/output/trash.mp4');

    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + globalFile, function (err) {
        if (err) {
          throw err;
        }
        console.log("File deleted");
        return res.sendStatus(500).send(err);
      });
    })
    .saveToFile(__dirname  + '/output/' + fileNameMp4) 


 var result = ffmpeg("tmp/" + globalFile)
    .videoBitrate(bitrate)
    .size(resolution)
    .inputFPS(fps)
    .fps(fps)
    .format(to)
    .videoCodec('libx264')
    .outputOptions([`-preset ${preset}`, '-crf 22', `-b ${bitrate}k`, `-minrate ${bitrate}k`, `-maxrate ${bitrate}k` ])
    .on('progress', function(progress) {
          req.app.io.emit('progress2', { progress: progress.percent, frames: progress.frames,
                                        currentFps: progress.currentFps, currentKbps: progress.currentKbps, 
                                        targetSize: progress.targetSize }); 
      })
    .on('codecData', function(data) {
      })

    .on("end", function (err, stdout, stderr) {

        ffmpeg.ffprobe(__dirname  + '/output/' + fileNameLibx264, function(err, metadata) {
            req.app.io.emit('metadataLibx264', 
            { profile: metadata.streams[0].profile,
              duration: metadata.streams[0].duration,
              bit_rate: metadata.streams[0].bit_rate,
              size: metadata.format.size,
              level: metadata.streams[0].level,
              avg_frame_rate: metadata.streams[0].avg_frame_rate,
            });
        });
        ffmpeg("output/outputLibx264.mp4")
        .outputOptions(['-psnr'])
        .on("end", function (err, stdout, stderr) {
    
            var regex = /PSNR Mean Y:([0-9\.]+) U:([0-9\.]+) V:([0-9\.]+) Avg:([0-9\.]+)/
            var psnr = stdout.match(regex);
            req.app.io.emit('psnrLibx264', 
            { 
              psnr: psnr[4]
            });

      }).saveToFile(__dirname  +'/output/trash2.mp4')
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + globalFile, function (err) {
        if (err) throw err;
      });
    })
    .saveToFile(__dirname  + '/output/' + fileNameLibx264)

    var result = ffmpeg("tmp/" + globalFile)
    .videoBitrate(bitrate)
    .size(resolution)
    .fps(fps)
    .format(to)
    .videoCodec('libvpx-vp9')
    .outputOptions([`-preset ${preset}`, '-crf 22', `-b ${bitrate}k`, `-minrate ${bitrate}k`, `-maxrate ${bitrate}k` ])
    .on('progress', function(progress) {
          req.app.io.emit('progress3', { progress: progress.percent, frames: progress.frames,
                                        currentFps: progress.currentFps, currentKbps: progress.currentKbps, 
                                        targetSize: progress.targetSize }); // This will emit the event to all connected sockets
      })
    .on('codecData', function(data) {

      })

    .on("end", function (err, stdout, stderr) {

        ffmpeg.ffprobe(__dirname  + '/output/' + fileNameVp9, function(err, metadata) {

            req.app.io.emit('metadataVp9', 
            { profile: metadata.streams[0].profile,
              duration: metadata.streams[0].duration,
              bit_rate: metadata.streams[0].bit_rate,
              size: metadata.format.size,
              level: metadata.streams[0].level,
              avg_frame_rate: metadata.streams[0].avg_frame_rate,
            });
        });

        ffmpeg("output/outputVp9.mp4")
        .outputOptions(['-psnr'])
        .on("end", function (err, stdout, stderr) {
    
            var regex = /PSNR Mean Y:([0-9\.]+) U:([0-9\.]+) V:([0-9\.]+) Avg:([0-9\.]+)/
            var psnr = stdout.match(regex);
            req.app.io.emit('psnrVp9', 
            { 
              psnr: psnr[4]
            });
      }).saveToFile(__dirname  + '/output/trash3.mp4' )
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + globalFile, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .saveToFile(__dirname  + '/output/' + fileNameVp9);


    var result = ffmpeg("tmp/" + globalFile)
    .videoBitrate(bitrate)
    .size(resolution)
    .inputFPS(fps)
    .fps(fps)
    .format(to)
    .videoCodec('libaom-av1')
    .outputOptions([`-preset ${preset}`, '-crf 22', `-b ${bitrate}k`, `-minrate ${bitrate}k`, `-maxrate ${bitrate}k` ])
    .on('progress', function(progress) {
          req.app.io.emit('progress4', { progress: progress.percent, frames: progress.frames,
                                        currentFps: progress.currentFps, currentKbps: progress.currentKbps, 
                                        targetSize: progress.targetSize }); 
      })
    .on('codecData', function(data) {
      })
    .on("end", function (err, stdout, stderr) {

        ffmpeg.ffprobe(__dirname  + '/output/' + fileNameAv1, function(err, metadata) {

            req.app.io.emit('metadataAv1', 
            { profile: metadata.streams[0].profile,
              duration: metadata.streams[0].duration,
              bit_rate: metadata.streams[0].bit_rate,
              size: metadata.format.size,
              level: metadata.streams[0].level,
              avg_frame_rate: metadata.streams[0].avg_frame_rate,
            });
        });

        ffmpeg("output/outputAv1.mp4")
        .outputOptions(['-psnr'])
        .on("end", function (err, stdout, stderr) {
    
            var regex = /PSNR Mean Y:([0-9\.]+) U:([0-9\.]+) V:([0-9\.]+) Avg:([0-9\.]+)/
            var psnr = stdout.match(regex);
            req.app.io.emit('psnrAv1', 
            { 
              psnr: psnr[4]
            });

      }).saveToFile(__dirname  +'/output/trash4.mp4')
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + globalFile, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .saveToFile(__dirname  + '/output/' + fileNameAv1)

  
  
})

app.get('/download', function(req, res){
  const fileName = req.query.fileName;
  const file = __dirname  + '/output/' + fileName;
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/html");
  res.download(file);
});

server.listen(PORT, () => {
  console.log('listening on *:5000');
});