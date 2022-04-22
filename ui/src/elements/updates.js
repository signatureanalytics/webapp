import { ConnectedLitElement, store } from '../state/store.js';
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import updatesStyles from './updatesStyles.js';
import { selectors } from '../state/selectors';
import { toggleShowMoreUpdates } from '../state/slice.js';
import './icon.js';

const dateFormatter = Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
});

class Updates extends ConnectedLitElement {
    static styles = updatesStyles;
    static properties = {
        updates: Array,
        pendingUpdates: Array,
        showMoreUpdates: Boolean,
    };

    stateChanged(state) {
        for (const name in this.constructor.properties) {
            this[name] = selectors[name](state);
        }
    }

    icons = {
        pending: html`<sa-icon name="pending" size="14"></sa-icon>`,
        completed: html`<sa-icon name="completed" size="14" stroke="green"></sa-icon>`,
        failed: html`<sa-icon name="failed" size="14" stroke="red"></sa-icon>`,
        running: html`<sa-icon name="running" size="14"></sa-icon>`,
        disabled: html`<sa-icon name="disabled" size="14" stroke="darkgrey"></sa-icon>`,
    };
    renderUpdate({ when, status }) {
        const classes = {
            update: true,
            [status.toLowerCase()]: true,
        };
        return html`<div class=${classMap(classes)} title="Update ${status}">
            ${this.icons[status.toLowerCase()]} ${dateFormatter.format(new Date(when)).replace(',', '')}
        </div>`;
    }

    toggleShowMoreUpdates() {
        store.dispatch(toggleShowMoreUpdates());
    }

    getUpdates() {
        if (this.showMoreUpdates) {
            return [
                ...this.updates,
                ...this.pendingUpdates.map(update => ({
                    when: update,
                    status: 'Pending',
                })),
            ];
        } else {
            const updates = [];
            const update = [...this.updates].reverse().find(update => update.status !== 'Unknown');
            const runningUpdate = [...this.updates].reverse().find(update => update.status === 'Unknown');
            const pendingUpdate = this.pendingUpdates[0]
                ? {
                      status: 'Pending',
                      when: this.pendingUpdates[0],
                  }
                : undefined;
            if (update) {
                updates.push(update);
            }
            if (runningUpdate) {
                updates.push(runningUpdate);
            } else if (pendingUpdate) {
                updates.push(pendingUpdate);
            }
            return updates;
        }
    }

    render() {
        const classes = {
            updates: true,
            expanded: this.showMoreUpdates,
        };
        return html`<div class="${classMap(classes)}">
            <h4>
                Updates<sa-icon
                    @click=${this.toggleShowMoreUpdates}
                    name="doubleArrow"
                    size="20"
                    transform="rotate(${this.showMoreUpdates ? 90 : -90})"
                ></sa-icon>
            </h4>
            <div class="update-list">${this.getUpdates().map(update => this.renderUpdate(update))}</div>
        </div>`;
    }
}

customElements.define('sa-updates', Updates);
