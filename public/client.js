let port = 3000;
const API_ENDPOINT_THUMBNAIL = `http://localhost:${port}/thumbnail`;

const API_ENDPOINT_THUMBNAIL2 = `http://localhost:${port}/thumbnail2`;

const API_ENDPOINT_VIDEO = `http://localhost:${port}/render`;



//const fileInput = document.querySelector('#file-input');
//const fileInput2 = document.querySelector('#file-input2');
const fileInputVideo = document.querySelector('#vid-input');

//const submitButton = document.querySelector('#submit');
//const submitButton2 = document.querySelector('#submit2');
const renderButton = document.querySelector('#renderVid');

//const thumbnailPreview = document.querySelector('#thumbnail');
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


//render video
async function renderVideo(files, totalDuration) {
    console.log('renderVideo() totalDuration=',totalDuration)
    console.log(`renderVideo() ${files.length} files=`,files)

    const payload = new FormData();
    for(var x = 0; x < files.length; x++){
        //console.log(`renderVideo() file[${x}] = `, files[x])
        payload.append('files', files[x]);
    }
    console.log('renderVideo() payload=',payload)

    //const res = await fetch( `${API_ENDPOINT_VIDEO}/${Math.ceil(totalDuration)}`, {
    const res = await fetch( `/render/${Math.ceil(totalDuration)}`, {
        method: 'POST',
        body: payload
    });
    console.log('renderVideo() res=',res)

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
    console.log('createThumbnail() video=',video)
    const payload = new FormData();
    payload.append('file', video);
    console.log('createThumbnail() payload=',payload)

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
    console.log('createThumbnail2() files=',files)
    const payload = new FormData();
    payload.append('recfile', files[0]);
    payload.append('recfile', files[1]);
    console.log('createThumbnail2() payload=',payload)

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

async function moveImgFirstFile(files){
    return new Promise(async function (resolve, reject) {
        let imageFiles = []
        let audioFiles = []
        for(var x = 0; x < files.length; x++){
            let fileType = files[x].type;
            if(fileType.includes('audio/')){
                audioFiles.push(files[x])
            }else if(fileType.includes('image/')){
                imageFiles.push(files[x])
            }
        }
        console.log('moveImgFirstFile() img=',imageFiles,', audio=',audioFiles)
        let combinedFiles = imageFiles;
        combinedFiles=combinedFiles.concat(audioFiles)
        console.log('combinedFiles=',combinedFiles)
        resolve(combinedFiles)
    })
}

//ex3 video button clicked
renderButton.addEventListener('click', async () => {
    console.log('renderButton clicked!')
    var { files } = fileInputVideo;
    files = await moveImgFirstFile(files)
    console.log('renderButton, files=',files)
    
    if (files.length > 0) {
        //const file = files[0];
        try {
            let totalDuration = 0
            console.log('get durations')
            for(var x = 0; x < files.length; x++){
                let file = files[x]
                let duration = await getLength(file)
                console.log(`file ${x} duration = `, duration)
                //console.log('totalDuration = ', totalDuration)
                totalDuration=totalDuration+duration;
            }
            console.log('call renderVideo()')
            const renderResult = await renderVideo(files, totalDuration);
            //console.log('renderVideo() finished. renderResult=',renderResult)
            mp4source.src = renderResult
            //mp4source.src = `data:video/webm;base64,${String(renderResult)}`;
            
        } catch(error) {
            showError(error);
        }
    } else {
        showError('Please select a file');
    }
})

/*
//ex1 thumbnail button clicked
submitButton.addEventListener('click', async () => {
    const { files } = fileInput;
    console.log('submitButton, files=',files)
    if (files.length > 0) {
        const file = files[0];
        try {
            const thumbnail = await createThumbnail(file);
            thumbnailPreview.src = thumbnail;
        } catch(error) {
            showError(error);
        }
    } else {
        showError('Please select a file');
    }
});

//ex2 thumbnail button clicked
submitButton2.addEventListener('click', async () => {
    const { files } = fileInput2;
    console.log('submitButton2, files=',files)
    if (files.length > 0) {
        //const file = files[0];
        try {
            console.log('submitButton2, calling createThumbnail2')
            const thumbnail = await createThumbnail2(files);
            thumbnailPreview.src = thumbnail;
        } catch(error) {
            showError(error);
        }
    } else {
        showError('Please select a file');
    }
});
*/

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