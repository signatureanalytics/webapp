import { html } from 'lit';
import { classMap} from 'lit/directives/class-map.js';
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
        if(this.favoritePages.includes(page)) {
            store.dispatch(removeFavoritePage({ page }));
        } else {
            store.dispatch(addFavoritePage({ page }));
        }
        e.preventDefault();
        e.stopPropagation();
    }

    render() {
        const workspaceName = this.workspace?.name;
        const reportName = this.selectedReport?.name;
        const isFavorite = this.favoritePages.includes(location.pathname.slice(1));
        const starClasses = {favoritePage: isFavorite};
        const title = `${isFavorite ? 'Remove' : 'Add'} Favorite Page`;
        const filledStar = html`<a title=${title} class=${classMap(starClasses)} href="#" @click=${this.toggleStar}><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="20px" viewBox="0 0 24 24" width="20px" fill="#000000"><g><path d="M0,0h24v24H0V0z" fill="none"/><path d="M0,0h24v24H0V0z" fill="none"/></g><g><path d="M12,17.27L18.18,21l-1.64-7.03L22,9.24l-7.19-0.61L12,2L9.19,8.63L2,9.24l5.46,4.73L5.82,21L12,17.27z"/></g></svg></a>`;
        const pageName = this.selectedPage ? html`${this.selectedPage.name}${filledStar}` : ``;
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
