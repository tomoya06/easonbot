const puppeteer = require('puppeteer');
const fs = require('fs');

const getAlbums = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // await page.goto("https://mojim.com/cnh100111.htm");
  await page.goto("https://mojim.com/cnh100111-1.htm");

  await page.waitForSelector('#inS');

  const test = await page.evaluate(() => {
    return document.title;
  });

  console.log(`page title: ${test}`);

  const albums = await page.evaluate(() => {
    const output = [];
    const albumRowElems = document.querySelectorAll("#inS > dl > dd[class^='hb']:nth-child(n+6)");

    albumRowElems.forEach(rowElem => {
      const albumElem = rowElem.querySelector('.hc1 a') || rowElem.querySelector('.hc1');
      const yearElem = rowElem.querySelector('.hc2');
      const songsElems = rowElem.querySelectorAll('.hc3 a');
      const extraSongsElems = rowElem.querySelectorAll('.hc4 a');

      try {
        const albumInfo = {
          albumUrl: albumElem.getAttribute('href') || '',
          albumName: albumElem.textContent.trim(),
        };
        const yearInfo = {
          lang: yearElem.childNodes[0]?.textContent || '',
          year: yearElem.childNodes[2]?.textContent || '',
        }

        const allSongs = [...songsElems, ...extraSongsElems].map(elem => {
          return {
            songUrl: elem.getAttribute('href'),
            songName: elem.textContent.trim(),
          }
        });

        output.push({
          albumInfo,
          yearInfo,
          allSongs,
        })
      } catch (error) {
        debugger;
      }
    });

    return output;
  });

  await browser.close();

  await fs.writeFileSync('./albums2.json', JSON.stringify(albums, null, '\t'));
}

getAlbums();
