import { css } from 'lit';

export default css`
    header {
        box-sizing: border-box;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 300px auto min-content;
        grid-template-areas: 'logo title clientLogo' 'logo title userEmail';
        gap: 5px 10px;
        position: relative;
        height: 100%;
        padding: 10px 16px;
        border-bottom: 2px solid #ddd;
    }
    .logo {
        position: relative;
        height: 60px;
        grid-area: logo;
    }
    .title {
        grid-area: title;
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
    .clientLogo {
        grid-area: clientLogo;
        max-height: 35px;
        justify-self: center;
    }
    .userEmail {
        font-family: var(--font-body);
        font-size: 18px;
        margin: auto;
        padding-inline: 14px;
        grid-area: userEmail;
    }
    svg {
        fill: #ddd;
    }
    .favoritePage svg {
        fill: #4688ba;
    }
`;
