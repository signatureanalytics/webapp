import { createSelector, defaultMemoize } from 'reselect';
import slug from '../slug';

export const createNavSelectors = nav => {
    const reports = createSelector([nav], nav => nav.reports);
    const pages = createSelector([nav], nav => nav.pages);
    const currentReport = createSelector([nav], nav => nav.currentReport);
    const currentPage = createSelector([nav], nav => nav.currentPage);
    const loadReport = createSelector([nav], nav => nav.loadReport);

    const currentReportSlug = createSelector([currentReport], currentReport => slug(currentReport));
    const slugForPageName = createSelector([pages], pages =>
        defaultMemoize(pageName => slug(pages.find(p => p.name === pageName)?.displayName))
    );

    const currentPageDisplayName = createSelector(
        [currentPage, pages],
        (currentPage, pages) => pages.find(p => p.name === currentPage)?.displayName
    );
    const currentPageSlug = createSelector([currentPageDisplayName], currentPageDisplayName =>
        slug(currentPageDisplayName)
    );
    const currentTitle = createSelector(
        [currentReport, currentPageDisplayName],
        (currentReport, currentPageDisplayName) =>
            `${
                currentReport
                    ? `${currentReport} Report${currentPageDisplayName ? `: ${currentPageDisplayName}` : ''}`
                    : ''
            }`
    );

    const reportBySlug = createSelector([reports], reports =>
        defaultMemoize(reportSlug => reports.find(r => slug(r) === reportSlug))
    );
    const pageNameBySlug = createSelector([pages], pages =>
        defaultMemoize(pageSlug => pages.find(p => slug(p.displayName) === pageSlug).name)
    );
    const slugForPageIndex = createSelector([pages], pages => defaultMemoize(index => slug(pages[index].displayName)));
    const slugForReportIndex = createSelector([reports], reports => defaultMemoize(index => slug(reports[index])));

    return {
        currentPage,
        currentPageDisplayName,
        currentPageSlug,
        currentReport,
        currentReportSlug,
        currentTitle,
        loadReport,
        pageNameBySlug,
        pages,
        reportBySlug,
        reports,
        slugForPageIndex,
        slugForPageName,
        slugForReportIndex,
    };
};

export const navSelectors = createNavSelectors(state => state.nav);
