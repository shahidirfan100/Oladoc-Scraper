# Oladoc Doctors Scraper

<p align="center">
  <strong>Extract comprehensive doctor profiles from Oladoc.com - Pakistan's largest healthcare platform</strong>
</p>

<p align="center">
  <em>Fast, reliable, and accurate doctor data extraction for healthcare research, market analysis, and appointment booking platforms</em>
</p>

---

## What is Oladoc Doctors Scraper?

The Oladoc Doctors Scraper is a powerful data extraction tool designed to collect detailed information about medical professionals listed on Oladoc.com. This scraper efficiently gathers doctor profiles including specialties, qualifications, experience, ratings, consultation fees, and availability across major cities in Pakistan.

Perfect for healthcare analytics, competitive research, medical directories, and appointment aggregator platforms.

## Key Features

<ul>
  <li>✅ <strong>Smart Data Extraction</strong> - Prioritizes JSON API for speed, falls back to HTML parsing for reliability</li>
  <li>✅ <strong>Comprehensive Profiles</strong> - Captures doctor name, specialty, qualifications, experience, ratings, reviews, fees</li>
  <li>✅ <strong>Multi-City Support</strong> - Scrape doctors from Lahore, Karachi, Islamabad, Rawalpindi, and more</li>
  <li>✅ <strong>Flexible Filtering</strong> - Search by specialty (dermatologist, cardiologist, pediatrician, etc.)</li>
  <li>✅ <strong>Automatic Pagination</strong> - Handles multiple pages of results automatically</li>
  <li>✅ <strong>Detailed Profiles</strong> - Optional deep scraping of individual doctor profile pages</li>
  <li>✅ <strong>PMDC Verification</strong> - Captures Pakistan Medical Commission verification status</li>
  <li>✅ <strong>Hospital Information</strong> - Extracts affiliated clinics/hospitals with location and fees</li>
  <li>✅ <strong>Clean Data Format</strong> - Structured JSON output ready for analysis</li>
  <li>✅ <strong>Proxy Support</strong> - Built-in Apify Proxy integration for reliable scraping</li>
</ul>

## Use Cases

<table>
  <tr>
    <td><strong>Healthcare Market Research</strong></td>
    <td>Analyze doctor distribution, specialties, and pricing across regions</td>
  </tr>
  <tr>
    <td><strong>Medical Directories</strong></td>
    <td>Build comprehensive doctor databases for healthcare platforms</td>
  </tr>
  <tr>
    <td><strong>Appointment Aggregators</strong></td>
    <td>Collect doctor availability and consultation fee data</td>
  </tr>
  <tr>
    <td><strong>Competitive Analysis</strong></td>
    <td>Track doctor ratings, reviews, and service offerings</td>
  </tr>
  <tr>
    <td><strong>Healthcare Analytics</strong></td>
    <td>Study healthcare provider distribution and accessibility</td>
  </tr>
</table>

---

## Input Configuration

The scraper accepts the following input parameters:

<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Type</th>
      <th>Required</th>
      <th>Description</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>specialty</code></td>
      <td>String</td>
      <td>No</td>
      <td>Doctor specialty to search for</td>
      <td><code>dermatologist</code>, <code>cardiologist</code>, <code>pediatrician</code></td>
    </tr>
    <tr>
      <td><code>city</code></td>
      <td>String</td>
      <td>No</td>
      <td>City to search in</td>
      <td><code>lahore</code>, <code>karachi</code>, <code>islamabad</code></td>
    </tr>
    <tr>
      <td><code>country</code></td>
      <td>String</td>
      <td>No</td>
      <td>Country code (default: pakistan)</td>
      <td><code>pakistan</code></td>
    </tr>
    <tr>
      <td><code>startUrl</code></td>
      <td>String</td>
      <td>No</td>
      <td>Custom Oladoc URL to start from</td>
      <td><code>https://oladoc.com/pakistan/lahore/dermatologist</code></td>
    </tr>
    <tr>
      <td><code>collectDetails</code></td>
      <td>Boolean</td>
      <td>No</td>
      <td>Visit profile pages for full details (default: true)</td>
      <td><code>true</code> / <code>false</code></td>
    </tr>
    <tr>
      <td><code>results_wanted</code></td>
      <td>Integer</td>
      <td>No</td>
      <td>Maximum number of doctors to extract</td>
      <td><code>50</code> (default)</td>
    </tr>
    <tr>
      <td><code>max_pages</code></td>
      <td>Integer</td>
      <td>No</td>
      <td>Maximum listing pages to scrape</td>
      <td><code>10</code> (default)</td>
    </tr>
    <tr>
      <td><code>proxyConfiguration</code></td>
      <td>Object</td>
      <td>Recommended</td>
      <td>Proxy settings for reliable scraping</td>
      <td>Apify Proxy (residential recommended)</td>
    </tr>
  </tbody>
