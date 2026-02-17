import { z } from 'zod';

// --- City ---

export const cityCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  layout_type: z.string().optional(),
  description: z.string().optional(),
  population: z.number().int().min(0).default(0),
  map_center_lat: z.number().optional(),
  map_center_lng: z.number().optional(),
  map_default_zoom: z.number().int().min(1).max(20).default(12),
});

export const cityUpdateSchema = cityCreateSchema.partial();

export type CityCreateData = z.infer<typeof cityCreateSchema>;
export type CityUpdateData = z.infer<typeof cityUpdateSchema>;

// --- Zone ---

export const zoneCreateSchema = z.object({
  city_id: z.string().uuid('City is required'),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  zone_type: z.string().min(1, 'Zone type is required'),
  population_estimate: z.number().int().min(0).default(0),
  security_level: z.string().default('medium'),
  data_source: z.string().default('manual'),
});

export const zoneUpdateSchema = zoneCreateSchema
  .partial()
  .omit({ city_id: true, data_source: true });

export type ZoneCreateData = z.infer<typeof zoneCreateSchema>;
export type ZoneUpdateData = z.infer<typeof zoneUpdateSchema>;

// --- Street ---

export const streetCreateSchema = z.object({
  city_id: z.string().uuid('City is required'),
  zone_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  street_type: z.string().optional(),
  length_km: z.number().min(0).optional(),
});

export const streetUpdateSchema = streetCreateSchema.partial().omit({ city_id: true });

export type StreetCreateData = z.infer<typeof streetCreateSchema>;
export type StreetUpdateData = z.infer<typeof streetUpdateSchema>;
