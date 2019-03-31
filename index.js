const http = require('http');
const {google} = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "http://localhost:" + process.env.SERVER_PORT
);

http.createServer((req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: "https://www.googleapis.com/auth/photoslibrary.readonly"
    });

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<a href="' + url + '"> extraire photos</a>');
    res.end();
}).listen(process.env.SERVER_PORT);