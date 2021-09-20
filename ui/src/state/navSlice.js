import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    reports: [],
    pages: [],
    currentReport: undefined,
    currentPage: { name: undefined, displayName: undefined },
    loadReport: undefined,
};

const navSlice = createSlice({
    name: 'nav',
    initialState,
    reducers: {
        selectReport(state, { payload: { report } }) {
            if (report !== state.currentReport) {
                state.currentReport = report;
            }
        },
        loadReport(state, { payload: { report } }) {
            state.loadReport = report;
        },
        selectPage(state, { payload: { page } }) {
            if (page !== state.currentPage) {
                state.currentPage = page;
            }
        },
        setReports(state, { payload: { reports } }) {
            state.reports = reports;
        },
        setPages(state, { payload: { pages } }) {
            state.pages = pages;
            state.currentPage = pages[0].name;
        },
    },
});

export const { selectReport, selectPage, setReports, setPages, loadReport } = navSlice.actions;
export default navSlice.reducer;
