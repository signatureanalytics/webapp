import { createSelector, defaultMemoize as memoize } from 'reselect';
import slug from '../slug';

export const createSelectors = state => {
    const workspace = createSelector([state], state => state.workspace);
    const user = createSelector([state], state => state.user);
    const selectedReportId = createSelector([state], state => state.selectedReportId);
    const selectedPageId = createSelector([state], state => state.selectedPageId);
    const loadingReportId = createSelector([state], state => state.loadingReportId);
    const loadingPageId = createSelector([state], state => state.loadingPageId);

    const reportEmbedUrl = createSelector([workspace], workspace =>
        memoize(reportName => workspace.reports[reportName]?.embedUrl ?? '')
    );
    const reports = createSelector([workspace], workspace =>
        Object.entries(workspace.reports)
            .map(([name, { id, pages, expanded }]) => ({ name, id, pages, expanded }))
            .sort(({ name: a }, { name: b }) => a.localeCompare(b))
    );

    const reportById = createSelector([reports], reports => memoize(id => reports.find(report => report.id === id)));

    const pages = createSelector(
        [reportById, selectedReportId],
        (reportById, selectedReportId) => reportById(selectedReportId)?.pages ?? []
    );
    const pageById = createSelector([pages], pages => memoize(id => pages.find(page => page.id === id)));

    const reportBySlug = createSelector([reports], reports =>
        memoize(reportSlug => reports.find(r => slug(r.name) === reportSlug))
    );
    const pageBySlug = createSelector([pages], pages =>
        memoize(pageSlug => pages.find(p => slug(p.name) === pageSlug))
    );
    const reportSlug = createSelector([reports], reports => memoize(report => slug(report.name)));
    const pageSlug = createSelector([pages], pages => memoize(page => slug(page.name)));

    return {
        loadingReportId,
        loadingPageId,
        pageById,
        pageBySlug,
        pages,
        pageSlug,
        reportById,
        reportBySlug,
        reportEmbedUrl,
        reports,
        reportSlug,
        selectedPageId,
        selectedReportId,
        workspace,
        user,
    };
};

export const selectors = createSelectors(state => state);
