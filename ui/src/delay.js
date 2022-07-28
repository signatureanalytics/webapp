export default (fn, ms) => {
    let timeout;

    return (...args) => {
        if (timeout) {
            timeout = clearTimeout(timeout);
        }
        timeout = setTimeout(_ => {
            timeout = undefined;
            fn(...args);
        }, ms);
    };
};
