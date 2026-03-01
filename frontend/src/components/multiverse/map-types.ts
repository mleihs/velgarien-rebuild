/** Types for the Cartographer's Map force-directed graph. */

import type { ScoreDimensions } from '../../types/index.js';

export interface MapNodeData {
  id: string;
  name: string;
  slug: string;
  theme: string;
  description?: string;
  bannerUrl?: string;
  agentCount: number;
  buildingCount: number;
  eventCount: number;
  echoCount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  /** 'template' | 'game_instance' — archived are excluded from map data */
  simulationType?: string;
  /** For game instances: the epoch this instance belongs to */
  epochId?: string;
  /** For game instances: the original template simulation */
  sourceTemplateId?: string;
  /** For game instances: current epoch phase (lobby/foundation/competition/reckoning/completed) */
  epochStatus?: string;
  /** Active game instance count (template nodes only) */
  activeInstanceCount?: number;
  /** Score dimensions (game instance nodes only) */
  scoreDimensions?: ScoreDimensions;
  /** Sparkline data — last N composite scores (template nodes only) */
  sparklineScores?: number[];
}

export interface MapEdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: string;
  bleedVectors: string[];
  strength: number;
  description?: string;
  /** Number of active operatives on this edge */
  operativeHeat?: number;
  /** Types of operatives currently on this edge */
  operativeTypes?: string[];
}

export interface MapEmbassyEdge {
  id: string;
  sourceSimId: string;
  targetSimId: string;
  buildingAName: string;
  buildingBName: string;
}

export interface ForceConfig {
  repulsion: number;
  attraction: number;
  centerForce: number;
  damping: number;
  minDistance: number;
  nodeRadius: number;
}
