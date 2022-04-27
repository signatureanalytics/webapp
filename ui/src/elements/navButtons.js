import { html } from 'lit';
import './icon.js';
import './button.js';
import { ConnectedLitElement, store } from '../state/store.js';
import { selectors } from '../state/selectors.js';
import { toggleShowFavoritePages, expandReport, collapseReport, toggleHideNavSidebar } from '../state/slice.js';
import navButtonStyles from './navButtonsStyles.js';
import { slug } from '../slug.js';

class NavButtons extends ConnectedLitElement {
    static styles = navButtonStyles;
    static properties = {
        showFavoritePages: Boolean,
        favoritePages: Array,
        reports: Array,
    };

    stateChanged(state) {
        for (const name in this.constructor.properties) {
            this[name] = selectors[name](state);
        }
    }

    expand(e) {
        for (const report of this.reports) {
            if (!report.expanded) {
                store.dispatch(expandReport({ reportId: report.id }));
            }
        }
        e.stopPropagation();
        e.preventDefault();
    }

    collapse(e) {
        for (const report of this.reports) {
            if (report.expanded) {
                store.dispatch(collapseReport({ reportId: report.id }));
            }
        }
        e.stopPropagation();
        e.preventDefault();
    }

    toggleShowFavorites(e) {
        store.dispatch(toggleShowFavoritePages());
        e.stopPropagation();
        e.preventDefault();
    }

    toggleHideNavSidebar(e) {
        store.dispatch(toggleHideNavSidebar());
        e.stopPropagation();
        e.preventDefault();
    }

    render() {
        const [, workspaceSlug] = location.pathname.split('/');
        const pageSlugs = this.reports.flatMap(report =>
            report.pages.map(page => `${workspaceSlug}/${slug(report.name)}/${slug(page.name)}`)
        );
        const showFavoritePagesDisabled = !(
            this.showFavoritePages || this.favoritePages.some(p => pageSlugs.includes(p))
        );
        const starColor = this.showFavoritePages || showFavoritePagesDisabled ? '#bbb' : '#4688ba';
        return html`
            <sa-button @click=${this.expand} label="Expand all" name="expand" size="32"></sa-button>
            <sa-button @click=${this.collapse} label="Collapse all" name="collapse" size="32"></sa-button>
            <sa-button
                ?disabled=${showFavoritePagesDisabled}
                @click=${!showFavoritePagesDisabled ? this.toggleShowFavorites : _ => {}}
                label="Show ${this.showFavoritePages ? 'all' : 'favorites'}"
                name="star"
                size="32"
                fill="${starColor}"
            ></sa-button>
            <sa-button
                @click=${this.toggleHideNavSidebar}
                label="Hide sidebar"
                name="doubleArrow"
                transform="rotate(180)"
                size="32"
            >
            </sa-button>
        `;
    }
}

customElements.define('sa-nav-buttons', NavButtons);
