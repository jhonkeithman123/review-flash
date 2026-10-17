import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

// Custom Performance Metrics
const pageDuration = new Trend("page_duration_ms");
const sitemapDuration = new Trend("sitemap_duration_ms");
const edgeCacheHits = new Counter("edge_cache_hits");
const wafChallenges = new Counter("vercel_waf_challenges");

// Target URL configurable via -e TARGET_URL=https://...
const BASE_URL = __ENV.TARGET_URL || "https://review-flash.vercel.app";
// Optional Vercel Protection Bypass secret header
const BYPASS_TOKEN = __ENV.VERCEL_BYPASS_TOKEN || "";

export const options = {
  stages: [
    { duration: "10s", target: 10 }, // Stage 1: Warm-up (10 VUs)
    { duration: "30s", target: 35 }, // Stage 2: Balanced load (35 VUs)
    { duration: "30s", target: 50 }, // Stage 3: Peak concurrency (50 VUs)
    { duration: "10s", target: 0 },  // Stage 4: Ramp down
  ],
  thresholds: {
    // 95% of Next.js requests must complete under 500ms
    http_req_duration: ["p(95)<500"],
    // Error rate must stay below 5% (allowing for WAF challenges)
    http_req_failed: ["rate<0.05"],
    page_duration_ms: ["p(95)<450"],
  },
};

// Common request headers
function getHeaders(extraHeaders = {}) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    ...extraHeaders,
  };

  if (BYPASS_TOKEN) {
    headers["x-vercel-protection-bypass"] = BYPASS_TOKEN;
  }

  return headers;
}

export default function () {
  const rand = Math.random();

  if (rand < 0.45) {
    // 1. Home / Study Hub Page (45% of traffic)
    group("Home Study Hub", () => {
      const res = http.get(`${BASE_URL}/`, { headers: getHeaders() });
      pageDuration.add(res.timings.duration);

      const isChallenged = res.status === 403 && (res.headers["X-Vercel-Mitigated"] === "challenge" || res.body.includes("challenge"));
      if (isChallenged) {
        wafChallenges.add(1);
      }

      const cacheHeader = res.headers["X-Vercel-Cache"] || res.headers["x-vercel-cache"] || "";
      if (cacheHeader.includes("HIT") || cacheHeader.includes("PRERENDER")) {
        edgeCacheHits.add(1);
      }

      check(res, {
        "home status is 200": (r) => r.status === 200,
        "not challenged by WAF": (r) => r.status !== 403,
        "latency < 500ms": (r) => r.timings.duration < 500,
      });
    });
  } else if (rand < 0.75) {
    // 2. Decks Page (30% of traffic)
    group("Decks Catalog", () => {
      const res = http.get(`${BASE_URL}/decks`, { headers: getHeaders() });
      pageDuration.add(res.timings.duration);

      check(res, {
        "decks status is 200": (r) => r.status === 200,
        "not challenged by WAF": (r) => r.status !== 403,
      });
    });
  } else if (rand < 0.90) {
    // 3. Dynamic Sitemap (15% of traffic)
    group("SEO Sitemap", () => {
      const res = http.get(`${BASE_URL}/sitemap.xml`, {
        headers: getHeaders({ "Accept": "application/xml, text/xml" }),
      });

      sitemapDuration.add(res.timings.duration);

      check(res, {
        "sitemap status is 200": (r) => r.status === 200,
        "not challenged by WAF": (r) => r.status !== 403,
      });
    });
  } else {
    // 4. Crawler Robots.txt (10% of traffic)
    group("SEO Robots.txt", () => {
      const res = http.get(`${BASE_URL}/robots.txt`, { headers: getHeaders() });

      check(res, {
        "robots status is 200": (r) => r.status === 200,
        "not challenged by WAF": (r) => r.status !== 403,
      });
    });
  }

  // Realistic user pacing between page interactions (0.6s - 1.2s)
  sleep(0.6 + Math.random() * 0.6);
}

// Generate interactive HTML dashboard and colorized terminal summary
export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
