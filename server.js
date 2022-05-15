import express from 'express';
import cors from 'cors';
import multer from 'multer';

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
const port = 3000;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

app.use(cors());



//ex1 
app.post('/thumbnail', upload.single('video'), async (req, res) => {
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
app.post('/thumbnail2', upload.array('files'), async (req, res) => {
    
    try {
        console.log('/thumbnail2')
        console.log('/thumbnail2 req.file=',req.file)
        console.log('/thumbnail2 req.file.buffer=',req.file.buffer)

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


//ex3 render video
app.post('/render', upload.array('file'), async (req, res) => {
    try {
        console.log('/render')
        console.log('/render req.file=',req.file)
        console.log('/render req.file.buffer=',req.file.buffer)

        //const videoData = req.file.buffer;

        const ffmpeg = await getFFmpeg();

        const inputFileName = `input-video`;
        const outputFileName = `output-image.png`;
        let outputData = '';
        
        
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
        

        res.end(outputData);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`[info] ffmpeg-api listening at http://localhost:${port}`)
});