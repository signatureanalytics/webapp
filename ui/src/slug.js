export default pageName => encodeURIComponent(pageName.toLowerCase()).replace(/(?:-|(?:%[0-9a-z]{2}))+/gi, '-');
