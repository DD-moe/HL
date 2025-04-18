function audioParem() {
    const container = document.getElementById('container');

    // Wyczyść kontener
    container.innerHTML = '';

    // Załaduj obrazy od 0 do 17
    for (let nr = 0; nr <= 17; nr++) {
        const img = document.createElement('img');
        img.src = `./images/CTCAE-obrazy-${nr}.jpg`;
        img.alt = `Obraz ${nr}`;
        img.classList.add('page-image');
        container.appendChild(img);
    }
}

window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});