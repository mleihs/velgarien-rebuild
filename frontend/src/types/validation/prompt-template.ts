import { z } from 'zod';

export const promptTemplateCreateSchema = z.object({
  template_type: z.string().min(1, 'Template type is required'),
  prompt_category: z.string().min(1, 'Category is required'),
  locale: z.string().min(2).max(10).default('en'),
  template_name: z.string().min(1, 'Template name is required').max(255),
  prompt_content: z.string().min(1, 'Prompt content is required'),
  system_prompt: z.string().optional(),
  variables: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().default(false),
        default_value: z.string().optional(),
      }),
    )
    .default([]),
  description: z.string().optional(),
  default_model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().min(1).max(16384).default(2048),
  negative_prompt: z.string().optional(),
});

export const promptTemplateUpdateSchema = promptTemplateCreateSchema.partial();

export type PromptTemplateCreateData = z.infer<typeof promptTemplateCreateSchema>;
export type PromptTemplateUpdateData = z.infer<typeof promptTemplateUpdateSchema>;
