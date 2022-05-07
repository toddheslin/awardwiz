/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check
//const { webkit, chromium, firefox } = require("playwright")
const playwright = require("playwright-aws-lambda")
const fs = require("fs")
// // @ts-ignore
//const playwrightExtra = require("playwright-extra");
//import { addExtra } from 'playwright-extra'

/** @type {import("playwright-core").ChromiumBrowser?} */
let browser

/**
 * @param {import("../../src/types/types").LambdaRequest} event
 * @param {import("aws-lambda").Context} context
 * @returns {Promise<any>}
 */
exports.handler = async (event, context) => {
  if (!browser) {
    browser = await playwright.launchChromium({ headless: false })
  }

  //let browserName = event.browser || "chromium"
  //const extraLaunchArgs = event.browserArgs || []
  //const browserTypes = { webkit, chromium, firefox }
  // const browserLaunchArgs = {
  //   webkit: [],
  //   chromium: ["--single-process"],
  //   firefox: []
  // }

  // if (Object.keys(browserTypes).indexOf(browserName) < 0) {
  //   console.log(`Browser '${browserName}' not supported, using chromium`)
  //   browserName = "chromium"
  // }

  //let browser = null
  let filePath
  let browserContext
  let /** @type {import("../../src/types/types").LambdaResponse?} */ result = null


  try {
    //console.log(`Starting browser: ${browserName}`)


    //browser.use()

    browserContext = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36" })
    const page = await browserContext.newPage()

    filePath = `/tmp/request-${Date.now()}.js`
    fs.writeFileSync(filePath, event.code, { encoding: "utf-8" })
    console.log(`>>>>>>>>>> SCRIPT START ${filePath} ${JSON.stringify(event.context)}`)

    /** @type {import("../../src/types/types").ScraperModule} */
    const script = require(filePath)
    /** @type {import("../../src/types/scrapers").ScraperResults} */
    const scraperResults = await script.run(page, event.context)
    //await page.close()
    result = { scraperResults }

    console.log(`<<<<<<<<<< SCRIPT END ${filePath}`)

  } catch (error) {
      console.log(`!!!!! Error: ${error}`)
      throw error

  } finally {
    try {
      if (browserContext) {
        await browserContext.close()
      }
      if (filePath) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Removing script file ${filePath}`)
        }
      }
    } catch (e) {
    }
  }

  return result
}
