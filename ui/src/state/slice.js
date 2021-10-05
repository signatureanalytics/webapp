import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: { email: undefined, identityProvider: undefined, id: undefined, roles: [] },
    workspace: { name: undefined, id: undefined, token: undefined, tokenId: undefined, tokenExpires: 0, reports: [] },
    selectedReportId: undefined,
    selectedPageId: undefined,
    loadingReportId: undefined,
};

const slice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setWorkspaceToken(state, { payload: { token, tokenId, tokenExpires } }) {
            state.workspace = { ...state.workspace, token, tokenId, tokenExpires };
        },
        setWorkspace(state, { payload: { workspace } }) {
            state.workspace = workspace;
        },
        selectReportId(state, { payload: { reportId } }) {
            if (reportId !== state.selectedReportId) {
                state.selectedReportId = reportId;
                Object.values(state.workspace.reports).find(
                    report => report.id === state.selectedReportId
                ).expanded = true;
            }
        },
        selectPageId(state, { payload: { pageId } }) {
            if (pageId !== state.selectedPageId) {
                state.selectedPageId = pageId;
            }
        },
        loadReportId(state, { payload: { reportId } }) {
            state.loadingReportId = reportId;
        },
        loadPageId(state, { payload: { pageId, reportId } }) {
            state.loadingPageId = pageId;
            if (reportId) {
                state.loadingReportId = reportId;
            }
        },
        collapseReport(state, { payload: { reportId } }) {
            Object.values(state.workspace.reports).find(report => report.id === reportId).expanded = false;
        },
        expandReport(state, { payload: { reportId } }) {
            Object.values(state.workspace.reports).find(report => report.id === reportId).expanded = true;
        },
        setUser(state, { payload: { email, id, identityProvider, roles } }) {
            state.user = { email, id, identityProvider, roles };
        },
    },
});

export const {
    setUser,
    setWorkspaceToken,
    setWorkspace,
    selectReportId,
    selectPageId,
    loadReportId,
    loadPageId,
    collapseReport,
    expandReport,
} = slice.actions;
export default slice.reducer;
