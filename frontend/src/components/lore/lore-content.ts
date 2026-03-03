import type { LoreSection } from '../platform/LoreScroll.js';
import { getCiteDesDamesLoreSections } from './content/cite-des-dames-lore.js';
import { getGaslitReachLoreSections } from './content/gaslit-reach-lore.js';
import { getSperanzaLoreSections } from './content/speranza-lore.js';
import { getStationNullLoreSections } from './content/station-null-lore.js';
import { getVelgarienLoreSections } from './content/velgarien-lore.js';

const registry: Record<string, () => LoreSection[]> = {
  velgarien: getVelgarienLoreSections,
  'the-gaslit-reach': getGaslitReachLoreSections,
  'station-null': getStationNullLoreSections,
  speranza: getSperanzaLoreSections,
  'cite-des-dames': getCiteDesDamesLoreSections,
};

export function getLoreSectionsForSlug(slug: string): LoreSection[] | null {
  const fn = registry[slug];
  return fn ? fn() : null;
}
