import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import logo from '../assets/sa-covantage-logo.png';
import { selectors } from '../state/selectors';
import { addFavoritePage, removeFavoritePage } from '../state/slice';
import { ConnectedLitElement, store } from '../state/store';
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
        const starClasses = { favoritePage: isFavorite };
        const title = `${isFavorite ? 'Remove' : 'Add'} Favorite Page`;
        const starColor = isFavorite ? '#4688ba' : '#ddd';
        const star = html`<sa-icon
            name="star"
            title=${title}
            fill="${starColor}"
            size="22"
            @click=${this.toggleStar}
        ></sa-icon>`;
        const pageName = this.selectedPage ? html`${this.selectedPage.name}${star}` : ``;
        return html`
            <header>
                <img class="logo" src="${fixAssetUrl(logo)}" />
                <div class="title">
                    <h1>${reportName ? `${workspaceName} - ${reportName} Report` : ''}</h1>
                    <h2>${pageName}</h2>
                </div>
                ${clientLogo ? html`<img class="clientLogo" src="/assets/${clientLogo}" />` : ''}
                <div class="userEmail">${this.user.email}</div>
            </header>
        `;
    }
}

customElements.define('sa-header', Header);
