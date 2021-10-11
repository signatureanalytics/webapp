import { configureStore } from '@reduxjs/toolkit';
import reducer from './slice';

const store = configureStore({
    reducer,
    devTools: true,
});

export default store;
