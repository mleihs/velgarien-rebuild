import { describe, expect, it } from 'vitest';
import {
  agentCreateSchema,
  agentUpdateSchema,
  buildingCreateSchema,
  buildingUpdateSchema,
  eventCreateSchema,
  eventUpdateSchema,
  filterSchema,
  paginationSchema,
  simulationCreateSchema,
  uuidSchema,
} from '../src/types/validation/index.js';

// ---------------------------------------------------------------------------
// Common schemas
// ---------------------------------------------------------------------------

describe('paginationSchema', () => {
  it('should accept valid pagination params', () => {
    const result = paginationSchema.safeParse({ limit: 10, offset: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(0);
    }
  });

  it('should apply defaults when fields are omitted', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
      expect(result.data.offset).toBe(0);
    }
  });

  it('should reject limit below 1', () => {
    const result = paginationSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit above 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('should reject negative offset', () => {
    const result = paginationSchema.safeParse({ offset: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer limit', () => {
    const result = paginationSchema.safeParse({ limit: 10.5 });
    expect(result.success).toBe(false);
  });
});

describe('filterSchema', () => {
  it('should accept valid filter params', () => {
    const result = filterSchema.safeParse({
      search: 'hello',
      filters: { status: 'active' },
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (all fields optional)', () => {
    const result = filterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept search without filters', () => {
    const result = filterSchema.safeParse({ search: 'query' });
    expect(result.success).toBe(true);
  });
});

describe('uuidSchema', () => {
  it('should accept a valid UUID', () => {
    const result = uuidSchema.safeParse('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(result.success).toBe(true);
  });

  it('should reject an invalid UUID', () => {
    const result = uuidSchema.safeParse('not-a-uuid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid UUID format');
    }
  });

  it('should reject an empty string', () => {
    const result = uuidSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Agent schemas
// ---------------------------------------------------------------------------

describe('agentCreateSchema', () => {
  it('should accept valid agent create data', () => {
    const result = agentCreateSchema.safeParse({
      name: 'Agent Smith',
      system: 'Regime loyal',
      character: 'Stern and unyielding',
      background: 'Former military officer',
      gender: 'male',
      primary_profession: 'soldier',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Agent Smith');
      expect(result.data.data_source).toBe('manual');
    }
  });

  it('should accept minimal data with only name', () => {
    const result = agentCreateSchema.safeParse({ name: 'Minimal Agent' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data_source).toBe('manual');
    }
  });

  it('should reject empty name', () => {
    const result = agentCreateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing name', () => {
    const result = agentCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding 255 characters', () => {
    const result = agentCreateSchema.safeParse({ name: 'A'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('should accept valid portrait_image_url', () => {
    const result = agentCreateSchema.safeParse({
      name: 'Agent',
      portrait_image_url: 'https://example.com/portrait.png',
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty string for portrait_image_url', () => {
    const result = agentCreateSchema.safeParse({
      name: 'Agent',
      portrait_image_url: '',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid portrait_image_url', () => {
    const result = agentCreateSchema.safeParse({
      name: 'Agent',
      portrait_image_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('agentUpdateSchema', () => {
  it('should accept partial update with just name', () => {
    const result = agentUpdateSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (all fields optional in update)', () => {
    const result = agentUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should not include data_source (omitted from update)', () => {
    const result = agentUpdateSchema.safeParse({ data_source: 'generated' });
    expect(result.success).toBe(true);
    if (result.success) {
      // data_source should be stripped since it's omitted from the schema
      expect('data_source' in result.data).toBe(false);
    }
  });

  it('should still validate name constraints when provided', () => {
    const result = agentUpdateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Building schemas
// ---------------------------------------------------------------------------

describe('buildingCreateSchema', () => {
  it('should accept valid building create data', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Ministerium der Wahrheit',
      building_type: 'government',
      description: 'The central propaganda ministry',
      population_capacity: 500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Ministerium der Wahrheit');
      expect(result.data.data_source).toBe('manual');
    }
  });

  it('should accept minimal data with name and building_type', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Basic Building',
      building_type: 'residential',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.population_capacity).toBe(0);
    }
  });

  it('should reject missing name', () => {
    const result = buildingCreateSchema.safeParse({ building_type: 'residential' });
    expect(result.success).toBe(false);
  });

  it('should reject missing building_type', () => {
    const result = buildingCreateSchema.safeParse({ name: 'No Type' });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = buildingCreateSchema.safeParse({ name: '', building_type: 'residential' });
    expect(result.success).toBe(false);
  });

  it('should reject empty building_type', () => {
    const result = buildingCreateSchema.safeParse({ name: 'Building', building_type: '' });
    expect(result.success).toBe(false);
  });

  it('should reject negative population_capacity', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      population_capacity: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid location object', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      location: { lat: 52.52, lng: 13.405 },
    });
    expect(result.success).toBe(true);
  });

  it('should accept location with optional address', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      location: { lat: 52.52, lng: 13.405, address: 'Unter den Linden 1' },
    });
    expect(result.success).toBe(true);
  });

  it('should reject location missing lat or lng', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      location: { lat: 52.52 },
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid UUID for city_id', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      city_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID for city_id', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      city_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept empty string for image_url', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      image_url: '',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid image_url', () => {
    const result = buildingCreateSchema.safeParse({
      name: 'Building',
      building_type: 'residential',
      image_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('buildingUpdateSchema', () => {
  it('should accept partial update', () => {
    const result = buildingUpdateSchema.safeParse({ name: 'Renamed Building' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object', () => {
    const result = buildingUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should not include data_source', () => {
    const result = buildingUpdateSchema.safeParse({ data_source: 'generated' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('data_source' in result.data).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Event schemas
// ---------------------------------------------------------------------------

describe('eventCreateSchema', () => {
  it('should accept valid event create data', () => {
    const result = eventCreateSchema.safeParse({
      title: 'Regime Announcement',
      event_type: 'political',
      description: 'A major announcement from the regime',
      impact_level: 8,
      tags: ['politics', 'announcement'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Regime Announcement');
      expect(result.data.data_source).toBe('manual');
    }
  });

  it('should accept minimal data with only title', () => {
    const result = eventCreateSchema.safeParse({ title: 'Simple Event' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.impact_level).toBe(1);
      expect(result.data.tags).toEqual([]);
    }
  });

  it('should reject empty title', () => {
    const result = eventCreateSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing title', () => {
    const result = eventCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject title exceeding 500 characters', () => {
    const result = eventCreateSchema.safeParse({ title: 'T'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('should reject impact_level below 1', () => {
    const result = eventCreateSchema.safeParse({ title: 'Event', impact_level: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject impact_level above 10', () => {
    const result = eventCreateSchema.safeParse({ title: 'Event', impact_level: 11 });
    expect(result.success).toBe(false);
  });

  it('should accept valid datetime for occurred_at', () => {
    const result = eventCreateSchema.safeParse({
      title: 'Event',
      occurred_at: '2026-01-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid datetime for occurred_at', () => {
    const result = eventCreateSchema.safeParse({
      title: 'Event',
      occurred_at: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('eventUpdateSchema', () => {
  it('should accept partial update', () => {
    const result = eventUpdateSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object', () => {
    const result = eventUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should not include data_source', () => {
    const result = eventUpdateSchema.safeParse({ data_source: 'generated' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('data_source' in result.data).toBe(false);
    }
  });

  it('should still validate constraints when fields are provided', () => {
    const result = eventUpdateSchema.safeParse({ impact_level: 15 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Simulation schema
// ---------------------------------------------------------------------------

describe('simulationCreateSchema', () => {
  it('should accept valid simulation create data', () => {
    const result = simulationCreateSchema.safeParse({
      name: 'Velgarien',
      slug: 'velgarien',
      description: 'A dystopian world simulation',
      theme: 'dystopian',
      content_locale: 'de',
      additional_locales: ['en', 'fr'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Velgarien');
      expect(result.data.theme).toBe('dystopian');
    }
  });

  it('should accept minimal data with only name', () => {
    const result = simulationCreateSchema.safeParse({ name: 'Minimal Sim' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe('custom');
      expect(result.data.content_locale).toBe('en');
      expect(result.data.additional_locales).toEqual([]);
    }
  });

  it('should reject empty name', () => {
    const result = simulationCreateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing name', () => {
    const result = simulationCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding 255 characters', () => {
    const result = simulationCreateSchema.safeParse({ name: 'S'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('should reject invalid theme', () => {
    const result = simulationCreateSchema.safeParse({ name: 'Sim', theme: 'nonexistent' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid theme values', () => {
    const themes = ['dystopian', 'utopian', 'fantasy', 'scifi', 'historical', 'custom'] as const;
    for (const theme of themes) {
      const result = simulationCreateSchema.safeParse({ name: 'Sim', theme });
      expect(result.success).toBe(true);
    }
  });

  it('should reject slug with uppercase letters', () => {
    const result = simulationCreateSchema.safeParse({ name: 'Sim', slug: 'MySlug' });
    expect(result.success).toBe(false);
  });

  it('should reject slug with spaces', () => {
    const result = simulationCreateSchema.safeParse({ name: 'Sim', slug: 'my slug' });
    expect(result.success).toBe(false);
  });

  it('should accept slug with hyphens and lowercase', () => {
    const result = simulationCreateSchema.safeParse({ name: 'Sim', slug: 'my-simulation-1' });
    expect(result.success).toBe(true);
  });

  it('should reject slug exceeding 100 characters', () => {
    const result = simulationCreateSchema.safeParse({ name: 'Sim', slug: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});
