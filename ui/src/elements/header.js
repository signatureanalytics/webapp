import { html } from 'lit';
import logos from '../logos.js';
import { selectors } from '../state/selectors';
import { addFavoritePage, removeFavoritePage } from '../state/slice';
import { ConnectedLitElement, store } from '../state/store';
import headerStyles from './headerStyles';
import './button.js';

const fixAssetUrl = url => `${`/${url}`.replace('//', '/')}`;

class Header extends ConnectedLitElement {
    static styles = headerStyles;
    static properties = {
        selectedReport: Object,
        selectedPage: Object,
        user: Object,
        workspace: Object,
        title: String,
        favoritePages: Array,
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

    toggleStar(e) {
        const page = location.pathname.slice(1);
        if (this.favoritePages.includes(page)) {
            store.dispatch(removeFavoritePage({ page }));
        } else {
            store.dispatch(addFavoritePage({ page }));
        }
        e.preventDefault();
        e.stopPropagation();
    }

    render() {
        const workspaceName = this.workspace?.name;
        const clientLogo = this.workspace?.logo;
        const reportName = this.selectedReport?.name;
        const isFavorite = this.favoritePages.includes(location.pathname.slice(1));
        const title = `${isFavorite ? 'Remove' : 'Add'} Favorite Page`;
        const starColor = isFavorite ? '#4688ba' : '#bbb';
        const star = html`<sa-button
            name="star"
            title=${title}
            fill="${starColor}"
            size="22"
            @click=${this.toggleStar}
        ></sa-button>`;
        const pageName = this.selectedPage ? html`${this.selectedPage.name}${star}` : ``;
        return html`
            <header>
                <img class="logo" src="${fixAssetUrl(logos.covantage)}" />
                <div class="title">
                    <h1>${reportName ? `${workspaceName} - ${reportName} Report` : ''}</h1>
                    <h2>${pageName}</h2>
                </div>
                ${clientLogo && logos[clientLogo] ? html`<img class="clientLogo" src="${fixAssetUrl(logos[clientLogo])}" />` : ''}
                <div class="userEmail">${this.user.email}</div>
            </header>
        `;
    }
}

customElements.define('sa-header', Header);
