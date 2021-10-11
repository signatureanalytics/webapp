import { css } from 'lit';

export default css`
    header {
        box-sizing: border-box;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 300px auto min-content;
        gap: 10px;
        position: relative;
        height: 100%;
        padding: 10px 16px;
        border-bottom: 2px solid #ddd;
    }
    .logo {
        position: relative;
        height: 60px;
    }
    h1,
    h2 {
        text-align: center;
        font-family: var(--font-header);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: auto;
    }
    h1 {
        font-size: 28px;
    }
    h2 {
        font-size: 22px;
        margin-top: 2px;
    }
    .userinfo {
        vertical-align: bottom;
        font-family: var(--font-body);
        font-size: 18px;
        margin: auto;
        padding-inline: 14px;
    }
`;
