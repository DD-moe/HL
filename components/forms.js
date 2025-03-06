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

    customElements.define('toggle-content', ToggleContent);

    export {ToggleContent};