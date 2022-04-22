import { css } from 'lit';

export default css`
    :host {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border-right: 2px solid #ddd;
        border-bottom: 2px solid #ddd;
        font-family: var(--font-body);
        font-size: 0.7em;
    }
    div {
        /* width: 100%; */
        position: relative;
        text-align: center;
        cursor: pointer;
        padding: 2px;
        border-right: 2px solid #eee;
    }
    div:last-child {
        border: 0;
    }
    div:hover {
        background: #eee;
    }
    div[disabled] {
        cursor: default;
        color: #bbb;
    }
    div[disabled]:hover {
        background-color: white;
    }
    sa-icon {
        width: 24px;
        margin-inline: auto;
        display: block;
    }
`;
