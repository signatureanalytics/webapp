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
        --font-body: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;
        --font-header: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;
        --color-brand: #228dc1;

        display: grid;
        grid-template-areas: 'header header' 'nav report' 'updates report';
        grid-template-rows: 80px 1fr min-content;
        grid-template-columns: min-content 1fr;
        height: 100%;
        position: relative;
    }
    sa-report {
        height: calc(100vh - 80px);
        width: calc(100vw - 275px);
        grid-area: report;
    }
    sa-header {
        grid-area: header;
    }
    sa-nav {
        grid-area: nav;
    }
    sa-updates {
        grid-area: updates;
    }
    sa-nav,
    sa-report {
        padding: 5px;
    }
`;
