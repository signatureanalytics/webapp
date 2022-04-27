import { css } from 'lit';

export default css`
    :host {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border-right: 2px solid #ddd;
        font-family: var(--font-body);
        font-size: 0.7em;
        position: relative;
        box-sizing: border-box;
        align-content: bottom;
        width: 275px;
        overflow-x: hidden;
        overflow-y: visible;
    }
    sa-button {
        width: 40px;
        place-self: center;
        display: block;
    }
`;
