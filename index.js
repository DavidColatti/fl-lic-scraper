const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");
const fileInfo = require("./data.json");

const scrapeLic = async (id, page) => {
  const html = await page.content();
  const $ = cheerio.load(html);

  try {
    const bizName =
      $(
        "tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(3) > font > b"
      ).text() || "N/A";

    const personalName =
      $(
        "tbody > tr > td > table:nth-child(1) > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(1) > td:nth-child(3) > font > b"
      ).text() || "N/A";

    const address =
      $(
        "tbody > tr > td > table:nth-child(1) > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(3) > font > b"
      ).text() || "N/A";

    const licDate =
      $(
        "tbody > tr > td > table:nth-child(3) > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(5) > td:nth-child(3) > font > b"
      ).text() || "N/A";

    const data = {
      lic_num: id,
      address: address,
      lic_date: licDate,
      business_name: bizName,
    };

    const found = fileInfo.find((each) => {
      const formatAddy = address.split("\n")[0];

      return formatAddy.toLowerCase() === each.Address.toLowerCase();
    });

    if (found) {
      data.phone_numer = found.Phone;
      data.personal_name = `${found.Last}, ${found.First}`;
      data.address = `${found.Address}, ${found["City & Zip"]}`;
      data.url = page.url();

      console.log(`${id} successfully scraped the data`);
      return data;
    }
  } catch (e) {
    console.log(`${id} failed at scraping the details`);
  }
};

const main = async (type, id, count) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const results = [];
  let idCounter = id;
  for (let i = 0; i < count; i++) {
    let newId = `${type}${idCounter}`;

    try {
      await page.goto("https://www.myfloridalicense.com/wl11.asp?mode=0&SID=");

      // selecting lic num radio input
      await page.click(
        "tbody > tr:nth-child(5) > td > font > input[type=radio]:nth-child(3)"
      );

      // search
      await page.click(
        "tbody > tr:nth-child(6) > td > p > font > input[type=image]"
      );

      await page.waitFor(2000);

      // Typing license number in search field
      await page.type(
        "tbody > tr:nth-child(4) > td:nth-child(2) > font > input",
        newId
      );
      // clicking on search button
      await page.click(
        "table > tbody > tr:nth-child(12) > td > font > input[type=image]"
      );

      await page.waitFor(2000);

      // click on first lic result
      await page.click(
        "tbody > tr > td > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > font > a"
      );

      await page.waitFor(2000);

      const data = await scrapeLic(newId, page);
      results.push(data);

      const csv = new ObjectsToCsv(results);
      await csv.toDisk(`./output${type}.csv`);
    } catch (e) {
      console.log(`${newId} failed to scrape`);
    }

    idCounter++;
  }
};

main("CBC", 1264151, 100);
main("CAC", 1820569, 100);
main("CRC", 1332807, 100);
main("EC", 13009833, 100);
main("CGC", 1529504, 100);
main("CMC", 1250850, 100);
main("CFC", 1430717, 100);
main("CPC", 1459502, 100);
main("CCC", 1332718, 100);
main("SCC", 131152319, 100);
