import { html } from 'lit';
import './icon.js';
import { ConnectedLitElement, store } from '../state/store.js';
import { selectors } from '../state/selectors.js';
import { setShowFavoritePages, expandReport, collapseReport } from '../state/slice.js';
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
        store.dispatch(setShowFavoritePages({ showFavoritePages: !this.showFavoritePages }));
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
            <div @click=${this.expand}><sa-icon name="expand" size="20"></sa-icon>Expand</div>
            <div @click=${this.collapse}><sa-icon name="collapse" size="20"></sa-icon>Collapse</div>
            <div
                ?disabled=${showFavoritePagesDisabled}
                @click=${!showFavoritePagesDisabled ? this.toggleShowFavorites : _ => {}}
            >
                <sa-icon name="star" size="20" fill="${starColor}"></sa-icon>
                ${this.showFavoritePages ? 'Show All' : 'Favorites'}
            </div>
            <div><sa-icon name="doubleArrow" transform="rotate(180)" size="20"></sa-icon>Hide</div>
        `;
    }
}

customElements.define('sa-nav-buttons', NavButtons);
