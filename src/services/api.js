// External API services -- all free, no API keys required
// AniList (GraphQL), Jikan (MAL REST), Open Library (Books REST)

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
  // Evict old entries if cache gets too big
  if (cache.size > 50) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

// ==========================================
// AniList GraphQL API (Anime/Manga)
// https://anilist.gitbook.io/anilist-apiv2-docs/
// No API key, CORS-friendly
// ==========================================

const ANILIST_URL = 'https://graphql.anilist.co';

const ANILIST_MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { large }
  bannerImage
  averageScore
  episodes
  status
  season
  seasonYear
  genres
  description(asHtml: false)
  nextAiringEpisode { airingAt episode }
  siteUrl
  format
`;

async function anilistQuery(query, variables = {}) {
  const key = `anilist:${JSON.stringify({ query: query.trim(), variables })}`;
  const cached = getCached(key);
  if (cached) return cached;

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'AniList error');
  setCache(key, json.data);
  return json.data;
}

function normalizeAnilistMedia(m) {
  return {
    id: `anilist-${m.id}`,
    externalId: m.id,
    source: 'anilist',
    category: 'anime',
    title: m.title?.english || m.title?.romaji || 'Unknown',
    subtitle: m.title?.romaji !== (m.title?.english || m.title?.romaji) ? m.title?.romaji : '',
    cover: m.coverImage?.large || '',
    thumbnail: m.bannerImage || m.coverImage?.large || '',
    plot: m.description?.replace(/<[^>]+>/g, '').slice(0, 300) || '',
    rating: m.averageScore ? +(m.averageScore / 10).toFixed(1) : 0,
    episodes: m.episodes || 0,
    year: m.seasonYear || 0,
    genres: m.genres?.slice(0, 4) || [],
    isNew: m.status === 'RELEASING',
    platform: 'AniList',
    siteUrl: m.siteUrl,
    nextEpisode: m.nextAiringEpisode ? {
      episode: m.nextAiringEpisode.episode,
      airingAt: new Date(m.nextAiringEpisode.airingAt * 1000).toISOString(),
    } : null,
  };
}

export async function fetchTrendingAnime(page = 1, perPage = 15) {
  const data = await anilistQuery(`
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${ANILIST_MEDIA_FIELDS} }
      }
    }
  `, { page, perPage });
  return data.Page.media.map(normalizeAnilistMedia);
}

export async function fetchSeasonalAnime(page = 1, perPage = 15) {
  const now = new Date();
  const month = now.getMonth();
  const season = month < 3 ? 'WINTER' : month < 6 ? 'SPRING' : month < 9 ? 'SUMMER' : 'FALL';
  const year = now.getFullYear();
  const data = await anilistQuery(`
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) { ${ANILIST_MEDIA_FIELDS} }
      }
    }
  `, { page, perPage, season, seasonYear: year });
  return data.Page.media.map(normalizeAnilistMedia);
}

export async function searchAnilist(query, perPage = 10) {
  if (!query.trim()) return [];
  const data = await anilistQuery(`
    query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) { ${ANILIST_MEDIA_FIELDS} }
      }
    }
  `, { search: query, perPage });
  return data.Page.media.map(normalizeAnilistMedia);
}

// ==========================================
// Jikan API v4 (MAL data)
// https://docs.api.jikan.moe/
// No API key, CORS-friendly, 3 req/sec
// ==========================================

const JIKAN_URL = 'https://api.jikan.moe/v4';

function normalizeJikanAnime(m) {
  return {
    id: `mal-${m.mal_id}`,
    externalId: m.mal_id,
    source: 'mal',
    category: 'anime',
    title: m.title_english || m.title || 'Unknown',
    subtitle: m.title_japanese || m.title || '',
    cover: m.images?.webp?.large_image_url || m.images?.jpg?.large_image_url || '',
    thumbnail: m.images?.webp?.large_image_url || '',
    plot: m.synopsis?.slice(0, 300) || '',
    rating: m.score || 0,
    episodes: m.episodes || 0,
    year: m.year || (m.aired?.prop?.from?.year) || 0,
    genres: m.genres?.map(g => g.name).slice(0, 4) || [],
    isNew: m.airing || false,
    platform: 'MAL',
    siteUrl: m.url,
    malScore: m.score,
    malRank: m.rank,
  };
}

async function jikanFetch(endpoint) {
  const key = `jikan:${endpoint}`;
  const cached = getCached(key);
  if (cached) return cached;

  const res = await fetch(`${JIKAN_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  const json = await res.json();
  setCache(key, json.data);
  return json.data;
}

