import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import cors from 'cors';
import multer from 'multer';
import btoa from 'btoa'

import { createFFmpeg } from '@ffmpeg/ffmpeg';
const ffmpegInstance = createFFmpeg({ log: true });
let ffmpegLoadingPromise = ffmpegInstance.load();

async function getFFmpeg() {
    if (ffmpegLoadingPromise) {
        await ffmpegLoadingPromise;
        ffmpegLoadingPromise = undefined;
    }

    return ffmpegInstance;
}

const app = express();
app.use(express.static('public'))
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 3000;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

app.use(cors());

app.get('/', async function (req, res) {
    
  res.sendFile(__dirname + "/public/client.html");
})

//ex1 
app.post('/thumbnail', upload.array('recfile[]'), async (req, res) => {
    console.log('/thumbnail')
    try {
        const videoData = req.file.buffer;

        const ffmpeg = await getFFmpeg();

        const inputFileName = `input-video`;
        const outputFileName = `output-image.png`;
        let outputData = null;

        ffmpeg.FS('writeFile', inputFileName, videoData);

        await ffmpeg.run(
            '-ss', '00:00:01.000',
            '-i', inputFileName,
            '-frames:v', '1',
            outputFileName
        );

        outputData = ffmpeg.FS('readFile', outputFileName);
        ffmpeg.FS('unlink', inputFileName);
        ffmpeg.FS('unlink', outputFileName);


        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment;filename=${outputFileName}`,
            'Content-Length': outputData.length
        });
        res.end(Buffer.from(outputData, 'binary'));
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

//ex2
app.post('/thumbnail2', upload.any(), async (req, res) => {

    try {
        console.log('/thumbnail2')
        console.log('/thumbnail2 req.files=', req.files)

        const videoData = req.file.buffer;

        const ffmpeg = await getFFmpeg();

        const inputFileName = `input-video`;
        const outputFileName = `output-image.png`;
        let outputData = null;

        ffmpeg.FS('writeFile', inputFileName, videoData);

        await ffmpeg.run(
            '-ss', '00:00:01.000',
            '-i', inputFileName,
            '-frames:v', '1',
            outputFileName
        );

        outputData = ffmpeg.FS('readFile', outputFileName);
        ffmpeg.FS('unlink', inputFileName);
        ffmpeg.FS('unlink', outputFileName);

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment;filename=${outputFileName}`,
            'Content-Length': outputData.length
        });

        //res.end(btoa(Buffer.from(outputData, 'binary')));
        res.end(outputData)

    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});


//ex3 render video
app.post('/render/:duration', upload.any(), async (req, res) => {
    try {
        console.log('/render req.params.duration=', req.params.duration)
        console.log('/render req.files=', req.files)

        const ffmpeg = await getFFmpeg();

        const outputFileName = `cool-output-video.mp4`;
        let outputData = null;

        var inputFileNames = []
        let audioFiles = []
        let imageFiles = []
        for (var x = 0; x < req.files.length; x++) {
            console.log(x)
            let file = req.files[x];
            let fileData = file.buffer;

            if (file.mimetype.includes('image')) {
                audioFiles.push(file)
            } else if (file.mimetype.includes('audio')) {
                imageFiles.push(file)
            }

            var inputFileName = `input-file-${x}`;
            inputFileNames.push(inputFileName)
            ffmpeg.FS('writeFile', inputFileName, fileData);
        }

        //create inputs [img needs to be first]
        let files = imageFiles.concat(audioFiles)
        console.log('img should be first:', files)
        let ffmpegInputs = []
        for (var x = 0; x < files.length; x++) {
            ffmpegInputs.push('-i')
            ffmpegInputs.push(inputFileNames[x])

        }
        await ffmpeg.run(
            '-loop', '1',
            '-framerate', '2',
            ...ffmpegInputs,
            "-c:a", "libmp3lame",
            "-b:a", "320k",
            "-filter_complex", `concat=n=${files.length - 1}:v=0:a=1`,
            "-vcodec", "libx264",
            "-bufsize", "3M",
            "-filter:v", "scale=w=1920:h=1930,pad=ceil(iw/2)*2:ceil(ih/2)*2",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-shortest", "",
            "-tune", "stillimage",
            //"-t", `${req.params.duration}`, 
            outputFileName
        );



        outputData = ffmpeg.FS('readFile', outputFileName);
        console.log('outputData=', outputData)
        ffmpeg.FS('unlink', outputFileName);

        console.log('outputData.length=', outputData.length)

        res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment;filename=${outputFileName}`,
            'Content-Length': outputData.length
        });
        //res.end(btoa(Buffer.from(outputData, 'binary')));
        //res.end(outputData)
        res.end(Buffer.from(outputData, 'binary'));

    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`[info] ffmpeg-api listening at http://localhost:${port}`)
});

