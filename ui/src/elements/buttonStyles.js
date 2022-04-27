import { css } from 'lit';

export default css`
    :host {
        font-family: var(--font-body);
        font-size: 0.75em;
        position: relative;
        box-sizing: border-box;
    }
    .wrapper {
        margin: auto;
        cursor: pointer;
        border-radius: 50%;
        background-color: #f3f3f3;
    }
    .wrapper:last-child {
        border: 0;
    }
    .wrapper:hover {
        background-color: #ddd;
    }
    :host([disabled]) .wrapper {
        cursor: default;
        color: #bbb;
    }
    :host([disabled]) .wrapper:hover {
        background-color: white;
    }
    sa-icon {
        padding: 4px;
        display: block;
    }
    .label {
        display: none;
        position: absolute;
        white-space: nowrap;
        text-align: center;
        width: 200px;
        left: calc(-100px + 50%);
    }
    :host(:not([disabled])) .wrapper:hover .label {
        display: block;
    }
`;
