import { configureStore } from '@reduxjs/toolkit';

import reducer from './slice';

const store = configureStore({
    reducer,
    devTools: import.meta.env.NODE_ENV === 'development',
});

export default store;
