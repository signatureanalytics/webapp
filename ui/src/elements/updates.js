import './icon.js';
import './button.js';

import { classMap } from 'lit/directives/class-map.js';
import { html } from 'lit';

import updatesStyles from './updatesStyles.js';
import { ConnectedLitElement, store } from '../state/store.js';
import { selectors } from '../state/selectors';
import { toggleShowMoreUpdates } from '../state/slice.js';

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
        updates: Object,
        pendingUpdates: Object,
        selectedReport: Object,
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
        unknown: html`<sa-icon name="running" size="14"></sa-icon>`,
        disabled: html`<sa-icon name="disabled" size="14" stroke="darkgrey"></sa-icon>`,
    };

    renderUpdate({ when, status, serviceExceptionJson }) {
        const classes = {
            update: true,
            [status.toLowerCase()]: true,
        };
        let message = status === 'Unknown' ? 'Running' : status;

        if (status === 'Failed') {
            try {
                const exceptionJson = JSON.parse(serviceExceptionJson);
                if (exceptionJson.errorDescription) {
                    try {
                        const table = exceptionJson.errorDescription.match(/Table: (?<table>\w+).$/)?.groups?.table;
                        const description = JSON.parse(exceptionJson.errorDescription);
                        message += `: ${
                            JSON.parse(description.replace(/}[^}]*$/, '}'))?.error['pbi.error']?.details?.find(
                                d => d.code === 'DM_ErrorDetailNameCode_UnderlyingErrorMessage'
                            )?.detail?.value
                        } ${table ? ` (Table ${table})` : ``} `;
                    } catch (e) {
                        message += `: ${exceptionJson.errorDescription.replace(/<\/?pii>/g, '')}`;
                    }
                }
            } catch (error) {}
        }
        return html`<div class=${classMap(classes)} title="Update ${message}">
            ${this.icons[status.toLowerCase()]} ${dateFormatter.format(new Date(when ?? Date.now())).replace(',', '')}
        </div>`;
    }

    toggleShowMoreUpdates() {
        store.dispatch(toggleShowMoreUpdates());
    }

    getUpdates() {
        if (this.showMoreUpdates) {
            return [
                ...this.updates,
                ...this.pendingUpdates?.map(update => ({
                    when: update,
                    status: 'Pending',
                })),
            ];
        } else {
            const updates = [];
            const update = [...this.updates].reverse().find(update => update.status !== 'Unknown');
            const runningUpdate = [...this.updates].reverse().find(update => update.status === 'Unknown');
            const pendingUpdate = this.pendingUpdates?.[0]
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
            <h4 @click=${this.toggleShowMoreUpdates}>
                Updates<sa-button
                    name="doubleArrow"
                    size="20"
                    transform="rotate(${this.showMoreUpdates ? 90 : -90})"
                    title="${this.showMoreUpdates ? 'Collpse' : 'Expand'} updates"
                ></sa-button>
            </h4>
            <div class="update-list">${this.getUpdates().map(update => this.renderUpdate(update))}</div>
        </div>`;
    }
}

customElements.define('sa-updates', Updates);
