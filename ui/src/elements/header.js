import { html } from 'lit';
import logo from '../assets/sa-covantage-logo.png';
import { selectors } from '../state/selectors';
import { ConnectedLitElement } from '../state/store';
import headerStyles from './headerStyles';

const fixAssetUrl = url => `${`/${url}`.replace('//', '/')}`;

class Header extends ConnectedLitElement {
    static styles = headerStyles;
    static properties = {
        selectedReport: Object,
        selectedPage: Object,
        user: Object,
        workspace: Object,
        title: String,
    };

    stateChanged(state) {
        if (!state) {
            throw new Error();
        }
        for (const name in this.constructor.properties) {
            this[name] = selectors[name](state);
        }
    }

    updated(changedProps) {
        super.updated(changedProps);
        document.title = this.title;
    }

    render() {
        const workspaceName = this.workspace?.name;
        const reportName = this.selectedReport?.name;
        const pageName = this.selectedPage?.name;
        return html`
            <header>
                <img class="logo" src="${fixAssetUrl(logo)}" />
                <div class="title">
                    <h1>${reportName ? `${workspaceName} - ${reportName} Report` : ''}</h1>
                    <h2>${pageName}</h2>
                </div>
                <div class="userinfo">${this.user.email}</div>
            </header>
        `;
    }
}

customElements.define('sa-header', Header);
