import { html } from 'lit';
import { setUser, initFavoritePages } from '../state/slice';
import { ConnectedLitElement, store } from '../state/store';
import './header';
import mainStyles from './mainStyles';
import './nav';
import './report';
import './updates';
import './navButtons';
import { selectors } from '../state/selectors.js';

class Main extends ConnectedLitElement {
    static styles = mainStyles;
    static properties = {
        showMoreUpdates: { type: Boolean, attribute: true, reflect: true },
    };

    stateChanged(state) {
        for (const name in this.constructor.properties) {
            this[name] = selectors[name](state);
        }
    }

    constructor() {
        super();
        fetch('/.auth/me')
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.toString());
                } else {
                    return response;
                }
            })
            .then(response => (response.ok ? response.json() : { clientPrincipal: {} }))
            .then(json => {
                const user = {
                    email: json.clientPrincipal?.userDetails,
                    id: json.clientPrincipal?.userId,
                    roles: json.clientPrincipal?.userRoles,
                    identityProvider: json.clientPrincipal?.identityProvider,
                };
                store.dispatch(setUser({ ...user }));
            });
        store.dispatch(initFavoritePages());
    }

    // interactions

    // render
    render() {
        return html`
            <sa-header></sa-header>
            <sa-nav-buttons></sa-nav-buttons>
            <sa-nav></sa-nav>
            <sa-updates></sa-updates>
            <sa-report></sa-report>
        `;
    }
}

customElements.define('sa-main', Main);
