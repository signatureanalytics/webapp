import { css } from 'lit';

export default css`
    :host {
        border-right: 2px solid #ddd;
        overflow: hidden;
        position: relative;
    }
    nav {
        overflow-y: auto;
        height: 100%;
    }
    .report,
    .page {
        cursor: pointer;
        font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;
    }
    .name {
        display: inline-block;
        width: 225px;
        padding: 3px;
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
    }
    :not(.loading):not(.selected) > .name:hover {
        background-color: #ddd;
    }
    .selected > .name {
        font-weight: 600;
    }
    .expander {
        height: 22px;
        vertical-align: top;
        transition: transform 200ms ease-out;
        transform: rotate(-90deg);
    }
    .report {
        margin-left: 0px;
        font-size: 16px;
    }
    .page {
        margin-left: 34px;
        font-size: 16px;
        overflow: hidden;
        max-height: 0;
        transition: max-height 200ms ease-out;
    }
    .report.expanded .page {
        max-height: 26px;
    }
    .report.expanded .expander {
        transform: rotate(0deg);
    }
    .loading > .name::after {
        content: '...';
        animation: ellipsis 900ms linear infinite;
        width: 20px;
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
