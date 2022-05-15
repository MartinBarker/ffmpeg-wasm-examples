const API_ENDPOINT_THUMBNAIL = 'http://localhost:3000/thumbnail';

const API_ENDPOINT_THUMBNAIL2 = 'http://localhost:3000/thumbnail2';

const API_ENDPOINT_VIDEO = 'http://localhost:3000/render';



const fileInput = document.querySelector('#file-input');
const fileInput2 = document.querySelector('#file-input2');
const fileInputVideo = document.querySelector('#vid-input');

const submitButton = document.querySelector('#submit');
const submitButton2 = document.querySelector('#submit2');
const renderButton = document.querySelector('#renderVid');

const thumbnailPreview = document.querySelector('#thumbnail');
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
async function renderVideo(files) {
    console.log('renderVideo() ')
    console.log('renderVideo() files=',files)
    console.log('renderVideo() files.length=',files.length)

    const payload = new FormData();
    for(var x = 0; x < files.length; x++){
        console.log(`renderVideo() file[${x}] = `, files[x])
            payload.append('file', files[x]);
    }
    console.log('renderVideo() payload=',payload)

    const res = await fetch(API_ENDPOINT_VIDEO, {
        method: 'POST',
        body: payload
    });
    console.log('renderVideo() res=',res)

    if (!res.ok) {
        throw new Error('Creating thumbnail failed');
    }

    return 'done';
}

//ex1 generate thumbnail
async function createThumbnail(video) {
    console.log('createThumbnail()')
    console.log('createThumbnail() video=',video)
    const payload = new FormData();
    payload.append('video', video);
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
    payload.append('video', files[0]);
    payload.append('image', files[1]);
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

//video button clicked
renderButton.addEventListener('click', async () => {
    console.log('renderButton clicked')
    const { files } = fileInputVideo;
    console.log('renderButton, files=',files)
    
    if (files.length > 0) {
        //const file = files[0];
        try {
            const renderResult = await renderVideo(files);
            console.log(renderResult)
            thumbnailPreview.innerHTML = renderResult
            
        } catch(error) {
            showError(error);
        }
    } else {
        showError('Please select a file');
    }
})

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