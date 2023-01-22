let port = 3000;
const API_ENDPOINT_THUMBNAIL = `http://localhost:${port}/thumbnail`;
const API_ENDPOINT_THUMBNAIL2 = `http://localhost:${port}/thumbnail2`;
const API_ENDPOINT_VIDEO = `http://localhost:${port}/render`;

const filesInput = document.querySelector('#filesInput');
const splitBySilenceButton = document.querySelector("#splitBySilence");
splitBySilenceButton.addEventListener('click', async () => {
    var { files } = filesInput;
    console.log('splitBySilenceButton clicked, files=', files)
    if (files.length > 0) {
        try {
            const renderResult = await splitAudioBySilence(files[0]);
        } catch (error) {
            showError(error);
        }
    }
})

const renderButton = document.querySelector('#renderVid');
const mp4source = document.querySelector('#mp4source')
const errorDiv = document.querySelector('#error');

function showError(msg) {
    errorDiv.innerText = `ERROR: ${msg}`;
}

async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.onabort = () => reject(new Error("Read aborted"));
        reader.readAsDataURL(blob);
    });
}

async function splitAudioBySilence(file){
    console.log('splitAudioBySilence()')

    //add files to payload
    const payload = new FormData();
    for (var x = 0; x < files.length; x++) {
        payload.append('files', files[x]);
    }

    //make request to splitBySilence server-side route 
    const resp = await fetch(`/splitBySilence`, {
        method: 'POST',
        body: payload
    });
    console.log('splitAudioBySilence() resp=', resp)

    if (!resp.ok) {
        throw new Error('splitAudioBySilence failed');
    }
    return 'done?';
}

async function renderVideo(files, totalDuration) {
    console.log('renderVideo() totalDuration=', totalDuration)
    console.log(`renderVideo() ${files.length} files=`, files)

    const payload = new FormData();
    for (var x = 0; x < files.length; x++) {
        //console.log(`renderVideo() file[${x}] = `, files[x])
        payload.append('files', files[x]);
    }
    console.log('renderVideo() payload=', payload)

    //const res = await fetch( `${API_ENDPOINT_VIDEO}/${Math.ceil(totalDuration)}`, {
    const res = await fetch(`/render/${Math.ceil(totalDuration)}`, {
        method: 'POST',
        body: payload
    });
    console.log('renderVideo() res=', res)

    if (!res.ok) {
        throw new Error('Creating thumbnail failed');
    }

    const thumbnailBlob = await res.blob();
    const thumbnail = await blobToDataURL(thumbnailBlob);

    return thumbnail;
}

//ex1 generate thumbnail
async function createThumbnail(video) {
    console.log('createThumbnail()')
    console.log('createThumbnail() video=', video)
    const payload = new FormData();
    payload.append('file', video);
    console.log('createThumbnail() payload=', payload)

    const res = await fetch(API_ENDPOINT_THUMBNAIL, {
        method: 'POST',
        body: payload
    });

    if (!res.ok) {
        throw new Error('Creating thumbnail failed');
    }

    const thumbnailBlob = await res.blob();
    const thumbnail = await blobToDataURL(thumbnailBlob);

    return thumbnail;
}

//ex2 generate thumbnail
async function createThumbnail2(files) {
    console.log('createThumbnail2()')
    console.log('createThumbnail2() files=', files)
    const payload = new FormData();
    payload.append('recfile', files[0]);
    payload.append('recfile', files[1]);
    console.log('createThumbnail2() payload=', payload)

    const res = await fetch(API_ENDPOINT_THUMBNAIL2, {
        method: 'POST',
        body: payload
    });

    if (!res.ok) {
        throw new Error('Creating thumbnail failed');
    }

    const thumbnailBlob = await res.blob();
    const thumbnail = await blobToDataURL(thumbnailBlob);

    return thumbnail;
}

async function moveImgFirstFile(files) {
    return new Promise(async function (resolve, reject) {
        let imageFiles = []
        let audioFiles = []
        for (var x = 0; x < files.length; x++) {
            let fileType = files[x].type;
            if (fileType.includes('audio/')) {
                audioFiles.push(files[x])
            } else if (fileType.includes('image/')) {
                imageFiles.push(files[x])
            }
        }
        console.log('moveImgFirstFile() img=', imageFiles, ', audio=', audioFiles)
        let combinedFiles = imageFiles;
        combinedFiles = combinedFiles.concat(audioFiles)
        console.log('combinedFiles=', combinedFiles)
        resolve(combinedFiles)
    })
}

//ex3 video button clicked
renderButton.addEventListener('click', async () => {
    console.log('renderButton clicked!')
    var { files } = fileInputVideo;
    files = await moveImgFirstFile(files)
    console.log('renderButton, files=', files)

    if (files.length > 0) {
        //const file = files[0];
        try {
            let totalDuration = 0
            console.log('get durations')
            for (var x = 0; x < files.length; x++) {
                let file = files[x]
                let duration = await getLength(file)
                console.log(`file ${x} duration = `, duration)
                //console.log('totalDuration = ', totalDuration)
                totalDuration = totalDuration + duration;
            }
            console.log('call renderVideo()')
            const renderResult = await renderVideo(files, totalDuration);
            //console.log('renderVideo() finished. renderResult=',renderResult)
            mp4source.src = renderResult
            //mp4source.src = `data:video/webm;base64,${String(renderResult)}`;

        } catch (error) {
            showError(error);
        }
    } else {
        showError('Please select a file');
    }
})

//get length of audio file
async function getLength(file) {
    return new Promise(async function (resolve, reject) {
        //console.log('getLength file=', file)
        try {
            const mediainfo = await new Promise((res) => MediaInfo(null, res));
            const getSize = () => file.size;
            const readChunk = async (chunkSize, offset) => new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer());

            const info = await mediainfo.analyzeData(getSize, readChunk);
            // assumes we are only interested in audio duration
            const audio_track = info.media.track.find((track) => track["@type"] === "Audio");
            let duration = parseFloat(audio_track.Duration);
            resolve(duration);
        } catch (err) {
            console.log('err getting file length = ', err);
            resolve(0)
        }
    });
}