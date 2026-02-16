import { localeService } from './locale-service.js';

class FormatService {
  private get _locale(): string {
    return localeService.currentLocale;
  }

  formatDate(date: Date | string, style: 'short' | 'medium' | 'long' = 'medium'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(this._locale, { dateStyle: style }).format(d);
  }

  formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(this._locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(this._locale).format(value);
  }

  formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const rtf = new Intl.RelativeTimeFormat(this._locale, { numeric: 'auto' });
    const diffMs = d.getTime() - Date.now();
    const diffMins = Math.round(diffMs / 60000);
    if (Math.abs(diffMins) < 1) return rtf.format(0, 'second');
    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
    const diffHours = Math.round(diffMs / 3600000);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    return rtf.format(Math.round(diffMs / 86400000), 'day');
  }
}

export const formatService = new FormatService();
