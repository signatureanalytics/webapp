import { LitElement } from 'lit';
import { configureStore } from '@reduxjs/toolkit';
import { connect } from 'pwa-helpers/connect-mixin';

import reducer from './slice';

export const store = configureStore({
    reducer,
    devTools: import.meta.env.NODE_ENV === 'development',
});

export const ConnectedLitElement = connect(store)(LitElement);
