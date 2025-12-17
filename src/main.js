// Oladoc Doctors Scraper - JSON-first (JSON-LD) + HTML fallback, production-grade
import { Actor, log } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';

await Actor.init();

const BASE_URL = 'https://oladoc.com';

const DEFAULT_HEADERS = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

function toAbs(href, base = BASE_URL) {
    try {
        return new URL(href, base).href;
    } catch {
        return null;
    }
}

function cleanText(text) {
    if (!text) return '';
    return String(text).replace(/\s+/g, ' ').trim();
}

function parseFirstNumber(text) {
    const match = String(text || '').match(/(\d+(\.\d+)?)/);
    return match ? Number(match[1]) : null;
}

function parseIntOrNull(text) {
    const match = String(text || '').match(/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : null;
}

function parseDoctorIdFromUrl(url) {
    const match = String(url || '').match(/\/(\d+)(?:[/?#]|$)/);
    return match ? match[1] : null;
}

function normalizeSpecialtiesFromJsonLd(jsonLd) {
    const medicalSpecialty = jsonLd?.medicalSpecialty;
    if (!medicalSpecialty) return cleanText(jsonLd?.specialty || '');

    if (typeof medicalSpecialty === 'string') return cleanText(medicalSpecialty);

    const names = [];
    if (Array.isArray(medicalSpecialty?.name)) names.push(...medicalSpecialty.name);
    else if (medicalSpecialty?.name) names.push(medicalSpecialty.name);
    if (Array.isArray(medicalSpecialty?.sameAs)) names.push(...medicalSpecialty.sameAs);

    return cleanText([...new Set(names.map(cleanText).filter(Boolean))].join(', '));
}

function extractPhysiciansFromJsonLd($) {
    const physicians = [];

    $('script[type="application/ld+json"]').each((_, el) => {
        const raw = $(el).html();
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of items) {
                if (!item || typeof item !== 'object') continue;
                if (item['@type'] === 'Physician' || item['@type'] === 'Doctor') physicians.push(item);
            }
        } catch {
            // ignore invalid JSON-LD blocks
        }
    });

    return physicians;
}

function extractDoctorsFromListingJsonLd($, city) {
    const physicians = extractPhysiciansFromJsonLd($);

    return physicians
        .map((p) => {
            const url = toAbs(p.url);
            if (!url || !url.includes('/dr/')) return null;

            const name = cleanText(p.name);
            const specialty = normalizeSpecialtiesFromJsonLd(p);
            const consultation_fee = cleanText(p.priceRange || '');

            return {
                url,
                doctor_id: parseDoctorIdFromUrl(url),
                name,
                specialty,
                consultation_fee,
                city,
            };
        })
        .filter(Boolean);
}

function extractDoctorsFromListingHtml($, city) {
    const doctors = [];

    $('a[href*="/dr/"]').each((_, link) => {
        const href = $(link).attr('href');
        const fullUrl = toAbs(href);
        if (!fullUrl || !fullUrl.includes('/dr/')) return;

        const doctorId = parseDoctorIdFromUrl(fullUrl);
        if (!doctorId) return;

        const card = $(link).closest('article, section, div');
        const name = cleanText(
            $(link).find('h2,h3').first().text() || $(link).text() || card.find('h2,h3,[class*="doctor-name" i],[class*="name" i]').first().text(),
        );

        const specialty = cleanText(card.find('[class*="specialty" i],[class*="specialization" i]').first().text());
        const rating = parseFirstNumber(card.find('[class*="rating" i]').first().text());
        const reviews_count = parseIntOrNull(card.find('[class*="review" i]').first().text());
        const experience = cleanText(card.find('[class*="experience" i]').first().text());
        const consultation_fee = cleanText(card.find('[class*="fee" i],[class*="price" i]').first().text());

        doctors.push({
            url: fullUrl,
            doctor_id: doctorId,
            name,
            specialty,
            rating,
            reviews_count,
            experience,
            consultation_fee,
            city,
        });
    });

    return doctors;
}

function extractDoctorProfile($, url, defaultCity) {
    const data = {};

    const physicians = extractPhysiciansFromJsonLd($);
    const jsonLd = physicians.find((p) => toAbs(p.url) === url) || physicians[0];

    if (jsonLd) {
        data.name = cleanText(jsonLd.name);
        data.specialty = normalizeSpecialtiesFromJsonLd(jsonLd);
        data.consultation_fee = cleanText(jsonLd.priceRange || '');
        data.phone = cleanText(jsonLd.telephone || '');
        data.description = cleanText(jsonLd.description || '');
    }

    data.name ||= cleanText($('h1').first().text());
    data.specialty ||= cleanText(
        $('[class*="specialty" i],[class*="specialization" i]').first().text() || $('[data-testid*="specialty" i]').first().text(),
    );

    data.rating = data.rating ?? parseFirstNumber($('[class*="rating" i]').first().text());
    data.reviews_count = data.reviews_count ?? parseIntOrNull($('[class*="review" i]').first().text());

    data.qualifications = cleanText(
        $('[class*="qualification" i],[class*="degree" i]')
            .map((_, el) => cleanText($(el).text()))
            .get()
            .filter(Boolean)
            .slice(0, 20)
            .join(', '),
    );

    data.experience = cleanText($('[class*="experience" i]').first().text());
    data.wait_time = cleanText($('[class*="wait" i]').first().text());
    data.availability = cleanText($('[class*="available" i],[class*="availability" i]').first().text());

    data.pmdc_verified = $('[class*="pmdc" i],[class*="verified" i]').length > 0;

    data.services = $('[class*="service" i],[class*="treatment" i]')
        .map((_, el) => cleanText($(el).text()))
        .get()
        .filter(Boolean)
        .slice(0, 50);

    data.city = defaultCity;
    data.url = url;
    data.doctor_id = parseDoctorIdFromUrl(url);

    return data;
}

function isLikelyBlockedOrWrongPage($, requestUrl) {
    const title = cleanText($('title').text()).toLowerCase();
    if (title.includes('access denied') || title.includes('forbidden') || title.includes('robot')) return true;

    const hasDoctorLinks = $('a[href*="/dr/"]').length > 0;
    const hasPhysiciansJsonLd = extractPhysiciansFromJsonLd($).length > 0;

    if (!hasDoctorLinks && !hasPhysiciansJsonLd) {
        log.debug(`No doctor markers found on: ${requestUrl}`);
        return true;
    }

    return false;
}

function isNoResultsListing($) {
    const text = cleanText($('body').text()).toLowerCase();
    return (
        text.includes('no doctors found')
        || text.includes('no doctor found')
        || text.includes('no results found')
        || text.includes('could not find')
    );
}

function getNextListingUrl($, currentUrl) {
    const nextHref =
        $('link[rel="next"]').attr('href')
        || $('a[rel="next"]').attr('href')
        || $('[class*="pagination" i] a[aria-label*="next" i]').attr('href')
        || $('[class*="pagination" i] a[class*="next" i]').attr('href');

    if (nextHref) return toAbs(nextHref, currentUrl);

    const match = String(currentUrl).match(/^(.*\/)(\d+)(?:[/?#]|$)/);
    if (match) {
        const prefix = match[1];
        const offset = Number.parseInt(match[2], 10);
        if (Number.isFinite(offset)) return `${prefix}${offset + 10}`;
    }

    if (!String(currentUrl).match(/\/\d+(?:[/?#]|$)/)) {
        return `${currentUrl.replace(/\/$/, '')}/10`;
    }

    return null;
}

async function main() {
    try {
        const input = (await Actor.getInput()) || {};
        const {
            specialty = 'dermatologist',
            city = 'lahore',
            country = 'pakistan',
            results_wanted: RESULTS_WANTED_RAW = 50,
            max_pages: MAX_PAGES_RAW = 10,
            collectDetails = true,
            startUrl,
            proxyConfiguration,
            maxConcurrency: MAX_CONCURRENCY_RAW = 8,
            maxRequestsPerMinute: MAX_RPM_RAW = 90,
        } = input;

        const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : 50;
        const MAX_PAGES = Number.isFinite(+MAX_PAGES_RAW) ? Math.max(1, +MAX_PAGES_RAW) : 10;
        const MAX_CONCURRENCY = Number.isFinite(+MAX_CONCURRENCY_RAW) ? Math.max(1, +MAX_CONCURRENCY_RAW) : 8;
        const MAX_RPM = Number.isFinite(+MAX_RPM_RAW) ? Math.max(10, +MAX_RPM_RAW) : 90;

        const buildStartUrl = (spec, cty, ctry) => `https://oladoc.com/${ctry}/${cty}/${spec}`;
        const initial = startUrl || buildStartUrl(specialty, city, country);

        const proxyConf = await Actor.createProxyConfiguration(proxyConfiguration ?? {});
        const requestQueue = await Actor.openRequestQueue();

        const state = {
            saved: 0,
            enqueuedDetails: 0,
            listPagesProcessed: 0,
            uniqueDoctorIds: new Set(),
        };

        const addRequest = async ({ url, userData, uniqueKey, headers }) => {
            await requestQueue.addRequest({
                url,
                uniqueKey,
                userData,
                headers: { ...DEFAULT_HEADERS, ...(headers || {}) },
            });
        };

        await addRequest({
            url: initial,
            uniqueKey: `LIST:${initial}`,
            userData: { label: 'LIST', pageIndex: 1 },
        });

        const crawler = new CheerioCrawler({
            requestQueue,
            proxyConfiguration: proxyConf,
            useSessionPool: true,
            persistCookiesPerSession: true,
            maxRequestRetries: 5,
            maxConcurrency: MAX_CONCURRENCY,
            maxRequestsPerMinute: MAX_RPM,
            requestHandlerTimeoutSecs: 90,

            async requestHandler({ request, $, log: crawlerLog, session, response }) {
                const label = request.userData?.label || 'LIST';
                const pageIndex = request.userData?.pageIndex || 1;
                const statusCode = response?.statusCode;

                crawlerLog.info(`[${label}] ${statusCode || ''} ${request.url}`);

                if (statusCode === 404 || statusCode === 410) {
                    crawlerLog.warning(`[${label}] Not found (HTTP ${statusCode}): ${request.url}`);
                    return;
                }

                if (statusCode === 403 || statusCode === 429) {
                    session?.markBad();
                    throw new Error(`Blocked (HTTP ${statusCode})`);
                }

                if (label === 'LIST') {
                    state.listPagesProcessed++;

                    if (isLikelyBlockedOrWrongPage($, request.url)) {
                        session?.markBad();
                        throw new Error('Blocked or unexpected listing HTML (no doctor markers)');
                    }

                    let doctors = extractDoctorsFromListingJsonLd($, city);
                    if (doctors.length === 0) doctors = extractDoctorsFromListingHtml($, city);

                    const normalized = [];
                    for (const doc of doctors) {
                        const url = toAbs(doc.url);
                        const doctorId = doc.doctor_id || parseDoctorIdFromUrl(url);
                        if (!url || !doctorId) continue;
                        if (state.uniqueDoctorIds.has(doctorId)) continue;
                        state.uniqueDoctorIds.add(doctorId);
                        normalized.push({
                            ...doc,
                            url,
                            doctor_id: doctorId,
                            name: cleanText(doc.name),
                            specialty: cleanText(doc.specialty),
                            consultation_fee: cleanText(doc.consultation_fee),
                            experience: cleanText(doc.experience),
                            city: doc.city || city,
                        });
                    }

                    crawlerLog.info(`Extracted ${normalized.length} unique doctors from listing (page ${pageIndex})`);

                    if (normalized.length === 0 && isNoResultsListing($)) {
                        crawlerLog.info('No results for this query; stopping pagination.');
                        session?.markGood();
                        return;
                    }

                    if (!collectDetails) {
                        const remaining = RESULTS_WANTED - state.saved;
                        const toPush = normalized.slice(0, Math.max(0, remaining));
                        if (toPush.length > 0) {
                            await Dataset.pushData(
                                toPush.map((d) => ({
                                    name: d.name,
                                    specialty: d.specialty,
                                    qualifications: d.qualifications || '',
                                    experience: d.experience || '',
                                    rating: d.rating ?? null,
                                    reviews_count: d.reviews_count ?? null,
                                    consultation_fee: d.consultation_fee || '',
                                    availability: d.availability || '',
                                    city: d.city || city,
                                    url: d.url,
                                    doctor_id: d.doctor_id,
                                })),
                            );
                            state.saved += toPush.length;
                            crawlerLog.info(`Saved ${toPush.length} doctors (total ${state.saved}/${RESULTS_WANTED})`);
                        }
                        session?.markGood();
                    } else {
                        const remaining = RESULTS_WANTED - state.enqueuedDetails;
                        const toEnqueue = normalized.slice(0, Math.max(0, remaining));

                        for (const d of toEnqueue) {
                            await addRequest({
                                url: d.url,
                                uniqueKey: `DETAIL:${d.doctor_id}`,
                                userData: { label: 'DETAIL', listingData: d },
                            });
                            state.enqueuedDetails++;
                        }

                        crawlerLog.info(`Enqueued ${toEnqueue.length} detail pages (total ${state.enqueuedDetails}/${RESULTS_WANTED})`);
                        session?.markGood();
                    }

                    const haveEnough = collectDetails ? state.enqueuedDetails >= RESULTS_WANTED : state.saved >= RESULTS_WANTED;
                    if (haveEnough) return;
                    if (pageIndex >= MAX_PAGES) return;

                    const nextUrl = getNextListingUrl($, request.url);
                    if (!nextUrl) {
                        crawlerLog.info('No next listing page found');
                        return;
                    }

                    await addRequest({
                        url: nextUrl,
                        uniqueKey: `LIST:${nextUrl}`,
                        userData: { label: 'LIST', pageIndex: pageIndex + 1 },
                    });

                    crawlerLog.info(`Enqueued next listing page: ${nextUrl}`);
                    return;
                }

                if (label === 'DETAIL') {
                    if (state.saved >= RESULTS_WANTED) return;

                    if (isLikelyBlockedOrWrongPage($, request.url)) {
                        session?.markBad();
                        throw new Error('Blocked or unexpected detail HTML');
                    }

                    const listingData = request.userData?.listingData || {};
                    const profile = extractDoctorProfile($, request.url, listingData.city || city);

                    const merged = {
                        ...listingData,
                        ...profile,
                        name: cleanText(profile.name || listingData.name),
                        specialty: cleanText(profile.specialty || listingData.specialty),
                        qualifications: cleanText(profile.qualifications || listingData.qualifications || ''),
                        experience: cleanText(profile.experience || listingData.experience || ''),
                        consultation_fee: cleanText(profile.consultation_fee || listingData.consultation_fee || ''),
                        availability: cleanText(profile.availability || listingData.availability || ''),
                        city: cleanText(profile.city || listingData.city || city),
                        url: profile.url || listingData.url || request.url,
                        doctor_id: profile.doctor_id || listingData.doctor_id || parseDoctorIdFromUrl(request.url),
                        rating: profile.rating ?? listingData.rating ?? null,
                        reviews_count: profile.reviews_count ?? listingData.reviews_count ?? null,
                    };

                    if (!merged.name) {
                        crawlerLog.warning(`Skipping detail page (missing name): ${request.url}`);
                        return;
                    }

                    await Dataset.pushData(merged);
                    state.saved++;
                    crawlerLog.info(`Saved ${merged.name} (${state.saved}/${RESULTS_WANTED})`);
                    session?.markGood();
                }
            },
        });

        await crawler.run();

        log.info(`Scraping completed. Saved ${state.saved} doctor profiles.`);
    } catch (err) {
        log.error(`Fatal error: ${err?.message || err}`);
        throw err;
    } finally {
        await Actor.exit();
    }
}

await main();
