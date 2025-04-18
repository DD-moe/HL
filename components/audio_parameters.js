function audioParem() {
    var iframe = document.getElementById('pdf-frame');
    if (iframe) {
        iframe.src = `./CTCAE.pdf`;
    } else {
        console.error('Brak elementu iframe na stronie.');
    }
}

window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});