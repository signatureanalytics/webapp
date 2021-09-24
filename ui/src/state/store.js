import { configureStore } from '@reduxjs/toolkit';
import navReducer from './navSlice';

const store = configureStore({
    reducer: {
        nav: navReducer,
    },
    devTools: true,
});

export default store;