export async function fetchTopAnimeMAL(limit = 15) {
  const data = await jikanFetch(`/top/anime?limit=${limit}&sfw=true`);
  return data.map(normalizeJikanAnime);
}

export async function fetchCurrentSeasonMAL(limit = 15) {
  const data = await jikanFetch(`/seasons/now?limit=${limit}&sfw=true`);
  return data.map(normalizeJikanAnime);
}

export async function fetchUpcomingAnimeMAL(limit = 10) {
  const data = await jikanFetch(`/seasons/upcoming?limit=${limit}&sfw=true`);
  return data.map(normalizeJikanAnime);
}

export async function searchJikan(query, limit = 10) {
  if (!query.trim()) return [];
  const data = await jikanFetch(`/anime?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`);
  return data.map(normalizeJikanAnime);
}

// ==========================================
// Open Library API (Books)
// https://openlibrary.org/developers/api
// No API key, CORS-friendly
// ==========================================

const OPENLIBRARY_URL = 'https://openlibrary.org';

function normalizeOpenLibBook(doc) {
  const coverId = doc.cover_i || doc.cover_id;
  return {
    id: `ol-${doc.key?.replace('/works/', '') || doc.cover_edition_key || Math.random()}`,
    externalId: doc.key,
    source: 'openlibrary',
    category: 'books',
    title: doc.title || 'Unknown',
    subtitle: doc.author_name?.[0] || '',
    cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '',
    thumbnail: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : '',
    plot: doc.first_sentence?.[0] || '',
    rating: doc.ratings_average ? +doc.ratings_average.toFixed(1) : 0,
    year: doc.first_publish_year || 0,
    genres: doc.subject?.slice(0, 4) || [],
    isNew: doc.first_publish_year >= new Date().getFullYear() - 1,
    platform: 'Open Library',
    siteUrl: doc.key ? `https://openlibrary.org${doc.key}` : null,
    pageCount: doc.number_of_pages_median || 0,
    editionCount: doc.edition_count || 0,
  };
}

async function openLibFetch(endpoint) {
  const key = `ol:${endpoint}`;
  const cached = getCached(key);
  if (cached) return cached;

  const res = await fetch(`${OPENLIBRARY_URL}${endpoint}`, {
    headers: { 'User-Agent': 'trky/1.0 (https://github.com/kaushiksaravanan/trky)' },
  });
  if (!res.ok) throw new Error(`OpenLibrary ${res.status}`);
  const json = await res.json();
  setCache(key, json);
  return json;
}

export async function fetchTrendingBooks(limit = 15) {
  const json = await openLibFetch(`/trending/daily.json?limit=${limit}`);
  return (json.works || []).map(normalizeOpenLibBook);
}

export async function searchOpenLibrary(query, limit = 10) {
  if (!query.trim()) return [];
  const json = await openLibFetch(`/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,subject,first_sentence,number_of_pages_median,edition_count`);
  return (json.docs || []).map(normalizeOpenLibBook);
}

export async function fetchBooksBySubject(subject = 'fantasy', limit = 10) {
  const json = await openLibFetch(`/subjects/${encodeURIComponent(subject)}.json?limit=${limit}`);
  return (json.works || []).map(w => ({
    ...normalizeOpenLibBook(w),
    cover: w.cover_id ? `https://covers.openlibrary.org/b/id/${w.cover_id}-M.jpg` : '',
  }));
}

// ==========================================
// Unified search across all sources
// ==========================================

export async function searchAll(query, limit = 8) {
  if (!query.trim()) return [];
  const results = await Promise.allSettled([
    searchAnilist(query, limit),
    searchOpenLibrary(query, limit),
  ]);
  const anime = results[0].status === 'fulfilled' ? results[0].value : [];
  const books = results[1].status === 'fulfilled' ? results[1].value : [];
  return [...anime, ...books];
}
