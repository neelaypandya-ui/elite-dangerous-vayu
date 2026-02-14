/**
 * GalNet news reader service.
 * Fetches news articles from the GalNet RSS/API.
 */

interface GalnetArticle {
  id: string;
  title: string;
  body: string;
  date: string;
  image: string | null;
}

class GalnetService {
  private articles: GalnetArticle[] = [];
  private lastFetch = 0;
  private fetchInterval = 30 * 60 * 1000; // 30 minutes

  async getArticles(limit = 20): Promise<GalnetArticle[]> {
    if (Date.now() - this.lastFetch > this.fetchInterval || this.articles.length === 0) {
      await this.fetchArticles();
    }
    return this.articles.slice(0, limit);
  }

  async getArticle(id: string): Promise<GalnetArticle | null> {
    const articles = await this.getArticles(100);
    return articles.find((a) => a.id === id) ?? null;
  }

  private async fetchArticles(): Promise<void> {
    try {
      // GalNet Community API
      const resp = await fetch('https://cms.zaonce.net/en-GB/jsonapi/node/galnet_article?sort=-published_at&page[limit]=20', {
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        console.warn('[GalNet] API returned', resp.status);
        return;
      }

      const json = await resp.json() as any;
      const data = json.data as Array<any> || [];

      this.articles = data.map((item: any) => ({
        id: item.id || '',
        title: item.attributes?.title || 'Untitled',
        body: item.attributes?.body?.value || item.attributes?.body?.processed || '',
        date: item.attributes?.published_at || item.attributes?.created || '',
        image: item.attributes?.field_galnet_image || null,
      }));

      this.lastFetch = Date.now();
      console.log(`[GalNet] Fetched ${this.articles.length} articles`);
    } catch (err) {
      console.warn('[GalNet] Failed to fetch articles:', err instanceof Error ? err.message : err);
    }
  }

  async refresh(): Promise<number> {
    this.lastFetch = 0;
    await this.fetchArticles();
    return this.articles.length;
  }
}

export const galnetService = new GalnetService();
