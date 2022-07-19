const puppeteer = require('puppeteer');
const fs = require('fs');
const { PromisePool } = require('@supercharge/promise-pool');

const albums = require('./albums2.json');

const getLyrics = async () => {
  const browser = await puppeteer.launch();

  const fetchLyric = async (oneSong) => {
    const { songUrl: songUriPath, songName } = oneSong;
    const page = await browser.newPage();
    const songUrl = `https://mojim.com/${songUriPath}`;

    try {
      await page.goto(songUrl);
      await page.waitForSelector('#fsZx1');
    } catch (error) {
      console.warn(`${songName} @ ${songUrl} 等待超时`);
      return '';
    }

    const lyrics = await page.evaluate(() => {
      return document.querySelector('#fsZx1').innerText;
    });

    if (!lyrics) {
      console.warn(`${songName} @ ${songUrl} 拿不到歌词 ${lyrics}`);
    }
    await page.close();

    return lyrics;
  }

  const writeLyrics = async (album, oneSong, lyrics) => {
    const { albumInfo: { albumName }, yearInfo: { year } } = album;
    const { songName } = oneSong;

    const myDir = `./lyrics/${year}_${albumName}`;
    if (!fs.existsSync(myDir)) {
      fs.mkdirSync(myDir, {
        recursive: true
      })
    }
    const safeSongname = songName.replace(/\//g, '|');

    fs.writeFileSync(`${myDir}/${safeSongname}.txt`, lyrics);
  }

  const crawAlbum = async (album) => {
    const { allSongs } = album;

    await PromisePool.withConcurrency(5).for(allSongs).process(async (oneSong) => {
      const lyrics = await fetchLyric(oneSong);
      await writeLyrics(album, oneSong, lyrics);
    });
  }

  for (let i = 0; i < albums.length; i++) {
    const album = albums[i];
    console.log(`开始第${i}张专辑 ${album.albumInfo.albumName}`);
    await crawAlbum(album);
  }

  await browser.close();
}

getLyrics();

