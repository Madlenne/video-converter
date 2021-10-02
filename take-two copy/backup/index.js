const express = require("express");
const ffmpeg = require("fluent-ffmpeg");

const bodyParser = require("body-parser");

const fs = require("fs");

const fileUpload = require("express-fileupload");

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.io = io;

const PORT = process.env.PORT || 5000

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);


ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg");

ffmpeg.setFfprobePath("/usr/local/bin/ffprobe");

ffmpeg.setFlvtoolPath("/usr/local/flvtool");

console.log(ffmpeg, PORT);

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

  console.log('FILEEE', file);
  let withCodec = req.body.with;
  let fileName = `output.${to}`;
  console.log('aaaa', to);
  console.log('bbbb ', file.name);

  file.mv("tmp/" + file.name, function (err) {
    if (err) return res.sendStatus(500).send(err);
    console.log("File Uploaded successfully", file.name);
    res.redirect('/');
  });
  console.log('aaa', req.body);


  // var result = ffmpeg("tmp/" + file.name)
  //   .format(to)
  //   .videoCodec('mpeg4')
  //   .outputOptions(['-preset veryslow', '-crf 22'])
  //   .on('progress', function(progress) {
  //       console.log('Processing: ' + progress.percent + '% done');
  //       req.app.io.on('connection', (socket) => {
  //         req.app.io.emit('progress', { progress: progress.percent }); // This will emit the event to all connected sockets
  //           // io.emit('progress', 'aaaaaa');
  //           // res.render('index');
  //       });
  //     })
  //   .on('codecData', function(data) {
  //       console.log('Video details ' + data.video_details);
  //       console.log('Video format  ' + data.format);
  //       console.log('Video codec ' + data.video);
  //       console.log('WRRRR  ' + file.name);
  //     })

  //   .on("end", function (stdout, stderr) {
  //     console.log("Finished", stdout);

  //       // ffmpeg.ffprobe(__dirname  + '/output/' + fileName, function(err, metadata) {
  //       //     console.log("HALO2", fileName, metadata, '$$$$'); // all metadata
  //       // });

  //       // res.redirect('/');

  //   })
  //   .on("error", function (err) {
  //     console.log("an error happened: " + err.message);
  //     fs.unlink("tmp/" + file.name, function (err) {
  //       if (err) throw err;
  //       console.log("File deleted");
  //     });
  //   })
  //   .saveToFile(__dirname  + '/output/' + fileName)


//     const fileName2 = `output2.${to}`;

//     var result2 = ffmpeg("tmp/" + file.name)
//     .format(to)
//     .videoCodec('libx264')
//     .outputOptions(['-preset veryslow', '-crf 22'])
//     .on('progress', function(progress) {
//         console.log('Processing: ' + progress.percent + '% done');
//       })
//     .on('codecData', function(data) {
//         console.log('Video details ' + data.video_details);
//         console.log('Video format  ' + data.format);
//         console.log('Video codec ' + data.video);
//         console.log('WRRRR  ' + file.name);
//       })

//     .on("end", function (stdout, stderr) {
//       console.log("Finished", stdout);

//         ffmpeg.ffprobe(__dirname  + '/output/' + fileName2, function(err, metadata) {
//             console.log("HALO2", fileName2, metadata, '$$$$'); // all metadata
//         });

//     })
//     .on("error", function (err) {
//       console.log("an error happened: " + err.message);
//       fs.unlink("tmp/" + file.name, function (err) {
//         if (err) throw err;
//         console.log("File deleted");
//       });
//     })
//     .saveToFile(__dirname  + '/output/' + fileName2)

});

app.post('/test', (req, res) => {
  console.log('aaa', req.body, globalFile);
  let fileName = `output.mp4`;

  var result = ffmpeg("tmp/" + globalFile)
    .format('mp4')
    .videoCodec('mpeg4')
    .outputOptions(['-preset veryslow', '-crf 22'])
    .on('progress', function(progress) {
        console.log('Processing: ' + progress.percent + '% done');
        // req.app.io.on('connection', (socket) => {
          req.app.io.emit('progress', { progress: progress.percent }); // This will emit the event to all connected sockets
            // io.emit('progress', 'aaaaaa');
            // res.render('index');
        // });
      })
    .on('codecData', function(data) {
        console.log('Video details ' + data.video_details);
        console.log('Video format  ' + data.format);
        console.log('Video codec ' + data.video);
        // console.log('WRRRR  ' + file.name);
      })

    .on("end", function (stdout, stderr) {
      console.log("Finished", stdout);

        // ffmpeg.ffprobe(__dirname  + '/output/' + fileName, function(err, metadata) {
        //     console.log("HALO2", fileName, metadata, '$$$$'); // all metadata
        // });
        res.send('OK');
        // res.redirect('/');

    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .saveToFile(__dirname  + '/output/' + fileName)

})

server.listen(PORT, () => {
  console.log('listening on *:5000');
});


