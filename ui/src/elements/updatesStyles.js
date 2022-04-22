import { css } from 'lit';

export default css`
    :host {
        font-family: var(--font-body);
        font-size: 16px;
    }
    .updates {
        padding: 10px;
        border-right: 2px solid #ddd;
        border-top: 2px solid #ddd;
    }
    .update-list {
        overflow: hidden;
        height: 40px;
        transition: height 200ms ease;
    }
    .updates.expanded .update-list {
        height: 175px;
    }
    .update {
        padding: 3px 3px 0 3px;
        cursor: default;
    }
    sa-icon {
        display: inline-block;
    }
    sa-icon[name='doubleArrow'] {
        float: right;
        cursor: pointer;
    }
    h4 {
        margin-block: 0;
    }
`;
