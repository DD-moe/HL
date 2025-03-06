class ToggleContent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .minimized { cursor: pointer; }
                .expanded { display: none; border: 1px solid #ccc; padding: 10px; background: white; }
                .controls { position: absolute; top: 10px; right: 10px; }
                .controls button { background: none; border: none; font-size: 18px; cursor: pointer; }
            </style>
            <div class="minimized"><slot name="minimized"></slot></div>
            <div class="expanded">
                <div class="controls">
                    <button class="minimize" title="Zminimalizuj">🟡</button>
                    <button class="fullscreen-btn" title="Pełny ekran">🟢</button>
                    <button class="exit-fullscreen" title="Zamknij pełny ekran">🔴</button>
                </div>
                <slot name="expanded"></slot>
            </div>
        `;

        this.minimized = this.shadowRoot.querySelector('.minimized');
        this.expanded = this.shadowRoot.querySelector('.expanded');
        this.minimizeBtn = this.shadowRoot.querySelector('.minimize');
        this.fullscreenBtn = this.shadowRoot.querySelector('.fullscreen-btn');
        this.exitFullscreenBtn = this.shadowRoot.querySelector('.exit-fullscreen');

        this.minimized.addEventListener('click', () => this.expand());
        this.minimizeBtn.addEventListener('click', () => this.minimize());
        this.fullscreenBtn.addEventListener('click', () => this.enterFullscreen());
        this.exitFullscreenBtn.addEventListener('click', () => this.exitFullscreen());
    }

    expand() {
        this.minimized.style.display = 'none';
        this.expanded.style.display = 'block';
    }

    minimize() {
        this.exitFullscreen();
        this.expanded.style.display = 'none';
        this.minimized.style.display = 'block';
    }

    enterFullscreen() {
        if (this.expanded.requestFullscreen) {
            this.expanded.requestFullscreen();
        } else if (this.expanded.mozRequestFullScreen) { // Firefox
            this.expanded.mozRequestFullScreen();
        } else if (this.expanded.webkitRequestFullscreen) { // Chrome, Safari, Opera
            this.expanded.webkitRequestFullscreen();
        } else if (this.expanded.msRequestFullscreen) { // IE/Edge
            this.expanded.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }
}


class ScriptList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Add the refresh button to the shadow DOM
        this.shadowRoot.innerHTML = `
            <style>
                pre {
                    font-family: monospace;  /* Use monospace font */
                    white-space: pre-wrap;    /* Wrap text within the element */
                    background-color: #f4f4f4; /* Background for better code readability */
                    padding: 10px;           /* Add spacing around text */
                    border-radius: 5px;      /* Rounded corners */
                    overflow-x: auto;        /* Horizontal scrolling if necessary */
                }
                div.specific-class li  {
                    border: 1px solid black; /* Red border around list element */
                    margin: 5px 0;          /* Spacing between list elements */
                    padding: 10px;          /* Padding for better visibility */
                }
            </style>                
            <button data-refresh title="Odśwież">🔄</button>
            <div data-content class="specific-class"></div>
        `;
    }

    connectedCallback() {
        this.render();
        // Use querySelector to select the refresh button in shadow DOM
        this.shadowRoot.querySelector("[data-refresh]").addEventListener("click", () => this.render());
    }

    render() {
        const scripts = document.querySelectorAll("script:not([data-no-list])");
        const showEmbedded = this.hasAttribute("data-list-embedded");

        let html = "<h3>Załączone skrypty:</h3><ul>";
        scripts.forEach(script => {
            const desc = script.getAttribute("data-opis") || "Brak opisu";
            const type = script.getAttribute("type") || "domyślny";
            const src = script.getAttribute("src") || "(wbudowany kod)";
            if (type !== 'domyślny') {
                html += `<li><strong>${desc}</strong>: <a href="${src}" target="_blank">${src}</a> - ${type}</li>`;
            }
        });
        html += "</ul>";

        if (showEmbedded) {
            html += "<h3>Wbudowane skrypty:</h3><ul>";
            scripts.forEach(script => {
                if (!script.hasAttribute("src")) {
                    const code = script.textContent.trim(); // Correctly extract script text
                    html += `<li><div><pre>${code}</pre></div></li>`;  // Use pre for better code display
                }
            });
            html += "</ul>";
        }

        // Use querySelector to update the content of the div in shadow DOM
        const contentDiv = this.shadowRoot.querySelector("[data-content]");
        if (contentDiv) {
            contentDiv.innerHTML = html;
        }
    }
}

customElements.define("script-list", ScriptList);
customElements.define('toggle-content', ToggleContent);

export {ToggleContent, ScriptList};