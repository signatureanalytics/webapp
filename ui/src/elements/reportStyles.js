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
    #reportContainer {
        height: 100%;
        width: 100%;
    }
    iframe {
        border: 0;
    }
`;
