/**
 * How-to-Play shared styles — extracted from HowToPlayView.ts.
 *
 * Dark military-console aesthetic: scan-line textures, terminal readouts,
 * brutalist headings, monospace data tables. CRT-era tactical briefing look.
 */

import { css } from 'lit';

export const htpStyles = css`
  /* ═══ HOST ═══════════════════════════════════════ */

  :host {
    display: block;
    min-height: 100vh;
    background: var(--color-gray-950);
    color: var(--color-gray-200);
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ═══ HERO ═══════════════════════════════════════ */

  .hero {
    position: relative;
    border-bottom: 3px solid var(--color-gray-800);
    overflow: hidden;
  }

  .hero__scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255 255 255 / 0.015) 2px,
      rgba(255 255 255 / 0.015) 4px
    );
    pointer-events: none;
  }

  .hero__inner {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-16) var(--space-6) var(--space-10);
    text-align: center;
  }

  .hero__classification {
    display: inline-block;
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--tracking-widest);
    color: var(--color-danger);
    border: 2px solid var(--color-danger);
    padding: var(--space-0-5) var(--space-3);
    margin-bottom: var(--space-6);
    opacity: 0;
    animation: fade-down 0.6s var(--ease-dramatic) 0.1s forwards;
  }

  .hero__title {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: clamp(2rem, 6vw, var(--text-4xl));
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--color-gray-0);
    margin: 0 0 var(--space-3);
    opacity: 0;
    animation: fade-down 0.6s var(--ease-dramatic) 0.25s forwards;
  }

  .hero__sub {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-base);
    color: var(--color-gray-500);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    margin: 0;
    opacity: 0;
    animation: fade-down 0.6s var(--ease-dramatic) 0.4s forwards;
  }

  .hero__line {
    width: 80px;
    height: 2px;
    background: var(--color-gray-700);
    margin: var(--space-6) auto 0;
    opacity: 0;
    animation: scale-x 0.6s var(--ease-dramatic) 0.55s forwards;
  }

  @keyframes fade-down {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes scale-x {
    from { opacity: 0; transform: scaleX(0); }
    to   { opacity: 1; transform: scaleX(1); }
  }

  /* ═══ LAYOUT ═════════════════════════════════════ */

  .layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    max-width: 1200px;
    margin: 0 auto;
    gap: 0;
  }

  /* ═══ TOC SIDEBAR ════════════════════════════════ */

  .toc {
    position: sticky;
    top: 0;
    height: 100vh;
    padding: var(--space-8) var(--space-4) var(--space-8) var(--space-6);
    border-right: 1px solid var(--color-gray-800);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-gray-700) transparent;
  }

  .toc__label {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-widest);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-4);
  }

  .toc__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .toc__link {
    display: block;
    padding: var(--space-1-5) var(--space-2);
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    color: var(--color-gray-500);
    text-decoration: none;
    border-left: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toc__link:hover {
    color: var(--color-gray-300);
    border-left-color: var(--color-gray-600);
  }

  .toc__link:focus-visible {
    outline: 2px solid var(--color-warning);
    outline-offset: -2px;
  }

  .toc__link--active {
    color: var(--color-gray-100);
    border-left-color: var(--color-warning);
    background: rgba(245 158 11 / 0.05);
  }

  /* ═══ MAIN CONTENT ═══════════════════════════════ */

  .content {
    padding: var(--space-8) var(--space-8) var(--space-16);
    min-width: 0;
  }

  /* ═══ SECTIONS ═══════════════════════════════════ */

  .section {
    margin-bottom: var(--space-16);
    scroll-margin-top: var(--space-4);
  }

  .section__divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }

  .section__number {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: 11px;
    color: var(--color-gray-600);
    flex-shrink: 0;
  }

  .section__rule {
    flex: 1;
    height: 1px;
    background: var(--color-gray-800);
  }

  .section__title {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: var(--text-xl);
    text-transform: uppercase;
    letter-spacing: var(--tracking-brutalist);
    color: var(--color-gray-0);
    margin: 0 0 var(--space-4);
  }

  .section__text {
    color: var(--color-gray-400);
    line-height: var(--leading-relaxed);
    max-width: 65ch;
  }

  /* ═══ PHASE STEPPER ══════════════════════════════ */

  .phases {
    display: flex;
    align-items: flex-start;
    gap: 0;
    margin: var(--space-6) 0;
    overflow-x: auto;
    padding-bottom: var(--space-4);
  }

  .phase {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
    flex: 1;
    position: relative;
  }

  .phase__dot-row {
    display: flex;
    align-items: center;
    width: 100%;
    position: relative;
  }

  .phase__track {
    flex: 1;
    height: 2px;
    background: var(--color-gray-700);
  }

  .phase__track--hidden {
    visibility: hidden;
  }

  .phase__dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .phase__name {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    margin-top: var(--space-2);
    text-align: center;
  }

  .phase__desc {
    font-size: 10px;
    color: var(--color-gray-500);
    text-align: center;
    margin-top: var(--space-1);
    padding: 0 var(--space-1);
    line-height: 1.4;
  }

  /* ═══ RP DATA READOUT ════════════════════════════ */

  .readout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--color-gray-800);
    border: 1px solid var(--color-gray-800);
    margin: var(--space-4) 0;
    max-width: 500px;
  }

  .readout__cell {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--color-gray-900);
  }

  .readout__label {
    color: var(--color-gray-500);
    font-size: 11px;
  }

  .readout__value {
    color: var(--color-warning);
    font-weight: var(--font-bold);
    font-size: 11px;
  }

  /* ═══ OPERATIVE CARDS ════════════════════════════ */

  .ops-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
    margin: var(--space-6) 0;
  }

  .op-card {
    background: var(--color-gray-900);
    border: 1px solid var(--color-gray-800);
    border-left: 4px solid;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    opacity: 0;
    animation: card-in var(--duration-entrance, 350ms) var(--ease-dramatic) forwards;
    animation-delay: calc(var(--i, 0) * var(--duration-stagger, 40ms));
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .op-card__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .op-card__name {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: var(--text-md);
    text-transform: uppercase;
    letter-spacing: var(--tracking-brutalist);
    color: var(--color-gray-0);
  }

  .op-card__cost {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: var(--text-2xl);
    line-height: 1;
  }

  .op-card__cost-label {
    font-size: var(--text-xs);
    color: var(--color-gray-500);
    text-transform: uppercase;
    margin-left: 2px;
  }

  .op-card__stats {
    display: flex;
    gap: var(--space-4);
  }

  .op-card__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .op-card__stat-label {
    font-size: 9px;
    color: var(--color-gray-600);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  .op-card__stat-value {
    font-weight: var(--font-bold);
    color: var(--color-gray-300);
    font-size: var(--text-sm);
  }

  .op-card__desc {
    color: var(--color-gray-400);
    font-size: 11px;
    line-height: 1.5;
  }

  .op-card__effect {
    font-size: 11px;
    color: var(--color-gray-300);
    padding: var(--space-2);
    background: rgba(255 255 255 / 0.03);
    border-left: 2px solid var(--color-gray-600);
  }

  /* ═══ TACTICS CARDS ═════════════════════════════ */

  .tactics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
    margin: var(--space-6) 0;
  }

  .tactic-card {
    background: var(--color-gray-900);
    border: 1px solid var(--color-gray-800);
    border-left: 4px solid;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    opacity: 0;
    animation: card-in var(--duration-entrance, 350ms) var(--ease-dramatic) forwards;
    animation-delay: calc(var(--i, 0) * var(--duration-stagger, 40ms));
  }

  .tactic-card--opener   { border-left-color: var(--color-success); }
  .tactic-card--timing   { border-left-color: var(--color-warning); }
  .tactic-card--economy  { border-left-color: var(--color-info); }
  .tactic-card--counter  { border-left-color: var(--color-danger); }
  .tactic-card--preset   { border-left-color: var(--color-gray-500); }

  .tactic-card__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .tactic-card__title {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: var(--text-sm);
    text-transform: uppercase;
    letter-spacing: var(--tracking-brutalist);
    color: var(--color-gray-0);
  }

  .tactic-card__badge {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-widest);
    padding: 1px 6px;
    flex-shrink: 0;
  }

  .tactic-card__badge--opener   { color: var(--color-success); border: 1px solid var(--color-success); }
  .tactic-card__badge--timing   { color: var(--color-warning); border: 1px solid var(--color-warning); }
  .tactic-card__badge--economy  { color: var(--color-info); border: 1px solid var(--color-info); }
  .tactic-card__badge--counter  { color: var(--color-danger); border: 1px solid var(--color-danger); }
  .tactic-card__badge--preset   { color: var(--color-gray-500); border: 1px solid var(--color-gray-500); }

  .tactic-card__desc {
    color: var(--color-gray-400);
    font-size: 11px;
    line-height: 1.6;
  }

  /* ═══ SCORING ════════════════════════════════════ */

  .dim-bars {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: var(--space-4) 0;
    max-width: 500px;
  }

  .dim-row {
    display: grid;
    grid-template-columns: 100px 1fr 40px;
    align-items: center;
    gap: var(--space-3);
  }

  .dim-row__label {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  .dim-row__bar {
    height: 8px;
    background: var(--color-gray-800);
    position: relative;
    overflow: hidden;
  }

  .dim-row__fill {
    position: absolute;
    inset: 0;
    transform-origin: left;
    transform: scaleX(var(--w, 0));
    transition: transform 0.8s var(--ease-dramatic);
  }

  .dim-row__value {
    font-size: 10px;
    color: var(--color-gray-400);
    text-align: right;
  }

  .presets-table {
    width: 100%;
    max-width: 600px;
    border-collapse: collapse;
    margin: var(--space-4) 0;
  }

  .presets-table th {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-gray-500);
    text-align: center;
    padding: var(--space-2);
    border-bottom: 2px solid var(--color-gray-800);
  }

  .presets-table th:first-child {
    text-align: left;
  }

  .presets-table td {
    font-size: 11px;
    text-align: center;
    padding: var(--space-2);
    border-bottom: 1px solid var(--color-gray-850, var(--color-gray-800));
    color: var(--color-gray-300);
  }

  .presets-table td:first-child {
    text-align: left;
    font-weight: var(--font-bold);
    color: var(--color-gray-100);
  }

  .formula {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    color: var(--color-info);
    background: var(--color-gray-900);
    border: 1px solid var(--color-gray-800);
    padding: var(--space-3) var(--space-4);
    margin: var(--space-4) 0;
    overflow-x: auto;
    white-space: nowrap;
  }

  /* ═══ CALLOUT BOXES ══════════════════════════════ */

  .callout {
    border-left: 4px solid;
    padding: var(--space-4);
    margin: var(--space-4) 0;
    background: rgba(255 255 255 / 0.02);
  }

  .callout--tip    { border-left-color: var(--color-success); }
  .callout--warn   { border-left-color: var(--color-warning); }
  .callout--danger { border-left-color: var(--color-danger); }
  .callout--info   { border-left-color: var(--color-info); }

  .callout__label {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    margin-bottom: var(--space-2);
  }

  .callout--tip    .callout__label { color: var(--color-success); }
  .callout--warn   .callout__label { color: var(--color-warning); }
  .callout--danger .callout__label { color: var(--color-danger); }
  .callout--info   .callout__label { color: var(--color-info); }

  .callout__text {
    color: var(--color-gray-400);
    font-size: 12px;
    line-height: 1.6;
  }

  /* ═══ MATCH CARDS ════════════════════════════════ */

  .match {
    background: var(--color-gray-900);
    border: 1px solid var(--color-gray-800);
    margin-bottom: var(--space-6);
  }

  .match__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-gray-800);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .match__header:hover {
    background: rgba(255 255 255 / 0.02);
  }

  .match__header:focus-visible {
    outline: 2px solid var(--color-warning);
    outline-offset: -2px;
  }

  .match__title-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .match__title {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: var(--text-md);
    text-transform: uppercase;
    letter-spacing: var(--tracking-brutalist);
    color: var(--color-gray-0);
    margin: 0;
  }

  .match__subtitle {
    font-size: 10px;
    color: var(--color-gray-500);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  .match__meta {
    display: flex;
    gap: var(--space-4);
    flex-shrink: 0;
  }

  .match__meta-tag {
    font-size: 10px;
    color: var(--color-gray-400);
    padding: var(--space-0-5) var(--space-2);
    border: 1px solid var(--color-gray-700);
  }

  .match__toggle {
    font-size: var(--text-sm);
    color: var(--color-gray-500);
    transition: transform var(--transition-fast);
  }

  .match__toggle--open {
    transform: rotate(180deg);
  }

  .match__body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .match__desc {
    color: var(--color-gray-400);
    font-size: 12px;
    line-height: 1.6;
  }

  .match__players {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .match__player {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    padding: var(--space-0-5) var(--space-2);
    border: 1px solid var(--color-gray-600);
    color: var(--color-gray-300);
  }

  /* ── Cycle Table ─────────── */

  .cycles-label {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-gray-500);
    margin-bottom: var(--space-2);
  }

  .cycles-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .cycles-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 550px;
  }

  .cycles-table th {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-gray-500);
    text-align: left;
    padding: var(--space-1-5) var(--space-2);
    border-bottom: 2px solid var(--color-gray-800);
  }

  .cycles-table td {
    font-size: 11px;
    padding: var(--space-1-5) var(--space-2);
    border-bottom: 1px solid var(--color-gray-850, var(--color-gray-800));
    color: var(--color-gray-300);
    vertical-align: top;
  }

  .cycles-table tr:nth-child(even) td {
    background: rgba(255 255 255 / 0.01);
  }

  .cycle-phase {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 9px;
    text-transform: uppercase;
    padding: 1px 4px;
  }

  .cycle-phase--foundation { color: var(--color-success); }
  .cycle-phase--competition { color: var(--color-warning); }
  .cycle-phase--reckoning { color: var(--color-danger); }

  .outcome--success  { color: var(--color-success); }
  .outcome--detected { color: var(--color-danger); }
  .outcome--failed   { color: var(--color-gray-500); }

  .cycle-note {
    font-size: 10px;
    color: var(--color-gray-500);
    font-style: italic;
  }

  /* ── Standings ────────────── */

  .standings-label {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-gray-500);
    margin-bottom: var(--space-2);
  }

  .standings-table {
    width: 100%;
    border-collapse: collapse;
  }

  .standings-table th {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-gray-500);
    text-align: center;
    padding: var(--space-1-5) var(--space-2);
    border-bottom: 2px solid var(--color-gray-800);
  }

  .standings-table th:first-child,
  .standings-table th:nth-child(2) { text-align: left; }

  .standings-table td {
    font-size: 11px;
    text-align: center;
    padding: var(--space-1-5) var(--space-2);
    border-bottom: 1px solid var(--color-gray-850, var(--color-gray-800));
    color: var(--color-gray-300);
  }

  .standings-table td:first-child,
  .standings-table td:nth-child(2) { text-align: left; }

  .standings-rank {
    font-weight: var(--font-black);
  }

  .standings-rank--1 { color: var(--color-warning); }
  .standings-rank--2 { color: var(--color-gray-400); }
  .standings-rank--3 { color: var(--color-warning-hover); }

  .standings-title {
    font-size: 9px;
    color: var(--color-warning);
    font-style: italic;
  }

  .standings-composite {
    font-weight: var(--font-black);
    color: var(--color-gray-100);
  }

  /* ── Key Moments ─────────── */

  .moments-label {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-gray-500);
    margin-bottom: var(--space-2);
  }

  .moments-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .moments-list li {
    padding-left: var(--space-4);
    position: relative;
    font-size: 12px;
    color: var(--color-gray-400);
    line-height: 1.5;
  }

  .moments-list li::before {
    content: '\\25B8';
    position: absolute;
    left: 0;
    color: var(--color-warning);
  }

  /* ═══ VECTOR GRID ═══════════════════════════════ */

  .vector-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
    margin: var(--space-6) 0;
  }

  .vector-card {
    background: var(--color-gray-900);
    border: 1px solid var(--color-gray-800);
    border-left: 4px solid;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    opacity: 0;
    animation: card-in var(--duration-entrance, 350ms) var(--ease-dramatic) forwards;
    animation-delay: calc(var(--i, 0) * var(--duration-stagger, 40ms));
  }

  .vector-card__name {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: var(--text-sm);
    text-transform: uppercase;
    letter-spacing: var(--tracking-brutalist);
    color: var(--color-gray-0);
  }

  .vector-card__desc {
    color: var(--color-gray-400);
    font-size: 11px;
    line-height: 1.5;
  }

  .vector-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .vector-tag {
    font-family: var(--font-mono, monospace);
    font-size: 9px;
    padding: 1px 5px;
    border: 1px solid var(--color-gray-700);
    color: var(--color-gray-500);
  }

  /* ═══ DIMENSION FORMULAS ═════════════════════════ */

  .dim-block {
    background: var(--color-gray-900);
    border: 1px solid var(--color-gray-800);
    border-left: 4px solid;
    padding: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .dim-block__header {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }

  .dim-block__name {
    font-family: var(--font-brutalist);
    font-weight: var(--font-black);
    font-size: var(--text-sm);
    text-transform: uppercase;
    letter-spacing: var(--tracking-brutalist);
    color: var(--color-gray-0);
  }

  .dim-title {
    font-size: 10px;
    font-style: italic;
    padding: 1px 6px;
    border: 1px solid;
    opacity: 0.8;
  }

  .dim-block__formula {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    color: var(--color-info);
    margin-bottom: var(--space-2);
  }

  .dim-block__explanation {
    color: var(--color-gray-400);
    font-size: 11px;
    line-height: 1.5;
  }

  /* ═══ LIFECYCLE STEPS ═══════════════════════════ */

  .lifecycle {
    display: flex;
    align-items: center;
    gap: 0;
    margin: var(--space-4) 0;
    flex-wrap: wrap;
  }

  .lifecycle__step {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .lifecycle__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .lifecycle__name {
    font-family: var(--font-brutalist);
    font-weight: var(--font-bold);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  .lifecycle__arrow {
    color: var(--color-gray-600);
    font-size: 10px;
    margin: 0 var(--space-2);
  }

  /* ═══ RESPONSIVE ═════════════════════════════════ */

  @media (max-width: 768px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .toc {
      position: sticky;
      top: 0;
      z-index: 10;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--color-gray-800);
      background: var(--color-gray-950);
      padding: var(--space-2) var(--space-4);
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .toc__label { display: none; }

    .toc__list {
      flex-direction: row;
      gap: 0;
    }

    .toc__link {
      border-left: none;
      border-bottom: 2px solid transparent;
      padding: var(--space-1) var(--space-2);
      font-size: 10px;
    }

    .toc__link--active {
      border-bottom-color: var(--color-warning);
      border-left-color: transparent;
      background: none;
    }

    .toc__link:hover {
      border-left-color: transparent;
    }

    .content {
      padding: var(--space-6) var(--space-4) var(--space-12);
    }

    .ops-grid,
    .tactics-grid,
    .vector-grid {
      grid-template-columns: 1fr;
    }

    .hero__inner {
      padding: var(--space-10) var(--space-4) var(--space-8);
    }

    .match__header {
      flex-direction: column;
      align-items: flex-start;
    }

    .match__meta {
      flex-wrap: wrap;
    }

    .readout {
      grid-template-columns: 1fr;
    }

    .dim-row {
      grid-template-columns: 80px 1fr 30px;
    }
  }

  /* ═══ REDUCED MOTION ═════════════════════════════ */

  @media (prefers-reduced-motion: reduce) {
    .hero__classification,
    .hero__title,
    .hero__sub,
    .hero__line,
    .op-card,
    .tactic-card,
    .vector-card {
      animation: none;
      opacity: 1;
      transform: none;
    }

    .dim-row__fill {
      transition: none;
    }
  }
`;
