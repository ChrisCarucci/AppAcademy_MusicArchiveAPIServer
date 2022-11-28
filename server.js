const http = require('http');
const fs = require('fs');
const { url } = require('inspector');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    res.setHeader("Content-Type", "application/json");
    let deleteMessage = {"message": "Successfully deleted"}

    // GET /
    if (req.method === "GET" && req.url === "/") {
      res.statusCode = 200;
      return res.end("This is the Home Page");
    }

    // GET /artists
    if (req.method === "GET" && req.url === "/artists") {
      res.statusCode = 200;
      return res.end(JSON.stringify(artists));
    };

    // GET - /artists/:artistId
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      if (req.url.split("/").length === 3) {
        const artistId = req.url.split("/")[2];

        req.statusCode = 200;
        return res.end(JSON.stringify(artists[artistId]));
      }
    }

    // POST - /artists
    if (req.method === "POST" && req.url === "/artists") {
      const newArtist = {
        artistId: getNewArtistId(),
        ...req.body
      };
      artists[newArtist.artistId] = newArtist;

      res.statusCode = 201;
      return res.end(JSON.stringify(artists));
    }

    // Edit Artist POST

    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');  //  ["", "artists", "1"]
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        let requestedArtist = artists[requestedId];
        requestedArtist.name = req.body.name;
        requestedArtist.updatedAt = new Date();
        res.statusCode = 200;
        res.write(JSON.stringify(requestedArtist));
        return res.end();
      }
    }

    // DELETE Artist by ID

    if (req.method === 'DELETE' && req.url.split("/").length === 3) {
      const artistID = req.url.split("/")[2];

      delete artists[artistID];
      res.statusCode = 200;
      return res.end(JSON.stringify(deleteMessage))

    }

    // 5) GET - /artists/:artistId/albums
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 4 && urlParts[3] === "albums") {
        const artistId = urlParts[2];
        let albumList = {};
        for (const album in albums) {
          if (albums[album].artistId == artistId) {
            albumList[album] = albums[album];
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(albumList));
      }
    }
    
    // GET  -->  Get a specific album's details based on albumId

    if (req.method === "GET" && req.url.startsWith("/albums") && req.url.split('/').length === 3) {
      const albumId = req.url.split('/')[2]
      res.statusCode = 200;
      return res.end(JSON.stringify(albums[albumId]))
    }

    // PUT ---> Add an album to a specific artist based on artistId

    if (req.method === "POST" || req.method === "PATCH" && req.url.startsWith("/albums")) {
      let albumId = req.url.split("/")[2];
      for (const [key, value] of Object.entries(req.body)) {
        albums[albumId][key] = key
      }
      res.statusCode = 201;
      return res.end(JSON.stringify(albums[albumId]))
    }

    // DELETE = delete album by ID

    if (req.method === "DELETE" && req.url.startsWith("/albums") && req.url.split("/").length === 3) {
      let albumId = req.url.split('/')[2]
      delete albums[albumId]
      res.statusCode =  200;
      return res.end(JSON.stringify(deleteMessage))
    }

    // GET --> Get /artists/:artistId/songs

    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlParts = req.url.split("/");
      const artistId = urlParts[3];
      let songsList = {};

      for (const song in songs) {
        let albumId = songs[song].albumId;
        if (albums[albumId].artistId = artistId) {
          songsList[song] = songs[song];
        }
      }

      res.statusCode = 200;
      return res.end(JSON.stringify(songsList))

    }

    // GET --> Get all songs of a specific album based on albumId /albums/albumid/songs

    if (req.method === "GET" && req.url.startsWith("/albums")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const albumId = urlParts[2]
        let songList = {};

        for (const song in songs) {
          if (songs[song].albumId = albumId) {
            songList[song] = songs[song]
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(songList))
      }
    }

    // GET -> Get all songs of a specified trackNumber -> /trackNumbers/:trackNumber/songs

    if (req.method === "GET" && req.url.startsWith("/trackNumber")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const trackNumber = urlParts[2];
        let songsList = {};
        for (const song in songs) {
          if (songs[song].trackNumber == trackNumber) {
            songsList[song] = songs[song];
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(songsList));
      }
    }

    // GET -> Get a specific song's details based on songId -> /songs/songId

    if (req.method === "GET" && req.url.startsWith("/songs") && req.url.split("/").length === 3) {
      const songId = req.url.split("/")[2];

      res.statusCode = 200;
      return res.end(JSON.stringify(songs[songId]))
    }

    // PUT -> Add a song to a specific album based on albumId -> /albums/:albumId/songs

    if (req.method === "POST" && req.url.startsWith("/albums") && req.url.split("/").length === 4) {
      const albumId = req.url.split("/")[2];
      const song = {
        songId: getNewSongId(),
        ...req.body,
        albumId: albumId
      };
      songs[song.songId] = song;
      let songsList = {};
      for (const song in songs) {
        if (songs[song].albumId == albumId) {
          songsList[song] = songs[song];
        }
      }
      res.statusCode = 201;
      return res.end(JSON.stringify(songsList));
    }

    // PUT or PATCH song by songId -> /songs/:songId
    if (req.method === "PUT" || req.method === "PATCH" && req.url.startsWith("/songs") && req.url.split("/").length === 3) {
      const songId = req.url.split("/")[2];
      for (const [key, value] of Object.entries(req.body)) {
        songs[songId][key] = value;
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(songs[songId]));
    }

    //  DELETE sog by songId -> /songs/:songId
    if (req.method === "DELETE" && req.url.startsWith("/songs") && req.url.split("/").length === 3) {
      const songId = req.url.split("/")[2];
      songs[songId] = undefined;

      res.statusCode = 200;
      return res.end(JSON.stringify({ "message": "Successfully deleted" }))
    }

  

    


    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));