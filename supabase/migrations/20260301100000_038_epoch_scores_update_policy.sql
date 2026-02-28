-- Migration 038: Add UPDATE policy on epoch_scores
-- Fixes: composite_score normalization in ScoringService._normalize_and_composite()
-- was silently failing because no UPDATE policy existed on epoch_scores.

CREATE POLICY epoch_scores_update ON public.epoch_scores
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);
