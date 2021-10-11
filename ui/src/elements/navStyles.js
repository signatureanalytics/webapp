import { css } from 'lit';

export default css`
    :host {
        border-right: 2px solid #ddd;
        overflow: hidden;
        position: relative;
        user-select: none;
        -webkit-user-select: none;
        font-family: var(--font-body);
    }
    nav {
        overflow-y: auto;
        height: 100%;
    }
    a,
    a:visited,
    a:active {
        color: black;
        text-decoration: none;
        outline-offset: -2px;
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
        background-color: #eee;
    }
    .selected.page > .name,
    .selected.report:not(.expanded) > .name {
        background-color: #ddd;
    }
    .expander {
        height: 22px;
        width: 22px;
        vertical-align: top;
        transition: transform 200ms ease-out;
        transform: rotate(-90deg);
        cursor: pointer;
    }
    .report {
        margin-left: 0px;
        font-size: 16px;
        white-space: nowrap;
    }
    .page {
        margin-left: 30px;
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
