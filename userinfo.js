const { clientPrincipal } = await fetch('./.auth/me').then(response =>
    response.json()
);

console.log(clientPrincipal);
