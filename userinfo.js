const { clientPrincipal } = await fetch('./.auth/me').then(response =>
    response.json()
);

const ui = document.querySelector('.userinfo');
ui.innerHTML = Object.entries(clientPrincipal)
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join('');
