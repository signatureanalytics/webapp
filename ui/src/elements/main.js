import { LitElement, html, css } from 'lit';
import * as pbi from 'powerbi-client';
import './header';
import './nav';
import './report';

const models = pbi.models;

class Main extends LitElement {
    static get styles() {
        return css`
            *,
            :host,
            *::before,
            *::after {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            :host {
                display: grid;
                grid-template-areas: 'header header' 'nav report';
                grid-template-rows: 80px auto;
                grid-template-columns: 275px auto;
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
        `;
    }

    // interactions

    // render
    render() {
        return html`
            <sa-header></sa-header>
            <sa-nav></sa-nav>
            <sa-report></sa-report>
        `;
    }
}

customElements.define('sa-main', Main);
