const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const glob = require('glob');
const fs = require('fs');

function findLastIndex(array, predicate, fromWhere = Number.MAX_SAFE_INTEGER) {
  let l = Math.min(array.length, fromWhere);
  while (l--) {
    if (predicate(array[l], l, array))
      return l;
  }
  return -1;
}

const connect = async () => {
  const db = await open({
    filename: './database.db',
    driver: sqlite3.Database,
  });

  return db;
}

const createTable = async () => {
  const db = await connect();

  await db.exec(`CREATE TABLE IF NOT EXISTS albums (
    album_id INTEGER PRIMARY KEY,
    album_name TEXT NOT NULL,
    year TEXT
  )`);

  await db.exec(`CREATE TABLE IF NOT EXISTS songs (
    song_id INTEGER PRIMARY KEY,
    album_id INTEGER NOT NULL,
    song_name TEXT NOT NULL
  )`);

  await db.exec(`CREATE TABLE IF NOT EXISTS lyrics (
    lyric_id INTEGER PRIMARY KEY,
    song_id INTEGER NOT NULL,
    lyric TEXT NOT NULL
  )`);
}

const exec = async () => {
  const db = await connect();

  /**
   * insert one song of a album into sql
   * @param {number} albumId
   * @param {string} songPath 
   */
  const insertSong = async (albumId, songPath) => {
    const songName = songPath.split('/').pop().split('.').shift();
    if (songName === '(提供)') {
      return;
    }

    const songRes = await db.run(
      `INSERT INTO songs (album_id, song_name) VALUES (?, ?)`,
      albumId, songName
    );

    const lyrics = fs.readFileSync(songPath).toString();

    const lyricOgLines = lyrics.split(/\n+/);
    const artistLineIdx = findLastIndex(
      lyricOgLines,
      line =>
        ['作词：', '作曲：', '编曲：', '监制：', '主唱：', 'Text：', '和声：']
          .some(prefix => line.startsWith(prefix)),
      20
    );
    const titleLineIdx = lyricOgLines.findIndex(line => line === songName);
    const startLineIdx = Math.max(artistLineIdx, titleLineIdx) + 1;

    const lyricLines = lyricOgLines.splice(startLineIdx)
      .map(line => line.replace(/[\*\(\)【】＃＊△★#＠@^　#＊]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(line => {
        if (!line) {
          return false;
        }
        if (/^\[/.test(line) || /^-{2,}/.test(line)) {
          return false;
        }
        if (/^[<(]*[rR]ap[>)]*\s*:*$/.test(line)) {
          return false;
        }
        if (/感谢.+歌词/.test(line) || /友站连结/.test(line)) {
          return false;
        }
        if (/^rea*pea*t/.test(line.toLowerCase())) {
          return false;
        }
        if (line.includes('Mojim.com')) {
          return false;
        }

        return true;
      });

    if (!lyricLines.length) {
      console.warn(`${songName} has no invalid lyrics`);
      return;
    }

    const placeholder = lyricLines.map(_l => `(?, ?)`).join(',');
    const values = lyricLines.map(_l => ([songRes.lastID, _l])).flat();
    const lyricsRes = await db.run(`INSERT INTO lyrics (song_id, lyric) VALUES ${placeholder}`, values);

    console.log(`${songName} inserts ${lyricsRes.changes}`);
  }

  /**
   * insert one album into sql
   * @param {string} albumPath 
   * @param {string} albumFolderName 
   */
  const insertAlbum = async (albumPath, albumFolderName) => {
    const [year, albumName] = albumFolderName.split('_');
    const albumRes = await db.run(
      `INSERT INTO albums (album_name, year) VALUES (?, ?)`,
      year, albumName);

    if (!albumRes) {
      return;
    }

    const songFiles = glob.sync(`${albumPath}/*.txt`);
    songFiles.forEach(async (songFile) => {
      await insertSong(albumRes.lastID, songFile);
    });
  }

  const insertAlbums = async () => {
    const albumRootDir = './lyrics/';
    const albums = fs.readdirSync(albumRootDir);
    albums.slice(0).forEach(async (album) => {
      await insertAlbum(`${albumRootDir}${album}`, album);
    });
  }

  await insertAlbums();
}

/**
 * remove album and all its song and lyrics
 * @param {number} albumId 
 */
const removeAlbum = async (albumId) => {
  const db = await connect();

  const delLyricsRes = await db.run(
    `DELETE FROM lyrics 
    WHERE song_id IN (
      SELECT song_id FROM songs WHERE album_id = ?
    )`,
    albumId
  );

  const delSongsRes = await db.run(
    `DELETE FROM songs
    WHERE album_id = ?`,
    albumId
  );

  const delAlbumRes = await db.run(
    `DELETE FROM albums WHERE album_id = ?`,
    albumId
  );

  console.log('result: ', {
    delLyricsRes,
    delSongsRes,
    delAlbumRes,
  });
  // debugger;
}

createTable()
  .then(() => {
    exec();
  })
// removeAlbum(1);

