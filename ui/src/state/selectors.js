import { createSelector, defaultMemoize as memoize } from 'reselect';
import slug from '../slug';

export const createSelectors = state => {
    const workspace = createSelector([state], state => state.workspace);
    const selectedReport = createSelector([state], state => state.selectedReport);
    const selectedPage = createSelector([state], state => state.selectedPage);
    const loadingReport = createSelector([state], state => state.loadingReport);

    const reports = createSelector([workspace], workspace =>
        Object.entries(workspace.reports)
            .map(([name, { id }]) => ({ name, id }))
            .sort(({ name: a }, { name: b }) => a.localeCompare(b))
    );

    const pages = createSelector(
        [workspace, selectedReport],
        (workspace, selectedReport) => workspace.reports[selectedReport.name]?.pages ?? []
    );
    const reportEmbedUrl = createSelector([workspace], workspace =>
        memoize(reportName => workspace.reports[reportName]?.embedUrl ?? '')
    );
    const reportById = createSelector([reports], reports => memoize(id => reports.find(r => r.id === id)));
    const pageById = createSelector([pages], pages => memoize(id => pages.find(p => p.id === id)));
    const reportBySlug = createSelector([reports], reports =>
        memoize(reportSlug => reports.find(r => slug(r.name) === reportSlug))
    );
    const pageBySlug = createSelector([pages], pages =>
        memoize(pageSlug => pages.find(p => slug(p.name) === pageSlug))
    );
    const reportSlug = createSelector([reports], reports => memoize(report => slug(report.name)));
    const pageSlug = createSelector([pages], pages => memoize(page => slug(page.name)));

    return {
        loadingReport,
        pageById,
        pageBySlug,
        pages,
        reportById,
        reportBySlug,
        reportEmbedUrl,
        reports,
        selectedPage,
        selectedReport,
        reportSlug,
        pageSlug,
        workspace,
    };
};

export const selectors = createSelectors(state => state);
