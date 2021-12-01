import { configureStore } from '@reduxjs/toolkit';
import { LitElement } from 'lit';
import reducer from './slice';

export const store = configureStore({
    reducer,
    devTools: import.meta.env.NODE_ENV === 'development',
});

export class ConnectedLitElement extends LitElement {
    connectedCallback() {
        super.connectedCallback();
        this._storeUnsubscribe = store.subscribe(() => this.stateChanged(store.getState()));
        this.stateChanged(store.getState());
    }

    disconnectedCallback() {
        this._storeUnsubscribe();
        super.disconnectedCallback();
    }

    stateChanged(_state) {}
}
