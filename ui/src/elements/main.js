import { LitElement, html, css } from 'lit';
import * as pbi from 'powerbi-client';
import './header';
import './nav';
import './report';
import store from '../state/store';
import { setUser } from '../state/slice';
import { connect } from 'pwa-helpers';
const models = pbi.models;

class Main extends connect(store)(LitElement) {
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
        `;
    }

    constructor() {
        super();
        fetch('/.auth/me')
            .then(response => {
                if (!response.ok) {
                    throw new Error(response);
                } else {
                    return response;
                }
            })
            .then(response => (response.ok ? response.json() : { clientPrincipal: {} }))
            .then(json => {
                const user = {
                    email: json.clientPrincipal.userDetails,
                    id: json.clientPrincipal.userId,
                    roles: json.clientPrincipal.userRoles,
                    identityProvider: json.clientPrincipal.identityProvider,
                };
                store.dispatch(setUser({ ...user }));
            });
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
