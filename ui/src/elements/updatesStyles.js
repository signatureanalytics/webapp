import { css } from 'lit';

export default css`
    :host {
        font-family: var(--font-body);
        font-size: 16px;
        position: relative;
        width: 275px;
        overflow-x: hidden;
    }
    .updates {
        padding: 10px;
        border-right: 2px solid #ddd;
        border-top: 2px solid #ddd;
        white-space: nowrap;
    }
    .update-list {
        height: 40px;
        transition: height 200ms ease;
        background-color: white;
        width: 100%;
    }
    .updates.expanded .update-list {
        height: 175px;
    }
    .update {
        margin: 3px 3px 0 3px;
        cursor: default;
    }
    sa-button[name='doubleArrow'] {
        float: right;
        width: 30px;
        height: 30px;
        cursor: pointer;
    }
    h4 {
        margin: 0;
    }
`;
