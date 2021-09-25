import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    workspace: { name: undefined, id: undefined, token: undefined, tokenId: undefined, tokenExpires: 0 },
    reports: [],
    pages: [],
    selectedReport: { name: undefined, id: undefined },
    selectedPage: { name: undefined, id: undefined },
    loadingReport: undefined,
};

const slice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setWorkspaceToken(state, { payload: { token, tokenId, tokenExpires } }) {
            state.workspace = { ...state.workspace, token, tokenId, tokenExpires };
        },
        setWorkspace(state, { payload: { workspace } }) {
            const { reports, ...rest } = workspace;
            state.reports = Object.entries(reports).map(([name, id]) => ({ id, name }));
            state.workspace = rest;
        },
        setPages(state, { payload: { pages } }) {
            state.pages = pages;
            state.selectedPage = pages[0];
        },
        selectReport(state, { payload: { report } }) {
            if (report !== state.selectedReport) {
                state.selectedReport = report;
            }
        },
        selectPage(state, { payload: { page } }) {
            if (page !== state.selectedPage) {
                state.selectedPage = page;
            }
        },
        loadReport(state, { payload: { report } }) {
            state.loadingReport = report;
        },
    },
});

export const { setWorkspaceToken, setWorkspace, setPages, selectReport, selectPage, loadReport } = slice.actions;
export default slice.reducer;
