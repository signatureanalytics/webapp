import { html } from 'lit';
import { setUser } from '../state/slice';
import { ConnectedLitElement, store } from '../state/store';
import './header';
import mainStyles from './mainStyles';
import './nav';
import './report';

class Main extends ConnectedLitElement {
    static styles = mainStyles;

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