</table>

### Input Example

```json
{
  "specialty": "dermatologist",
  "city": "lahore",
  "country": "pakistan",
  "collectDetails": true,
  "results_wanted": 50,
  "max_pages": 5,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

---

## Output Data Schema

The scraper provides detailed, structured data for each doctor:

### Output Fields

<table>
  <thead>
    <tr>
      <th>Field</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>name</code></td>
      <td>String</td>
      <td>Doctor's full name with title (e.g., "Dr. Ali Khan")</td>
    </tr>
    <tr>
      <td><code>specialty</code></td>
      <td>String</td>
      <td>Medical specialty (e.g., "Dermatologist, Cosmetologist")</td>
    </tr>
    <tr>
      <td><code>qualifications</code></td>
      <td>String</td>
      <td>Educational qualifications and degrees</td>
    </tr>
    <tr>
      <td><code>experience</code></td>
      <td>String</td>
      <td>Years of professional experience</td>
    </tr>
    <tr>
      <td><code>rating</code></td>
      <td>String</td>
      <td>Patient rating (e.g., "4.9")</td>
    </tr>
    <tr>
      <td><code>reviews_count</code></td>
      <td>Integer</td>
      <td>Total number of patient reviews</td>
    </tr>
    <tr>
      <td><code>consultation_fee</code></td>
      <td>String</td>
      <td>Consultation fee in PKR</td>
    </tr>
    <tr>
      <td><code>wait_time</code></td>
      <td>String</td>
      <td>Average wait time at clinic</td>
    </tr>
    <tr>
      <td><code>availability</code></td>
      <td>String</td>
      <td>Next available appointment slot</td>
    </tr>
    <tr>
      <td><code>pmdc_verified</code></td>
      <td>Boolean</td>
      <td>Pakistan Medical Commission verification status</td>
    </tr>
    <tr>
      <td><code>hospitals</code></td>
      <td>Array</td>
      <td>List of affiliated hospitals/clinics with details</td>
    </tr>
    <tr>
      <td><code>services</code></td>
      <td>Array</td>
      <td>Medical services and treatments offered</td>
    </tr>
    <tr>
      <td><code>city</code></td>
      <td>String</td>
      <td>Primary practice city</td>
    </tr>
    <tr>
      <td><code>url</code></td>
      <td>String</td>
      <td>Doctor's profile URL on Oladoc</td>
    </tr>
  </tbody>
</table>

### Output Example

```json
{
  "name": "Dr. Saira Jabeen",
  "specialty": "Dermatologist, Cosmetologist",
  "qualifications": "MBBS, FCPS (Dermatology), D-DERM Ireland",
  "experience": "10 Years Experience",
  "rating": "4.9",
  "reviews_count": 701,
  "consultation_fee": "Rs. 2,000",
  "wait_time": "Under 15 Min",
  "availability": "Available tomorrow",
  "pmdc_verified": true,
  "hospitals": [
    {
      "name": "Online Video Consultation",
      "location": "Video Consultation",
      "fee": "Rs. 2,000"
    }
  ],
  "services": ["Acne Treatment", "Skin Whitening", "Chemical Peels"],
  "city": "lahore",
  "url": "https://oladoc.com/pakistan/video-consultation/dr/dermatologist/saira-jabeen-derma/3012680"
}
```

---

## How to Use

### 1. Quick Start

<ol>
  <li>Open the actor in Apify Console</li>
  <li>Configure input parameters (specialty, city, results wanted)</li>
  <li>Click "Start" to begin extraction</li>
  <li>Download results in JSON, CSV, or Excel format</li>
</ol>

### 2. Via API

```bash
curl "https://api.apify.com/v2/acts/YOUR_USERNAME~oladoc-doctors-scraper/runs" \
  -X POST \
  -d '{
    "specialty": "dermatologist",
    "city": "lahore",
    "results_wanted": 50
  }' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_TOKEN'
