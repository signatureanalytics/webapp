import { LitElement, html, css } from 'lit';
import * as pbi from 'powerbi-client';
import './header';
import './nav';
import './report';
import store from '../state/store';
import { setUser } from '../state/slice';
import { connect } from 'pwa-helpers';
import mainStyles from './mainStyles';

const models = pbi.models;

class Main extends connect(store)(LitElement) {
    static styles = mainStyles;

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
