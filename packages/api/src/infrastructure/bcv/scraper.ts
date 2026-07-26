import * as cheerio from 'cheerio';
import { Agent, fetch } from 'undici';

export interface ScrapedRates {
    usdRate: number;
    eurRate: number;
    usdtRate: number | null;
    valueDate: Date | null;
}

/**
 * Scrapes bcv.org.ve for the current USD and EUR exchange rates,
 * and fetches the parallel rate from DolarApi.
 */
export async function scrapeBcvRates(): Promise<ScrapedRates> {
    const bcvUrl = process.env.BCV_URL || 'https://www.bcv.org.ve';
    const allowInsecureTls = process.env.BCV_INSECURE_TLS === 'true';

    // Allow opting into insecure TLS only when explicitly configured (e.g. for broken upstream certs).
    const dispatcher = new Agent({
        connect: { rejectUnauthorized: !allowInsecureTls },
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

    let usdtRate: number | null = null;
    try {
        const dResponse = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo', {
            dispatcher,
        });
        if (dResponse.ok) {
            const data = (await dResponse.json()) as { promedio?: number; venta?: number };
            const fetchedRate = data.promedio || data.venta;
            if (fetchedRate && !isNaN(fetchedRate)) {
                usdtRate = fetchedRate;
            }
        }
    } catch (e) {
        console.error('Failed to fetch parallel dollar rate from DolarApi:', e);
    }

    return {
        usdRate,
        eurRate,
        usdtRate,
        valueDate,
    };
}
