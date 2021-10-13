(async _ => {
    const { clientPrincipal } = await fetch('./.auth/me').then(response =>
        response.ok ? response.json() : { clientPrincipal: {} }
    );

    const ui = document.querySelector('.userinfo');
    ui.innerHTML = clientPrincipal
        ? Object.entries(clientPrincipal)
              .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
              .join('')
        : '';
})();
