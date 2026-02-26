const SITE_NAME = 'metaverse.center';
const DEFAULT_TITLE = 'metaverse.center — a worldbuilding framework';
const DEFAULT_DESCRIPTION =
  'Build and explore simulated worlds. Create agents, buildings, events, and social dynamics in interconnected shards of reality.';
const BASE_URL = 'https://metaverse.center';
const DEFAULT_OG_IMAGE =
  'https://bffjoupddfjaljqrwqck.supabase.co/storage/v1/object/public/simulation.assets/platform/dashboard-hero.webp';

class SeoService {
  /** Set page title from parts: ['Agents', 'Station Null'] → "Agents — Station Null | metaverse.center" */
  setTitle(parts: string[]): void {
    if (parts.length === 0) {
      document.title = DEFAULT_TITLE;
    } else {
      document.title = `${parts.join(' — ')} | ${SITE_NAME}`;
    }
    this._setMetaProperty('og:title', document.title);
    this._setMeta('twitter:title', document.title);
  }

  setDescription(text: string): void {
    this._setMeta('description', text);
    this._setMetaProperty('og:description', text);
    this._setMeta('twitter:description', text);
  }

  setCanonical(path: string): void {
    const url = `${BASE_URL}${path}`;
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (el) {
      el.href = url;
    }
    this._setMetaProperty('og:url', url);
  }

  setOgImage(url: string): void {
    this._setMetaProperty('og:image', url);
    this._setMeta('twitter:image', url);
  }

  /** Reset all SEO tags to defaults (for dashboard/homepage). */
  reset(): void {
    document.title = DEFAULT_TITLE;
    this._setMeta('description', DEFAULT_DESCRIPTION);
    this._setMetaProperty('og:title', DEFAULT_TITLE);
    this._setMetaProperty('og:description', DEFAULT_DESCRIPTION);
    this._setMetaProperty('og:url', `${BASE_URL}/`);
    this._setMetaProperty('og:image', DEFAULT_OG_IMAGE);
    this._setMeta('twitter:title', DEFAULT_TITLE);
    this._setMeta('twitter:description', DEFAULT_DESCRIPTION);
    this._setMeta('twitter:image', DEFAULT_OG_IMAGE);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      canonical.href = `${BASE_URL}/`;
    }
  }

  private _setMeta(name: string, content: string): void {
    let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = content;
  }

  private _setMetaProperty(property: string, content: string): void {
    let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.content = content;
  }
}

export const seoService = new SeoService();
