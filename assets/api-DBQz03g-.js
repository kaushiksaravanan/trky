import{t as e}from"./createLucideIcon-C5DqQxtk.js";var t=e(`wifi`,[[`path`,{d:`M12 20h.01`,key:`zekei9`}],[`path`,{d:`M2 8.82a15 15 0 0 1 20 0`,key:`dnpr2z`}],[`path`,{d:`M5 12.859a10 10 0 0 1 14 0`,key:`1x1e6c`}],[`path`,{d:`M8.5 16.429a5 5 0 0 1 7 0`,key:`1bycff`}]]),n=600*1e3,r=new Map;function i(e){let t=r.get(e);return t&&Date.now()-t.ts<n?t.data:null}function a(e,t){if(r.set(e,{data:t,ts:Date.now()}),r.size>50){let e=[...r.entries()].sort((e,t)=>e[1].ts-t[1].ts)[0];e&&r.delete(e[0])}}var o=`https://graphql.anilist.co`,s=`
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
`;async function c(e,t={}){let n=`anilist:${JSON.stringify({query:e.trim(),variables:t})}`,r=i(n);if(r)return r;let s=await fetch(o,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({query:e,variables:t})});if(!s.ok)throw Error(`AniList ${s.status}`);let c=await s.json();if(c.errors)throw Error(c.errors[0]?.message||`AniList error`);return a(n,c.data),c.data}function l(e){return{id:`anilist-${e.id}`,externalId:e.id,source:`anilist`,category:`anime`,title:e.title?.english||e.title?.romaji||`Unknown`,subtitle:e.title?.romaji===(e.title?.english||e.title?.romaji)?``:e.title?.romaji,cover:e.coverImage?.large||``,thumbnail:e.bannerImage||e.coverImage?.large||``,plot:e.description?.replace(/<[^>]+>/g,``).slice(0,300)||``,rating:e.averageScore?+(e.averageScore/10).toFixed(1):0,episodes:e.episodes||0,year:e.seasonYear||0,genres:e.genres?.slice(0,4)||[],isNew:e.status===`RELEASING`,platform:`AniList`,siteUrl:e.siteUrl,nextEpisode:e.nextAiringEpisode?{episode:e.nextAiringEpisode.episode,airingAt:new Date(e.nextAiringEpisode.airingAt*1e3).toISOString()}:null}}async function u(e=1,t=15){return(await c(`
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${s} }
      }
    }
  `,{page:e,perPage:t})).Page.media.map(l)}async function d(e=1,t=15){let n=new Date,r=n.getMonth(),i=r<3?`WINTER`:r<6?`SPRING`:r<9?`SUMMER`:`FALL`,a=n.getFullYear();return(await c(`
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) { ${s} }
      }
    }
  `,{page:e,perPage:t,season:i,seasonYear:a})).Page.media.map(l)}async function f(e,t=10){return e.trim()?(await c(`
    query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) { ${s} }
      }
    }
  `,{search:e,perPage:t})).Page.media.map(l):[]}var p=`https://openlibrary.org`;function m(e){let t=e.cover_i||e.cover_id;return{id:`ol-${e.key?.replace(`/works/`,``)||e.cover_edition_key||Math.random()}`,externalId:e.key,source:`openlibrary`,category:`books`,title:e.title||`Unknown`,subtitle:e.author_name?.[0]||``,cover:t?`https://covers.openlibrary.org/b/id/${t}-M.jpg`:``,thumbnail:t?`https://covers.openlibrary.org/b/id/${t}-L.jpg`:``,plot:e.first_sentence?.[0]||``,rating:e.ratings_average?+e.ratings_average.toFixed(1):0,year:e.first_publish_year||0,genres:e.subject?.slice(0,4)||[],isNew:e.first_publish_year>=new Date().getFullYear()-1,platform:`Open Library`,siteUrl:e.key?`https://openlibrary.org${e.key}`:null,pageCount:e.number_of_pages_median||0,editionCount:e.edition_count||0}}async function h(e){let t=`ol:${e}`,n=i(t);if(n)return n;let r=await fetch(`${p}${e}`,{headers:{"User-Agent":`trky/1.0 (https://github.com/kaushiksaravanan/trky)`}});if(!r.ok)throw Error(`OpenLibrary ${r.status}`);let o=await r.json();return a(t,o),o}async function g(e=15){return((await h(`/trending/daily.json?limit=${e}`)).works||[]).map(m)}async function _(e,t=10){return e.trim()?((await h(`/search.json?q=${encodeURIComponent(e)}&limit=${t}&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,subject,first_sentence,number_of_pages_median,edition_count`)).docs||[]).map(m):[]}async function v(e,t=8){if(!e.trim())return[];let n=await Promise.allSettled([f(e,t),_(e,t)]),r=n[0].status===`fulfilled`?n[0].value:[],i=n[1].status===`fulfilled`?n[1].value:[];return[...r,...i]}export{t as a,v as i,u as n,g as r,d as t};