```

### 3. Integrations

<ul>
  <li><strong>Make (Integromat)</strong> - Automate data collection workflows</li>
  <li><strong>Zapier</strong> - Connect with 5000+ apps</li>
  <li><strong>Google Sheets</strong> - Direct export to spreadsheets</li>
  <li><strong>Webhooks</strong> - Real-time data delivery</li>
  <li><strong>API</strong> - Programmatic access for custom integrations</li>
</ul>

---

## Performance & Limits

<table>
  <tr>
    <td><strong>Speed</strong></td>
    <td>~50-100 doctors per minute (depending on detail level)</td>
  </tr>
  <tr>
    <td><strong>Accuracy</strong></td>
    <td>99%+ with dual extraction method (JSON + HTML fallback)</td>
  </tr>
  <tr>
    <td><strong>Concurrency</strong></td>
    <td>5 concurrent requests (optimized for stability)</td>
  </tr>
  <tr>
    <td><strong>Retry Logic</strong></td>
    <td>3 automatic retries on failure</td>
  </tr>
  <tr>
    <td><strong>Data Freshness</strong></td>
    <td>Real-time extraction from live website</td>
  </tr>
</table>

---

## Best Practices

### For Optimal Results

<ul>
  <li>✓ Use <strong>residential proxies</strong> for higher success rates</li>
  <li>✓ Enable <code>collectDetails</code> for comprehensive data</li>
  <li>✓ Set reasonable <code>results_wanted</code> limits (50-200 per run)</li>
  <li>✓ Schedule runs during off-peak hours for better performance</li>
  <li>✓ Export to <strong>JSON</strong> for programmatic use or <strong>CSV</strong> for analysis</li>
</ul>

### Compliance & Ethics

<blockquote>
  <strong>Important:</strong> This scraper extracts publicly available information only. Ensure your use case complies with:
  <ul>
    <li>Oladoc.com Terms of Service</li>
    <li>Local data protection regulations (PECA, GDPR, etc.)</li>
    <li>Ethical data usage guidelines</li>
  </ul>
  Always use scraped data responsibly and respect privacy regulations.
</blockquote>

---

## Troubleshooting

### Common Issues

<details>
<summary><strong>No results returned</strong></summary>
<ul>
  <li>Verify specialty and city names are correct (lowercase, no spaces)</li>
  <li>Check if the combination exists on Oladoc.com</li>
  <li>Try using <code>startUrl</code> parameter with a direct link</li>
</ul>
</details>

<details>
<summary><strong>Incomplete data in results</strong></summary>
<ul>
  <li>Enable <code>collectDetails: true</code> for full profiles</li>
  <li>Some doctors may have limited public information</li>
  <li>Increase timeout settings if data is missing</li>
</ul>
</details>

<details>
<summary><strong>Scraper timing out</strong></summary>
<ul>
  <li>Reduce <code>results_wanted</code> or <code>max_pages</code></li>
  <li>Enable proxy configuration for better reliability</li>
  <li>Check Apify platform status for any outages</li>
</ul>
</details>

<details>
<summary><strong>Rate limiting or blocking</strong></summary>
<ul>
  <li>Use Apify residential proxies</li>
  <li>Reduce concurrency in advanced settings</li>
  <li>Add delays between requests if needed</li>
</ul>
</details>

---

## Supported Specialties

<details>
<summary><strong>View all supported medical specialties</strong></summary>

<ul>
  <li>Dermatologist / Skin Specialist</li>
  <li>Cardiologist / Heart Specialist</li>
  <li>Pediatrician / Child Specialist</li>
  <li>Gynecologist / Obstetrician</li>
  <li>Orthopedic Surgeon</li>
  <li>Neurologist</li>
  <li>Psychiatrist</li>
  <li>General Physician</li>
  <li>Dentist / Dental Surgeon</li>
  <li>ENT Specialist</li>
  <li>Urologist</li>
  <li>Gastroenterologist</li>
  <li>Pulmonologist</li>
  <li>Endocrinologist</li>
  <li>Ophthalmologist / Eye Specialist</li>
  <li>Nephrologist</li>
  <li>Oncologist</li>
  <li>And 100+ more specialties</li>
</ul>
</details>

---

## Supported Cities

<p>
  <strong>Major Cities:</strong> Lahore • Karachi • Islamabad • Rawalpindi • Faisalabad • Multan • Peshawar • Quetta • Sialkot • Gujranwala
</p>

<p>
  <em>And 50+ additional cities across Pakistan</em>
</p>

---

## Pricing

This actor runs on the Apify platform with usage-based pricing:

<ul>
  <li><strong>Free tier:</strong> $5 of platform credits per month</li>
  <li><strong>Cost:</strong> ~$0.02-$0.05 per 100 doctors (with details)</li>
  <li><strong>Typical run:</strong> 50 doctors = ~$0.01-$0.025</li>
</ul>

<p>
  <a href="https://apify.com/pricing">View full Apify pricing details →</a>
</p>

---

## Technical Details

<table>
  <tr>
    <td><strong>Extraction Method</strong></td>
    <td>JSON API (priority) + HTML parsing (fallback)</td>
  </tr>
  <tr>
    <td><strong>JavaScript Runtime</strong></td>
    <td>Node.js 22</td>
  </tr>
  <tr>
    <td><strong>Browser Required</strong></td>
    <td>No - HTTP requests only</td>
  </tr>
  <tr>
    <td><strong>Memory Usage</strong></td>
    <td>~512 MB average</td>
  </tr>
  <tr>
    <td><strong>Timeout</strong></td>
    <td>90 seconds per page</td>
  </tr>
</table>

---

## Updates & Changelog

<ul>
  <li><strong>v1.0.0</strong> - Initial release with JSON API priority and comprehensive profile extraction</li>
</ul>

---

## Support & Feedback

<p>
  Need help or have suggestions? We're here to help!
</p>

<ul>
  <li>📧 <strong>Email Support:</strong> Contact through Apify Console</li>
  <li>💬 <strong>Community:</strong> <a href="https://discord.com/invite/jyEM2PRvMU">Join Apify Discord</a></li>
  <li>🐛 <strong>Issues:</strong> Report bugs via actor feedback form</li>
  <li>⭐ <strong>Feature Requests:</strong> Submit through actor page</li>
</ul>

---

## Related Actors

<ul>
  <li><strong>Healthcare Scraper</strong> - Extract data from multiple healthcare platforms</li>
  <li><strong>Medical Directory Builder</strong> - Aggregate doctor data from various sources</li>
  <li><strong>Appointment Aggregator</strong> - Collect availability and booking information</li>
</ul>

---

## License & Terms

<p>
  This actor is provided as-is for extracting publicly available data from Oladoc.com. Users are responsible for ensuring their usage complies with all applicable laws and the target website's terms of service.
</p>

<p>
  <strong>Disclaimer:</strong> This is an independent tool and is not affiliated with, endorsed by, or connected to Oladoc.com or its parent company.
</p>

---

<p align="center">
  <strong>Built with ❤️ for the Apify community</strong>
</p>

<p align="center">
  <em>Star this actor if you find it useful!</em>
</p>
