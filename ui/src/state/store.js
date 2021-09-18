import { configureStore } from '@reduxjs/toolkit';
import navReducer from './slice';

const store = configureStore({
    reducer: {
        nav: navReducer,
    },
    devTools: true,
});

export default store;
