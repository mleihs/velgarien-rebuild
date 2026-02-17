import { z } from 'zod';

export const campaignCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  campaign_type: z.string().optional(),
  target_demographic: z.string().optional(),
  urgency_level: z.string().optional(),
  source_trend_id: z.string().uuid().optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

export type CampaignCreateData = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateData = z.infer<typeof campaignUpdateSchema>;
