const fs = require('fs');
const http = require('http');
const axios = require('axios');
const {google} = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "http://localhost:" + process.env.SERVER_PORT
);

http.createServer(async (req, res) => {
    let extracting = false;
    const position = req.url.indexOf('?code=');
    const url = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: "https://www.googleapis.com/auth/photoslibrary.readonly"
    });

    if (position !== -1) {
        const code = req.url.substr(position + 6);

        try {
            const {tokens} = await oauth2Client.getToken(code);
            const photos = await getAllPhotos(tokens.access_token);

            photos.forEach(async (photo) => {
                await downloadPhoto(photo);
            });

            extracting = true;
        } catch (error) {
            console.error(error.message);
        }
    }

    res.writeHead(200,{'Content-Type': 'text/html;charset=UTF-8'});

    if (extracting) {
        res.write('Récupération des photos...');
    } else {
        res.write('<a href="' + url + '">Extraire photos</a>');
    }

    res.end();
}).listen(process.env.SERVER_PORT);

console.log("Starting server at port", process.env.SERVER_PORT);


async function getAllPhotos (accessToken) {
    const {data} = await axios({
        method: "GET",
        url: "https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100",
        headers: {
            Authorization: "Bearer " + accessToken
        }
    });

    return data.mediaItems;
}

async function downloadPhoto (photo) {
    await downloadImage(
        photo.baseUrl + '=w' + photo.mediaMetadata.width +'-h' + photo.mediaMetadata.height,
        'pictures/' + photo.filename
    );
}

// https://stackoverflow.com/questions/12740659/downloading-images-with-node-js
const downloadImage = (url, image_path) => axios({
    url: url,
    responseType: 'stream',
}).then(response => {
    response.data.pipe(fs.createWriteStream(image_path));

    return {
        status: true,
        error: '',
    };
}).catch(error => ({
    status: false,
    error: 'Error: ' + error.message,
}));