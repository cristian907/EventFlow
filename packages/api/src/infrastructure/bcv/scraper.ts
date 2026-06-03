import * as cheerio from 'cheerio';
import { Agent, fetch } from 'undici';

export interface ScrapedRates {
    usdRate: number;
    eurRate: number;
    valueDate: Date | null;
}

/**
 * Scrapes bcv.org.ve for the current USD and EUR exchange rates.
 */
export async function scrapeBcvRates(): Promise<ScrapedRates> {
    const bcvUrl = process.env.BCV_URL || 'https://www.bcv.org.ve';

    // To prevent SSL errors as BCV site often has certificate issues
    const dispatcher = new Agent({
        connect: { rejectUnauthorized: false },
    });

    const response = await fetch(bcvUrl, { dispatcher });
    if (!response.ok) {
        throw new Error(`BCV scraper failed with status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract USD
    const usdText = $('#dolar strong').text().trim().replace(',', '.');
    const usdRate = parseFloat(usdText);

    // Extract EUR
    const eurText = $('#euro strong').text().trim().replace(',', '.');
    const eurRate = parseFloat(eurText);

    if (isNaN(usdRate) || isNaN(eurRate)) {
        throw new Error('Failed to parse BCV exchange rates');
    }

    // Attempt to extract the value date. Often found in a specific class
    let valueDate: Date | null = null;
    const valueDateStr = $('.date-display-single').first().attr('content');
    if (valueDateStr) {
        const parsedDate = new Date(valueDateStr);
        if (!isNaN(parsedDate.getTime())) {
            valueDate = parsedDate;
        }
    }

    return {
        usdRate,
        eurRate,
        valueDate,
    };
}
