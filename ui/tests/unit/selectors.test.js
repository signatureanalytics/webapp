const import_ = require('esm-wallaby')(module);
const importDefault_ = m => import_(m).default;

const chai = require('chai');
const should = chai.should();
const { selectors } = import_('../../src/state/selectors.js');

describe('selectors', () => {
    describe('reportEmbedUrl()', () => {
        it('returns undefined with no workspace', () => {
            const reportEmbedUrl = selectors.reportEmbedUrl({});
            const url = reportEmbedUrl('foo');
            should.not.exist(url);
        });
        it('returns undefined with empty workspace', () => {
            const workspace = {};
            const reportEmbedUrl = selectors.reportEmbedUrl({ workspace });
            const url = reportEmbedUrl('foo');
            should.not.exist(url);
        });
        it('returns undefined with no reports', () => {
            const workspace = { reports: {} };
            const reportEmbedUrl = selectors.reportEmbedUrl({ workspace });
            const url = reportEmbedUrl('foo');
            should.not.exist(url);
        });
        it('returns undefined for non-existant report', () => {
            const workspace = { reports: { bar: { embedUrl: 'http://bar/' } } };
            const reportEmbedUrl = selectors.reportEmbedUrl({ workspace });
            const url = reportEmbedUrl('foo');
            should.not.exist(url);
        });
        it('returns embedUrl for existing report', () => {
            const workspace = { reports: { foo: { embedUrl: 'http://foo/' } } };
            const reportEmbedUrl = selectors.reportEmbedUrl({ workspace });
            const url = reportEmbedUrl('foo');
            url.should.equal('http://foo/');
        });
    });
    describe('reports()', () => {
        it('handles 0 reports', () => {
            const workspace = { reports: {} };
            const reports = selectors.reports({ workspace });
            reports.should.have.lengthOf(0);
        });
        it('lists every report', () => {
            const workspace = {
                reports: {
                    foo: { id: 'foo', pages: [], expanded: false },
                    bar: { id: 'bar', pages: [], expanded: false },
                },
            };

            const names = Object.keys(workspace.reports);
            const reports = selectors.reports({ workspace });
            reports.should.have.lengthOf(2);
            reports.every((report, i) => {
                report.should.have.property('name', names[i]);
                report.should.have.property('id', names[i]);
            });
        });
    });
    describe('reportById()', () => {
        it('returns undefined for non-existant report', () => {
            const workspace = { reports: { bar: { id: 'bar', pages: [], expanded: false } } };
            const reportById = selectors.reportById({ workspace });
            const report = reportById('foo');
            should.not.exist(report);
        });
        it('returns existing report', () => {
            const workspace = {
                reports: {
                    foo: { id: 'foo', pages: [], expanded: false },
                    bar: { id: 'bar', pages: [], expanded: false },
                },
            };
            const reportById = selectors.reportById({ workspace });
            const report = reportById('foo');
            report.should.have.property('id', 'foo');
            report.should.have.property('name', 'foo');
        });
    });
    describe('selectedReport()', () => {
        it('returns undefined when selectedReportId is not defined', () => {
            const state = {
                selectedReportId: undefined,
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [], expanded: false },
                    },
                },
            };
            const report = selectors.selectedReport(state);
            should.not.exist(report);
        });
        it('returns undefined for non-existent selected report', () => {
            const state = {
                selectedReportId: 'bar',
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [], expanded: false },
                    },
                },
            };
            const report = selectors.selectedReport(state);
            should.not.exist(report);
        });
        it('returns existing selected report', () => {
            const state = {
                selectedReportId: 'foo',
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [], expanded: false },
                        bar: { id: 'bar', pages: [], expanded: false },
                    },
                },
            };
            const report = selectors.selectedReport(state);
            report.should.have.property('id', 'foo');
            report.should.have.property('name', 'foo');
        });
    });
    describe('selectedPage()', () => {
        it('returns undefined when selectedReportId is undefined', () => {
            const state = {
                selectedReportId: undefined,
                selectedPageId: 'page1',
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [{ id: 'page1' }], expanded: false },
                    },
                },
            };
            const page = selectors.selectedPage(state);
            should.not.exist(page);
        });
        it('returns undefined for non-existent selected report', () => {
            const state = {
                selectedReportId: 'bar',
                selectedPageId: 'page1',
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [{ id: 'page1' }], expanded: false },
                    },
                },
            };
            const page = selectors.selectedPage(state);
            should.not.exist(page);
        });
        it('returns undefined when selectedPageId is undefined', () => {
            const state = {
                selectedReportId: 'foo',
                selectedPageId: undefined,
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [{ id: 'page1' }], expanded: false },
                    },
                },
            };
            const page = selectors.selectedPage(state);
            should.not.exist(page);
        });
        it('returns undefined for non-existent selected page', () => {
            const state = {
                selectedReportId: 'foo',
                selectedPageId: 'page2',
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [{ id: 'page1' }], expanded: false },
                    },
                },
            };
            const page = selectors.selectedPage(state);
            should.not.exist(page);
        });
        it('returns existing selected page', () => {
            const state = {
                selectedReportId: 'foo',
                selectedPageId: 'page1',
                workspace: {
                    reports: {
                        foo: { id: 'foo', pages: [{ id: 'page1' }], expanded: false },
                    },
                },
            };
            const page = selectors.selectedPage(state);
            page.should.have.property('id').that.equals('page1');
        });
    });
    describe('reportBySlug()', () => {
        it('returns undefined when no report has a matching slug', () => {
            const workspace = {
                reports: {
                    'This is a report name': { id: 'foo', pages: [{ id: 'page1' }], expanded: false },
                },
            };
            const reportBySlug = selectors.reportBySlug({ workspace });
            const report = reportBySlug('this-report-doesn-t-exist');
            should.not.exist(report);
        });
        it('returns report with matching slug', () => {
            const workspace = {
                reports: {
                    'This is a report name': { id: 'foo', pages: [{ id: 'page1' }], expanded: false },
                },
            };
            const reportBySlug = selectors.reportBySlug({ workspace });
            const report = reportBySlug('this-is-a-report-name');
            report.should.have.property('name', 'This is a report name');
        });
    });
    describe('pageBySlugs()', () => {
        it('returns undefined when no report has a matching slug', () => {
            const workspace = {
                reports: {
                    'This is a report name': {
                        id: 'foo',
                        pages: [{ name: 'This is a page name' }],
                        expanded: false,
                    },
                },
            };
            const reportBySlug = selectors.pageBySlugs({ workspace });
            const report = reportBySlug('this-report-doesn-t-exist', 'this-is-a-page-name');
            should.not.exist(report);
        });
        it('returns undefined when no page has a matching slug', () => {
            const workspace = {
                reports: {
                    'This is a report name': {
                        id: 'foo',
                        pages: [{ name: 'This is a page name' }],
                        expanded: false,
                    },
                },
            };
            const pageBySlugs = selectors.pageBySlugs({ workspace });
            const page = pageBySlugs('this-is-a-report-name', 'this-page-doesn-t-exist');
            should.not.exist(page);
        });
        it('returns page matching report slug and page slug', () => {
            const workspace = {
                reports: {
                    'This is a report name': {
                        id: 'foo',
                        pages: [{ name: 'This is a page name' }],
                        expanded: false,
                    },
                },
            };
            const pageBySlugs = selectors.pageBySlugs({ workspace });
            const page = pageBySlugs('this-is-a-report-name', 'this-is-a-page-name');
            page.should.have.property('name', 'This is a page name');
        });
    });
    describe('title()', () => {
        it('works with no workpace, report, or page', () => {
            const title = selectors.title({});
            title.should.matches(/^Co:Vantage™$/);
        });
        it('works with no workpace name, report, or page', () => {
            const title = selectors.title({ workspace: {} });
            title.should.matches(/^Co:Vantage™$/);
        });
        it('works with no report, or page', () => {
            const title = selectors.title({ workspace: { name: 'WorkspaceName' } });
            title.should.matches(/^Co:Vantage™ WorkspaceName$/);
        });
        it('works with no page', () => {
            const title = selectors.title({
                selectedReportId: 'report',
                workspace: { name: 'WorkspaceName', reports: { ReportName: { id: 'report' } } },
            });
            title.should.matches(/^Co:Vantage™ WorkspaceName ReportName Report$/);
        });
        it('works with no page name', () => {
            const title = selectors.title({
                selectedReportId: 'report',
                selectedPageId: 'page',
                workspace: {
                    name: 'WorkspaceName',
                    reports: { ReportName: { id: 'report', pages: [{ id: 'page' }] } },
                },
            });
            title.should.matches(/^Co:Vantage™ WorkspaceName ReportName Report$/);
        });
        it('works with workspace, report, and page', () => {
            const title = selectors.title({
                selectedReportId: 'report',
                selectedPageId: 'page',
                workspace: {
                    name: 'WorkspaceName',
                    reports: { ReportName: { id: 'report', pages: [{ id: 'page', name: 'PageName' }] } },
                },
            });
            title.should.matches(/^Co:Vantage™ WorkspaceName ReportName Report - PageName$/);
        });
    });
});
