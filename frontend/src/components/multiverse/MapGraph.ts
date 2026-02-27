import { localized } from '@lit/localize';
import { css, html, LitElement, nothing, svg, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { EMBASSY_EDGE_COLOR, getGlowColor, getThemeColor } from './map-data.js';
import { initializePositions, simulateTick } from './map-force.js';
import type { MapEdgeData, MapEmbassyEdge, MapNodeData } from './map-types.js';

import './MapTooltip.js';

const NODE_RADIUS = 52;
const LABEL_OFFSET = NODE_RADIUS + 18;

@localized()
@customElement('velg-map-graph')
export class VelgMapGraph extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    svg {
      width: 100%;
      height: 100%;
      cursor: grab;
    }

    svg:active {
      cursor: grabbing;
    }

    /* Edge flow animation */
    .edge-line {
      fill: none;
      stroke-dasharray: 8 6;
      animation: dash-flow 2s linear infinite;
    }

    @keyframes dash-flow {
      to {
        stroke-dashoffset: -28;
      }
    }

    /* Starfield */
    .star {
      fill: #ffffff;
    }

    .star--twinkle {
      animation: star-twinkle 3s ease-in-out infinite;
    }

    @keyframes star-twinkle {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.8; }
    }

    /* Energy pulses on edges */
    .energy-pulse {
      fill: var(--pulse-color, #fff);
      opacity: 0.9;
    }

    /* Node group */
    .node-group {
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .node-group:hover .node-glow {
      opacity: 0.7;
    }

    /* Node breathing glow */
    .node-glow {
      opacity: 0.25;
      transition: opacity 0.3s ease;
      transform-box: fill-box;
      transform-origin: center;
      animation: node-breathe 4s ease-in-out infinite;
    }

    @keyframes node-breathe {
      0%, 100% { opacity: 0.2; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.25); }
    }

    .node-border {
      fill: none;
      stroke-width: 3;
    }

    .node-label {
      font-family: var(--font-brutalist, monospace);
      font-weight: 900;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      fill: var(--color-text-primary, #f0f0f0);
      text-anchor: middle;
      pointer-events: none;
    }

    .node-stat {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      fill: var(--color-text-muted, #777);
      text-anchor: middle;
      pointer-events: none;
    }

    .edge-midpoint {
      font-size: 10px;
      text-anchor: middle;
      dominant-baseline: central;
      pointer-events: none;
    }

    /* Embassy edges: solid glow, distinct from dashed bleed */
    .embassy-edge-line {
      fill: none;
      animation: embassy-pulse 4s ease-in-out infinite;
    }

    @keyframes embassy-pulse {
      0%,
      100% {
        stroke-opacity: 0.6;
      }
      50% {
        stroke-opacity: 1;
      }
    }

    .embassy-edge-label {
      font-family: var(--font-mono, monospace);
      font-size: 8px;
      fill: ${unsafeCSS(EMBASSY_EDGE_COLOR)};
      text-anchor: middle;
      dominant-baseline: central;
      pointer-events: none;
    }
  `;

  @property({ type: Array }) nodes: MapNodeData[] = [];
  @property({ type: Array }) edges: MapEdgeData[] = [];
  @property({ type: Array }) embassyEdges: MapEmbassyEdge[] = [];

  @state() private _viewBox = '0 0 800 600';
  @state() private _tooltipNode: MapNodeData | null = null;
  @state() private _tooltipX = 0;
  @state() private _tooltipY = 0;
  private _width = 800;
  private _height = 600;
  private _panStart: { x: number; y: number; vbx: number; vby: number } | null = null;
  private _vbx = 0;
  private _vby = 0;
  private _zoom = 1;
  private _animFrame = 0;
  private _driftFrame = 0;

  /** Per-node drift targets (computed once after layout settles) */
  private _driftTargets = new Map<string, { dx: number; dy: number; dur: number; phase: number }>();

  /** Pre-generated starfield — fixed random positions so they don't re-roll on render */
  private _stars: { x: number; y: number; r: number; twinkle: boolean; delay: number }[] = [];
  private _starsGenerated = false;

  connectedCallback(): void {
    super.connectedCallback();
    this._handleResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._handleResize);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleResize);
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    if (this._driftFrame) cancelAnimationFrame(this._driftFrame);
  }

  protected firstUpdated(): void {
    this._handleResize();
    this._startSimulation();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('nodes') || changed.has('edges')) {
      this._startSimulation();
    }
  }

  private _handleResize(): void {
    const rect = this.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this._width = rect.width;
      this._height = rect.height;
      this._generateStars();
      this._updateViewBox();
    }
  }

  private _generateStars(): void {
    if (this._starsGenerated) return;
    this._starsGenerated = true;

    const count = 200;
    const w = this._width;
    const h = this._height;
    this._stars = [];

    for (let i = 0; i < count; i++) {
      this._stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3, // 0.3–1.5px
        twinkle: Math.random() < 0.25, // 25% twinkle
        delay: Math.random() * 3, // stagger twinkle phase
      });
    }
  }

  private _updateViewBox(): void {
    const w = this._width / this._zoom;
    const h = this._height / this._zoom;
    this._viewBox = `${this._vbx} ${this._vby} ${w} ${h}`;
  }

  private _startSimulation(): void {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    if (this.nodes.length === 0) return;

    initializePositions(this.nodes, this._width, this._height);
    this._driftTargets.clear();
    if (this._driftFrame) cancelAnimationFrame(this._driftFrame);
    let iterations = 0;

    const tick = () => {
      const energy = simulateTick(this.nodes, this.edges, this._width, this._height);
      iterations++;

      this.requestUpdate();

      if (energy < 0.5 || iterations > 300) {
        this._computeDriftTargets();
        this._startDriftLoop();
        return;
      }
      this._animFrame = requestAnimationFrame(tick);
    };

    this._animFrame = requestAnimationFrame(tick);
  }

  /** Compute drift direction + magnitude for each node toward its neighbors */
  private _computeDriftTargets(): void {
    this._driftTargets.clear();
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const neighbors = this._getConnectedNodes(node.id);
      if (neighbors.length === 0) continue;

      let dx = 0;
      let dy = 0;
      for (const nb of neighbors) {
        dx += nb.x - node.x;
        dy += nb.y - node.y;
      }
      dx = (dx / neighbors.length) * 0.48;
      dy = (dy / neighbors.length) * 0.48;

      this._driftTargets.set(node.id, {
        dx,
        dy,
        dur: 5 + i * 0.5,
        phase: i * 1.2,
      });
    }
  }

  /** Animate glow circles via direct DOM manipulation (no Lit re-render) */
  private _startDriftLoop(): void {
    if (this._driftFrame) cancelAnimationFrame(this._driftFrame);
    const startTime = performance.now() / 1000;

    const animate = () => {
      const t = performance.now() / 1000 - startTime;
      const glows = this.renderRoot.querySelectorAll<SVGCircleElement>('.node-glow');

      for (let i = 0; i < this.nodes.length && i < glows.length; i++) {
        const target = this._driftTargets.get(this.nodes[i].id);
        if (!target) continue;

        // Sinusoidal oscillation: 0 → target → 0 → target → ...
        const progress = Math.sin(((t + target.phase) / target.dur) * Math.PI * 2) * 0.5 + 0.5;
        glows[i].setAttribute('cx', (target.dx * progress).toFixed(1));
        glows[i].setAttribute('cy', (target.dy * progress).toFixed(1));
      }

      this._driftFrame = requestAnimationFrame(animate);
    };

    this._driftFrame = requestAnimationFrame(animate);
  }

  // Pan handlers
  private _handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this._panStart = { x: e.clientX, y: e.clientY, vbx: this._vbx, vby: this._vby };
  }

  private _handleMouseMove(e: MouseEvent): void {
    // Tooltip tracking
    if (!this._panStart) {
      this._tooltipX = e.offsetX;
      this._tooltipY = e.offsetY;
      return;
    }

    const dx = (e.clientX - this._panStart.x) / this._zoom;
    const dy = (e.clientY - this._panStart.y) / this._zoom;
    this._vbx = this._panStart.vbx - dx;
    this._vby = this._panStart.vby - dy;
    this._updateViewBox();
    this.requestUpdate();
  }

  private _handleMouseUp(): void {
    this._panStart = null;
  }

  // Zoom handler
  private _handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this._zoom = Math.max(0.5, Math.min(3, this._zoom * factor));
    this._updateViewBox();
    this.requestUpdate();
  }

  // Node interactions
  private _handleNodeClick(node: MapNodeData): void {
    this.dispatchEvent(
      new CustomEvent('node-click', { detail: node, bubbles: true, composed: true }),
    );
  }

  private _handleNodeHover(node: MapNodeData | null): void {
    this._tooltipNode = node;
  }

  // Edge interactions
  private _handleEdgeClick(edge: MapEdgeData): void {
    this.dispatchEvent(
      new CustomEvent('edge-click', { detail: edge, bubbles: true, composed: true }),
    );
  }

  private _getNodeById(id: string): MapNodeData | undefined {
    return this.nodes.find((n) => n.id === id);
  }

  /** Get connected neighbor IDs for a node */
  private _getConnectedNodes(nodeId: string): MapNodeData[] {
    const neighborIds = new Set<string>();
    for (const edge of this.edges) {
      if (edge.sourceId === nodeId) neighborIds.add(edge.targetId);
      if (edge.targetId === nodeId) neighborIds.add(edge.sourceId);
    }
    return [...neighborIds].map((id) => this._getNodeById(id)).filter(Boolean) as MapNodeData[];
  }

  private _renderEdge(edge: MapEdgeData) {
    const source = this._getNodeById(edge.sourceId);
    const target = this._getNodeById(edge.targetId);
    if (!source || !target) return nothing;

    // Bezier curve with slight offset
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return nothing; // Nodes overlap, skip edge
    // Perpendicular offset for curve
    const offset = dist * 0.12;
    const cx = mx + (-dy / dist) * offset;
    const cy = my + (dx / dist) * offset;

    const strokeColor = getThemeColor(source.theme);
    const strokeWidth = 1.5 + edge.strength * 2;

    return svg`
      <g class="edge-group" @click=${() => this._handleEdgeClick(edge)} style="cursor: pointer">
        <path
          class="edge-line"
          d="M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}"
          stroke="${strokeColor}"
          stroke-width="${strokeWidth}"
          opacity="0.5"
        />
      </g>
    `;
  }

  private _renderNode(node: MapNodeData) {
    const color = getThemeColor(node.theme);
    const glowColor = getGlowColor(node.theme);
    const nodeIdx = this.nodes.indexOf(node);

    return svg`
      <g
        class="node-group"
        transform="translate(${node.x}, ${node.y})"
        @click=${() => this._handleNodeClick(node)}
        @mouseenter=${() => this._handleNodeHover(node)}
        @mouseleave=${() => this._handleNodeHover(null)}
      >
        <!-- Defs for this node -->
        <defs>
          <clipPath id="clip-${node.id}">
            <circle r="${NODE_RADIUS - 3}" />
          </clipPath>
          <filter id="glow-${node.id}">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Breathing glow — cx/cy animated by JS drift loop after settlement -->
        <circle class="node-glow" r="${NODE_RADIUS + 12}" fill="${glowColor}"
          style="animation-delay: ${(-nodeIdx * 1.2).toFixed(1)}s" />

        <!-- Banner image or fallback -->
        ${
          node.bannerUrl
            ? svg`
              <image
                href="${node.bannerUrl}"
                x="${-NODE_RADIUS + 3}"
                y="${-NODE_RADIUS + 3}"
                width="${(NODE_RADIUS - 3) * 2}"
                height="${(NODE_RADIUS - 3) * 2}"
                clip-path="url(#clip-${node.id})"
                preserveAspectRatio="xMidYMid slice"
              />
            `
            : svg`
              <circle r="${NODE_RADIUS - 3}" fill="var(--color-surface, #0a0a0a)" />
            `
        }

        <!-- Border ring -->
        <circle class="node-border" r="${NODE_RADIUS}" stroke="${color}" />

        <!-- Label -->
        <text class="node-label" y="${LABEL_OFFSET}">${node.name}</text>

        <!-- Stats -->
        <text class="node-stat" y="${LABEL_OFFSET + 14}">
          ${node.agentCount}A / ${node.buildingCount}B / ${node.eventCount}E
        </text>
      </g>
    `;
  }

  private _renderEmbassyEdge(edge: MapEmbassyEdge) {
    const source = this._getNodeById(edge.sourceSimId);
    const target = this._getNodeById(edge.targetSimId);
    if (!source || !target) return nothing;

    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return nothing;

    // Offset slightly to the other side of bleed edges
    const offset = dist * -0.08;
    const cx = mx + (-dy / dist) * offset;
    const cy = my + (dx / dist) * offset;

    const tooltip = `${edge.buildingAName} \u2194 ${edge.buildingBName}`;

    return svg`
      <g class="edge-group" style="cursor: pointer">
        <!-- Glow -->
        <path
          d="M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}"
          stroke="${EMBASSY_EDGE_COLOR}"
          stroke-width="6"
          fill="none"
          opacity="0.2"
        />
        <!-- Main line (solid, not dashed) -->
        <path
          class="embassy-edge-line"
          d="M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}"
          stroke="${EMBASSY_EDGE_COLOR}"
          stroke-width="2.5"
        >
          <title>${tooltip}</title>
        </path>
        <!-- Building icon at midpoint -->
        <text class="embassy-edge-label" x="${cx}" y="${cy}">\u{1F3DB}</text>
      </g>
    `;
  }

  private _renderStarfield() {
    return svg`
      <g class="starfield">
        ${this._stars.map(
          (s) => svg`
            <circle
              class="star ${s.twinkle ? 'star--twinkle' : ''}"
              cx="${s.x}" cy="${s.y}" r="${s.r}"
              opacity="${s.twinkle ? 0.2 : 0.15 + Math.random() * 0.2}"
              style="${s.twinkle ? `animation-delay: ${s.delay}s` : ''}"
            />
          `,
        )}
      </g>
    `;
  }

  private _renderEnergyPulse(edge: MapEdgeData) {
    const source = this._getNodeById(edge.sourceId);
    const target = this._getNodeById(edge.targetId);
    if (!source || !target) return nothing;

    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return nothing;

    const offset = dist * 0.12;
    const cx = mx + (-dy / dist) * offset;
    const cy = my + (dx / dist) * offset;
    const color = getThemeColor(source.theme);
    const duration = 3 + edge.strength * 2; // faster for stronger connections

    return svg`
      <circle r="3" fill="${color}" opacity="0.8">
        <animateMotion
          dur="${duration}s"
          repeatCount="indefinite"
          path="M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}"
        />
      </circle>
      <circle r="3" fill="${getThemeColor(target.theme)}" opacity="0.8">
        <animateMotion
          dur="${duration * 1.1}s"
          repeatCount="indefinite"
          path="M ${target.x} ${target.y} Q ${cx} ${cy} ${source.x} ${source.y}"
        />
      </circle>
    `;
  }

  protected render() {
    return html`
      <svg
        viewBox="${this._viewBox}"
        @mousedown=${this._handleMouseDown}
        @mousemove=${this._handleMouseMove}
        @mouseup=${this._handleMouseUp}
        @mouseleave=${this._handleMouseUp}
        @wheel=${this._handleWheel}
      >
        <!-- Starfield (behind everything) -->
        ${this._renderStarfield()}

        <!-- Bleed edges (behind nodes) -->
        ${this.edges.map((e) => this._renderEdge(e))}

        <!-- Energy pulses traveling along edges -->
        ${this.edges.map((e) => this._renderEnergyPulse(e))}

        <!-- Embassy edges (solid glow, also behind nodes) -->
        ${this.embassyEdges.map((e) => this._renderEmbassyEdge(e))}

        <!-- Nodes -->
        ${this.nodes.map((n) => this._renderNode(n))}
      </svg>

      <velg-map-tooltip
        .node=${this._tooltipNode}
        .x=${this._tooltipX}
        .y=${this._tooltipY}
      ></velg-map-tooltip>
    `;
  }
}
