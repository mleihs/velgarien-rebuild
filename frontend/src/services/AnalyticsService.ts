declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const CONSENT_KEY = 'analytics-consent';

class AnalyticsService {
  private _initialized = false;
  private _measurementId: string;

  constructor() {
    this._measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID ?? '';
  }

  /** Load gtag.js and configure GA4 with consent mode v2. */
  init(): void {
    if (this._initialized || !this._measurementId) return;
    this._initialized = true;

    // Consent mode v2 defaults (GDPR-safe: denied until user accepts)
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    // Restore previous consent choice
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }

    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this._measurementId}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', this._measurementId, {
      send_page_view: false,
    });
  }

  /** Send a manual page_view event (called on SPA route changes). */
  trackPageView(path: string, title: string): void {
    if (!this._initialized || !this._measurementId) return;
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }

  /** Grant analytics consent and persist the choice. */
  grantConsent(): void {
    localStorage.setItem(CONSENT_KEY, 'granted');
    if (this._initialized) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  }

  /** Revoke analytics consent and persist the choice. */
  revokeConsent(): void {
    localStorage.setItem(CONSENT_KEY, 'denied');
    if (this._initialized) {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  }

  /** Check if the user has made a consent choice. */
  hasConsentChoice(): boolean {
    return localStorage.getItem(CONSENT_KEY) !== null;
  }
}

export const analyticsService = new AnalyticsService();
