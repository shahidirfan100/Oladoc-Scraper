// Oladoc Doctors Scraper - Modern implementation with JSON API priority
import { Actor, log } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
import { gotScraping } from 'got-scraping';
import { load as cheerioLoad } from 'cheerio';

await Actor.init();

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
        } = input;

        const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : 50;
        const MAX_PAGES = Number.isFinite(+MAX_PAGES_RAW) ? Math.max(1, +MAX_PAGES_RAW) : 10;

        const toAbs = (href, base = 'https://oladoc.com') => {
            try { return new URL(href, base).href; } catch { return null; }
        };

        const cleanText = (text) => {
            if (!text) return '';
            return String(text).replace(/\s+/g, ' ').trim();
        };

        const buildStartUrl = (spec, cty, ctry) => {
            return `https://oladoc.com/${ctry}/${cty}/${spec}`;
        };

        const initial = startUrl || buildStartUrl(specialty, city, country);
        const proxyConf = proxyConfiguration ? await Actor.createProxyConfiguration({ ...proxyConfiguration }) : undefined;

        let saved = 0;
        const seenUrls = new Set();

        // Try to fetch JSON API data first
        async function tryJsonApi(url, proxyUrl) {
            try {
                log.info(`Attempting JSON API extraction for: ${url}`);
                
                // Try to extract page number and build API URL
                const pageMatch = url.match(/[?&]page=(\d+)/);
                const page = pageMatch ? parseInt(pageMatch[1]) : 1;
                
                // Construct potential API endpoint
                const apiUrl = url.replace(/\?.*$/, '') + `?page=${page}`;
                
                const response = await gotScraping({
                    url: apiUrl,
                    headers: {
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'X-Requested-With': 'XMLHttpRequest',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    proxyUrl,
                    responseType: 'json',
                    timeout: { request: 30000 },
                });

                if (response.body && typeof response.body === 'object') {
                    log.info('Successfully extracted JSON data');
                    return response.body;
                }
            } catch (err) {
                log.debug(`JSON API failed: ${err.message}`);
            }
            return null;
        }

        // Extract doctor data from listing page HTML
        function extractDoctorsFromListing($, pageUrl) {
            const doctors = [];
            
            // Find doctor cards/listings
            $('a[href*="/dr/"]').each((_, link) => {
                const href = $(link).attr('href');
                if (!href || !href.includes('/dr/')) return;
                
                const fullUrl = toAbs(href);
                if (!fullUrl || seenUrls.has(fullUrl)) return;
                
                seenUrls.add(fullUrl);
                
                // Try to extract basic info from listing
                const card = $(link).closest('div, article, section');
                
                const name = $(link).text().trim() || 
                            card.find('h2, h3, .doctor-name, [class*="name"]').first().text().trim();
                
                const specialty = card.find('[class*="specialty"], [class*="specialization"]').text().trim();
                const rating = card.find('[class*="rating"]').text().trim();
                const reviews = card.find('[class*="review"]').text().match(/\d+/)?.[0];
                const experience = card.find('[class*="experience"]').text().trim();
                const fee = card.find('[class*="fee"], [class*="price"]').text().trim();
                
                doctors.push({
                    url: fullUrl,
                    name: cleanText(name),
                    specialty: cleanText(specialty),
                    rating: cleanText(rating),
                    reviews_count: reviews ? parseInt(reviews) : null,
                    experience: cleanText(experience),
                    consultation_fee: cleanText(fee),
                });
            });
            
            return doctors;
        }

        // Extract comprehensive doctor profile data
        function extractDoctorProfile($, url) {
            const data = {};
            
            // Extract JSON-LD structured data if available
            const jsonLd = extractJsonLd($);
            if (jsonLd) {
                data.name = jsonLd.name;
                data.specialty = jsonLd.specialty;
                data.rating = jsonLd.aggregateRating?.ratingValue;
                data.reviews_count = jsonLd.aggregateRating?.reviewCount;
            }
            
            // Fallback to HTML parsing
            if (!data.name) {
                data.name = $('h1').first().text().trim() || 
                           $('[class*="doctor-name"]').first().text().trim();
            }
            
            data.specialty = data.specialty || 
                           $('[class*="specialty"], [class*="specialization"]').first().text().trim();
            
            data.qualifications = $('[class*="qualification"], [class*="degree"]').map((_, el) => 
                $(el).text().trim()
            ).get().join(', ');
            
            data.experience = $('[class*="experience"]').first().text().trim();
            data.wait_time = $('[class*="wait"]').first().text().trim();
            
            data.rating = data.rating || 
                        $('[class*="rating"]').first().text().match(/[\d.]+/)?.[0];
            
            data.reviews_count = data.reviews_count || 
                               parseInt($('[class*="review"]').first().text().match(/\d+/)?.[0] || 0);
            
            data.consultation_fee = $('[class*="fee"], [class*="price"]').first().text().trim();
            data.availability = $('[class*="available"]').first().text().trim();
            
            data.pmdc_verified = $('[class*="pmdc"], [class*="verified"]').length > 0;
            
            // Extract hospital/clinic info
            data.hospitals = $('[class*="hospital"], [class*="clinic"]').map((_, el) => ({
                name: $(el).find('[class*="name"]').text().trim(),
                location: $(el).find('[class*="location"]').text().trim(),
                fee: $(el).find('[class*="fee"]').text().trim(),
            })).get();
            
            // Extract services/treatments
            data.services = $('[class*="service"], [class*="treatment"]').map((_, el) => 
                $(el).text().trim()
            ).get();
            
            data.city = city;
            data.url = url;
            
            return data;
        }

        function extractJsonLd($) {
            try {
                const scripts = $('script[type="application/ld+json"]');
                for (let i = 0; i < scripts.length; i++) {
                    const json = JSON.parse($(scripts[i]).html() || '{}');
                    const items = Array.isArray(json) ? json : [json];
                    
                    for (const item of items) {
                        const type = item['@type'];
                        if (type === 'Physician' || type === 'Doctor' || type === 'Person') {
                            return item;
                        }
                    }
                }
            } catch (err) {
                log.debug(`JSON-LD parsing failed: ${err.message}`);
            }
            return null;
        }

        function findNextPage($, currentUrl) {
            // Look for pagination links
            const nextLink = $('a[rel="next"]').attr('href') ||
                           $('a:contains("Next"), a:contains("›"), a:contains("»")').attr('href') ||
                           $('[class*="pagination"] a[class*="next"]').attr('href');
            
            if (nextLink) return toAbs(nextLink, currentUrl);
            
            // Try to find page number and increment
            const currentPage = parseInt(currentUrl.match(/[?&]page=(\d+)/)?.[1] || '1');
            const hasMoreResults = $('[class*="doctor"], [class*="listing"]').length > 0;
            
            if (hasMoreResults && currentPage < MAX_PAGES) {
                const url = new URL(currentUrl);
                url.searchParams.set('page', currentPage + 1);
                return url.href;
            }
            
            return null;
        }

        const crawler = new CheerioCrawler({
            proxyConfiguration: proxyConf,
            maxRequestRetries: 3,
            useSessionPool: true,
            maxConcurrency: 5,
            requestHandlerTimeoutSecs: 90,
            
            async requestHandler({ request, $, enqueueLinks, log: crawlerLog, proxyInfo }) {
                const label = request.userData?.label || 'LIST';
                const pageNo = request.userData?.pageNo || 1;

                crawlerLog.info(`Processing ${label} page: ${request.url}`);

                if (label === 'LIST') {
                    // Try JSON API first
                    const jsonData = await tryJsonApi(request.url, proxyInfo?.url);
                    
                    let doctors = [];
                    
                    if (jsonData && jsonData.doctors) {
                        // Extract from JSON response
                        doctors = jsonData.doctors.map(doc => ({
                            url: toAbs(doc.url || doc.profile_url),
                            name: doc.name,
                            specialty: doc.specialty,
                            rating: doc.rating,
                            reviews_count: doc.reviews_count,
                            experience: doc.experience,
                            consultation_fee: doc.fee,
                            city: doc.city || city,
                        }));
                        crawlerLog.info(`Extracted ${doctors.length} doctors from JSON API`);
                    } else {
                        // Fallback to HTML parsing
                        doctors = extractDoctorsFromListing($, request.url);
                        crawlerLog.info(`Extracted ${doctors.length} doctors from HTML`);
                    }

                    if (collectDetails) {
                        // Enqueue detail pages
                        const remaining = RESULTS_WANTED - saved;
                        const toEnqueue = doctors.slice(0, Math.max(0, remaining));
                        
                        if (toEnqueue.length > 0) {
                            await enqueueLinks({
                                urls: toEnqueue.map(d => d.url),
                                userData: { label: 'DETAIL', listingData: toEnqueue },
                            });
                        }
                    } else {
                        // Save basic data without details
                        const remaining = RESULTS_WANTED - saved;
                        const toPush = doctors.slice(0, Math.max(0, remaining));
                        
                        if (toPush.length > 0) {
                            await Dataset.pushData(toPush);
                            saved += toPush.length;
                            crawlerLog.info(`Saved ${toPush.length} doctors. Total: ${saved}/${RESULTS_WANTED}`);
                        }
                    }

                    // Paginate if needed
                    if (saved < RESULTS_WANTED && pageNo < MAX_PAGES) {
                        const nextUrl = findNextPage($, request.url);
                        if (nextUrl) {
                            await enqueueLinks({
                                urls: [nextUrl],
                                userData: { label: 'LIST', pageNo: pageNo + 1 },
                            });
                            crawlerLog.info(`Enqueued next page: ${nextUrl}`);
                        } else {
                            crawlerLog.info('No more pages found');
                        }
                    }
                    
                    return;
                }

                if (label === 'DETAIL') {
                    if (saved >= RESULTS_WANTED) {
                        crawlerLog.info('Results limit reached, skipping detail page');
                        return;
                    }

                    try {
                        const doctorData = extractDoctorProfile($, request.url);
                        
                        // Ensure we have minimum required data
                        if (!doctorData.name) {
                            crawlerLog.warning(`No doctor name found on ${request.url}`);
                            return;
                        }

                        await Dataset.pushData(doctorData);
                        saved++;
                        crawlerLog.info(`Saved doctor: ${doctorData.name} (${saved}/${RESULTS_WANTED})`);
                        
                    } catch (err) {
                        crawlerLog.error(`Failed to extract doctor profile: ${err.message}`);
                    }
                }
            },
        });

        await crawler.run([{ 
            url: initial, 
            userData: { label: 'LIST', pageNo: 1 } 
        }]);
        
        log.info(`✓ Scraping completed. Saved ${saved} doctor profiles`);
        
    } catch (err) {
        log.error(`Fatal error: ${err.message}`);
        throw err;
    } finally {
        await Actor.exit();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
