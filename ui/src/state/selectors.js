import memoize from 'nano-memoize';
import { createSelectorCreator } from 'reselect';

import slug from '../slug';

const createSelector = createSelectorCreator(memoize);

export const createSelectors = state => {
    const workspace = createSelector(state, state => state.workspace);
    const user = createSelector(state, state => state.user);
    const selectedReportId = createSelector(state, state => state.selectedReportId);
    const selectedPageId = createSelector(state, state => state.selectedPageId);
    const loadingReportId = createSelector(state, state => state.loadingReportId);
    const loadingPageId = createSelector(state, state => state.loadingPageId);

    const reportEmbedUrl = createSelector(workspace, workspace =>
        memoize(reportName => workspace?.reports?.[reportName]?.embedUrl)
    );

    const reports = createSelector(workspace, workspace => {
        return Object.entries(workspace?.reports ?? {})
            .map(([name, { id, pages, expanded }]) => ({ name, id, pages, expanded }))
            .sort(({ name: a }, { name: b }) => a.localeCompare(b));
    });
    const reportById = createSelector(reports, reports => memoize(id => reports.find(report => report.id === id)));
    const selectedReport = createSelector(selectedReportId, reportById, (id, reportById) => reportById(id));
    const selectedPage = createSelector(selectedPageId, selectedReport, (id, report) =>
        report?.pages?.find(p => p.id === id)
    );

    const reportBySlug = createSelector(reports, reports =>
        memoize(reportSlug => reports.find(r => slug(r.name) === reportSlug))
    );
    const pageBySlugs = createSelector(reportBySlug, reportBySlug =>
        memoize((reportSlug, pageSlug) => reportBySlug(reportSlug)?.pages?.find(p => slug(p.name) === pageSlug))
    );

    const title = createSelector(workspace, selectedReport, selectedPage, (workspace, report, page) => {
        const workspaceName = workspace?.name;
        const reportName = report?.name;
        const pageName = page?.name;
        return `Co:Vantage™${
            workspaceName
                ? ` ${workspaceName}${reportName ? ` ${reportName} Report${pageName ? ` - ${pageName}` : ''}` : ''}`
                : ''
        }`;
    });

    return {
        loadingReportId,
        loadingPageId,
        reportById,
        reportBySlug,
        pageBySlugs,
        reportEmbedUrl,
        reports,
        selectedPage,
        selectedPageId,
        selectedReport,
        selectedReportId,
        title,
        workspace,
        user,
    };
};

export const selectors = createSelectors(state => state);
