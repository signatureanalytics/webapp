import { css } from 'lit';

export default css`
    :host {
        border-right: 2px solid #ddd;
    }
    nav {
        overflow-y: auto;
    }
    div {
        cursor: pointer;
        font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;
        margin-top: 2px;
        padding: 3px;
        width: 225px;
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
    }
    div:hover:not(.loading):not(.selected) {
        background-color: #ddd;
    }
    .selected {
        font-weight: 600;
    }
    .report {
        margin-left: 12px;
        font-size: 16px;
    }
    .report.loading::after {
        content: '...';
        animation: ellipsis 900ms linear infinite;
        width: 20px;
    }
    .page {
        margin-left: 24px;
        font-size: 16px;
    }
    .page + .report {
        margin-top: 10px;
    }
    @keyframes ellipsis {
        0% {
            content: '...';
        }
        8% {
            content: ' ..';
        }
        16% {
            content: ' \\a0 .';
        }
        24% {
            content: '';
        }
        32% {
            content: ' \\a0 .';
        }
        40% {
            content: ' ..';
        }
        48% {
            content: '...';
        }
        54% {
            content: '..';
        }
        62% {
            content: '.';
        }
        70% {
            content: '';
        }
        76% {
            content: '';
        }
        84% {
            content: '.';
        }
        92% {
            content: '..';
        }
        100% {
            content: '...';
        }
    }
`;
