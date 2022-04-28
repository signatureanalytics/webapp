import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: { email: undefined, identityProvider: undefined, id: undefined, roles: [] },
    workspace: {
        name: undefined,
        id: undefined,
        token: undefined,
        tokenId: undefined,
        tokenExpires: 0,
        reports: [],
        updates: [],
        pendingUpdates: [],
    },
    selectedReportId: undefined,
    selectedPageId: undefined,
    loadingReportId: undefined,
    loadingPageId: undefined,
    favoritePages: [],
    showFavoritePages: false,
    showMoreUpdates: false,
    hideNavSidebar: false,
};

const slice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        // action called when perioodically reauthenticating report with a new workspace embed token
        setWorkspaceToken(state, { payload: { token, tokenId, tokenExpires } }) {
            state.workspace = { ...state.workspace, token, tokenId, tokenExpires };
        },
        // action called when initializing workspace upon page load with result of calling workspace api
        setWorkspace(state, { payload: { workspace } }) {
            state.workspace = workspace;
        },
        // action called to select the specified report
        selectReportId(state, { payload: { reportId } }) {
            if (reportId !== state.selectedReportId) {
                state.selectedReportId = reportId;
                Object.values(state.workspace.reports).find(
                    report => report.id === state.selectedReportId
                ).expanded = true;
            }
        },
        // action called to select the specfied page
        selectPageId(state, { payload: { pageId } }) {
            if (pageId !== state.selectedPageId) {
                state.selectedPageId = pageId;
                state.loadingPageId = pageId;
            }
        },
        // action called to initiate loading of the specified report
        loadReportId(state, { payload: { reportId } }) {
            state.loadingReportId = reportId;
        },
        // action called to initiate loading of the specified page
        loadPageId(state, { payload: { pageId, reportId } }) {
            state.loadingPageId = pageId;
            if (reportId) {
                state.loadingReportId = reportId;
            }
        },
        // action called to collapse the specified report
        collapseReport(state, { payload: { reportId } }) {
            Object.values(state.workspace.reports).find(report => report.id === reportId).expanded = false;
        },
        // action called to expand the specified report
        expandReport(state, { payload: { reportId } }) {
            Object.values(state.workspace.reports).find(report => report.id === reportId).expanded = true;
        },
        // action called to set the user upon page load with result of calling workspace api
        setUser(state, { payload: { email, id, identityProvider, roles } }) {
            state.user = { email, id, identityProvider, roles };
        },
        toggleShowFavoritePages(state, {}) {
            state.showFavoritePages = !state.showFavoritePages;
            localStorage.showFavoritePages = state.showFavoritePages;
        },
        initFavoritePages(state, {}) {
            state.favoritePages = localStorage.favoritePages ? localStorage.favoritePages.split(',') : [];
            state.showFavoritePages = localStorage.showFavoritePages === 'true';
        },
        addFavoritePage(state, { payload: { page } }) {
            const favoritePages = [...new Set([...state.favoritePages, page])];
            localStorage.favoritePages = favoritePages;
            state.favoritePages = favoritePages;
        },
        removeFavoritePage(state, { payload: { page } }) {
            const favoritePages = state.favoritePages.filter(f => f !== page);
            localStorage.favoritePages = favoritePages;
            state.favoritePages = favoritePages;
        },
        // action called to toggle the showMoreUpdates state
        toggleShowMoreUpdates(state, {}) {
            state.showMoreUpdates = !state.showMoreUpdates;
        },
        toggleHideNavSidebar(state, {}) {
            state.hideNavSidebar = !state.hideNavSidebar;
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
    toggleShowFavoritePages,
    initFavoritePages,
    addFavoritePage,
    removeFavoritePage,
    toggleShowMoreUpdates,
    toggleHideNavSidebar,
} = slice.actions;

export default slice.reducer;
