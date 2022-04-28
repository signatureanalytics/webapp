import { css } from 'lit';

export default css`
    *,
    :host,
    *::before,
    *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    :host {
        position: relative;
        width: var(--nav-sidebar-width);
    }
    #reportContainer {
        height: 100%;
        width: 100%;
    }
    iframe {
        border: 0;
    }
    sa-button {
        position: absolute;
        top: 5px;
        left: -43px;
        opacity: 0;
        transition: opacity 200ms ease;
        pointer-events: none;
    }
    :host([nav-sidebar-hidden]) sa-button {
        opacity: 1;
        pointer-events: all;
    }
`;
