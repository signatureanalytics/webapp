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
        --nav-sidebar-width: 275px;
        --nav-sidebar-opacity: 1;

        display: grid;
        grid-template-areas: 'header header' 'nav-buttons report' 'nav report' 'updates report';
        grid-template-rows: 80px 50px 1fr min-content;
        grid-template-columns: min-content 1fr;
        height: 100%;
        position: relative;
        border-left: 2px solid transparent;
        transition: border-color 200ms ease;
    }

    :host([nav-sidebar-hidden]) {
        --nav-sidebar-width: 40px;
        --nav-sidebar-opacity: 0;
    }
    :host([nav-sidebar-hidden]) sa-report {
        border-left: 2px solid #ddd;
    }
    :host([nav-sidebar-hidden]) sa-nav-buttons {
        border-left: 2px solid #ddd;
        pointer-events: none;
    }
    sa-report {
        height: calc(100vh - 80px);
        width: calc(100vw - var(--nav-sidebar-width));
        grid-area: report;
    }
    sa-header {
        grid-area: header;
    }
    sa-nav-buttons {
        grid-area: nav-buttons;
        overflow: visible;
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
    sa-nav,
    sa-nav-buttons,
    sa-updates {
        position: relative;
        width: var(--nav-sidebar-width);
        opacity: var(--nav-sidebar-opacity);
        transition: width 300ms ease, opacity 300ms ease;
    }
`;
