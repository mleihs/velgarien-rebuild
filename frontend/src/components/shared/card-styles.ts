import { css } from 'lit';

/**
 * Shared card hover/active transform styles.
 * Usage: `static styles = [cardStyles, css\`...\`]`
 */
export const cardStyles = css`
  .card {
    cursor: pointer;
    transition: transform var(--duration-normal) var(--ease-out),
      box-shadow var(--duration-normal) var(--ease-out);
  }
  .card:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-lg);
  }
  .card:active {
    transform: translate(0);
    box-shadow: var(--shadow-pressed);
  }
`;
