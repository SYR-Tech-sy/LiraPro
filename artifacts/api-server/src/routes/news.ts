import { Router, type IRouter } from "express";

const router: IRouter = Router();

const GNEWS_API_KEY = "7b8987fc5e5c86301eaeb7513e072fca";
const GNEWS_BASE = "https://gnews.io/api/v4";

const DEFAULT_QUERIES = [
  "سعر الدولار سوريا",
  "الليرة السورية اقتصاد",
  "أسعار الذهب سوريا",
  "سعر الصرف سوريا",
  "اقتصاد سوريا أخبار",
];

interface GNewsArticle {
  title?: string;
  description?: string;
  content?: string;
  source?: { name?: string };
  publishedAt?: string;
  url?: string;
  image?: string;
}

interface GNewsResponse {
  articles?: GNewsArticle[];
}

let cachedNews: ReturnType<typeof mapArticles> = [];
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000;
let queryIndex = 0;

function getFromDate(): string {
  const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

async function fetchGNews(query: string, max = 8, lang = 'ar'): Promise<ReturnType<typeof mapArticles>> {
  try {
    const from = getFromDate();
    const url = `${GNEWS_BASE}/search?q=${encodeURIComponent(query)}&lang=${lang}&max=${max}&sortby=publishedAt&from=${from}&token=${GNEWS_API_KEY}`;
    const res = await fetch(url, { headers: { "User-Agent": "SYR-SYP/1.0" } });
    if (!res.ok) return [];
    const data = await res.json() as GNewsResponse;
    return mapArticles(data.articles || []);
  } catch {
    return [];
  }
}

function categorize(title: string, summary: string): string {
  const text = title + ' ' + summary;
  if (/ذهب|فضة|معدن|أوقية/.test(text)) return 'gold';
  if (/كريبتو|بيتكوين|إيثير|عملة رقمية|تشفير/.test(text)) return 'crypto';
  if (/دولار|يورو|ليرة|صرف|عملة/.test(text)) return 'currency';
  return 'economy';
}

function mapArticles(articles: GNewsArticle[]) {
  return articles
    .filter(a => a.title && a.title.length > 10)
    .map((a, i) => ({
      id: `gnews-${Date.now()}-${i}`,
      title: a.title || "",
      summary: a.description || a.content?.substring(0, 200) || "",
      source: a.source?.name || "أخبار",
      publishedAt: a.publishedAt || new Date().toISOString(),
      category: categorize(a.title || '', a.description || ''),
      url: a.url || "",
      image: a.image || "",
    }));
}

router.get("/news", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (q) {
    const articles = await fetchGNews(q, 10);
    res.json(articles);
    return;
  }

  const now = Date.now();
  if (cachedNews.length > 0 && now - cacheTime < CACHE_TTL) {
    res.json(cachedNews);
    return;
  }

  const startIdx = queryIndex % DEFAULT_QUERIES.length;
  queryIndex++;

  let articles: ReturnType<typeof mapArticles> = [];
  for (let i = 0; i < DEFAULT_QUERIES.length; i++) {
    const query = DEFAULT_QUERIES[(startIdx + i) % DEFAULT_QUERIES.length];
    articles = await fetchGNews(query, 8);
    if (articles.length > 0) break;
  }

  if (articles.length > 0) {
    const seen = new Set<string>();
    const deduped = articles.filter(a => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });
    cachedNews = deduped;
    cacheTime = now;
    res.json(deduped);
    return;
  }

  res.json([]);
});

export default router;
