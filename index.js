const pptr = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

const text = process.argv[2];
const pageIndex = "#width > div > div > div > div:nth-child(9) > div:nth-child(1) > div.noindex";

(async text => {
    const browser = await pptr.launch({
        headless: true
    });
    const pages = await browser.pages();
    const page = pages[0];

    let url = `https://www.dafont.com/new.php?text=${text}&fpp=200&af=on&nup=3`;
    await page.goto(url, { waitUntil: "networkidle2"});
    const numberOfPage = await page.evaluate((pageIndex) => {
        const index = document.querySelector(pageIndex).children.length;
        return document.querySelector(pageIndex).children[index-2].innerText.trim();
    }, pageIndex);
    console.log('sayfa sayısı: ', numberOfPage);
    await collectImages(page);
    console.log('sayfa 1 bitti');
    for (let i = 2; i <= numberOfPage; i++) {
        url = `https://www.dafont.com/new.php?page=${i}&fpp=200&af=on&text=${text}&nup=3`;
        await page.goto(url, { waitUntil: "networkidle2"});
        await collectImages(page);
        console.log('sayfa ' + i + 'bitti');
    }
    console.log('indirme işlemi tamamlandı');
})(text);

async function collectImages(page){
    const results = await page.evaluate(() => {
        const resArray = [];
        const results = document.querySelectorAll("#width > div > div > div > div:nth-child(9) > div.preview");
        for(let i = 0; i < results.length; i++) {
            const url = results[i].style.backgroundImage.split('"')[1];
            if (!url.includes('.png')) {
                resArray.push(url);                
            }
        }
        return resArray;
    });
    for (let i = 0; i < results.length; i++) {
        const url = 'https:' + results[i];
        const filePath = 'images/' + text + Date.now() + '.png';
        await download_image(url, filePath);
        console.log((i + 1) + ' indirildi');
    }   
}

const download_image = (url, image_path) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  );