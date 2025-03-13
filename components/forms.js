class ToggleContent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block;}
                .minimized { cursor: pointer;}
                .expanded { display: none; border: 1px solid #ccc; padding: 10px; background: white; position: relative;}
                .controls { position: absolute; top: 10px; right: 10px;}
                .controls button { background: none; border: none; font-size: 18px; cursor: pointer; }
            </style>
            <div class="minimized" part="minimized" ><slot name="minimized"></slot></div>
            <div class="expanded" part="expanded">
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
            const src = script.getAttribute("src");
            const fullSrc = src ? new URL(src, window.location.href).href : "(wbudowany kod)";            
            if (type !== 'domyślny') {
                html += `<li><strong>${desc}</strong>: <a href="${fullSrc}" target="_blank">${src}</a> - ${type}</li>`;
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

class MyRefresh extends HTMLElement {
    constructor() {
        super();

        // Utworzenie Shadow DOM
        this.attachShadow({mode: 'open'});

        // HTML dla Shadow DOM
        this.shadowRoot.innerHTML = `
        <button>🔄</button>
            <div data-container="true">
                <slot></slot>
            </div>
        `;

        // Obsługa kliknięcia przycisku
        const refreshButton = this.shadowRoot.querySelector('button');
        refreshButton.addEventListener('click', () => {
            this.refreshNotes();
        });

        // Obsługa załadowania strony
        window.addEventListener('load', () => {
            this.refreshNotes();
        });
    }

    // Funkcja do odświeżania notatek
    refreshNotes() {
        const slot = this.shadowRoot.querySelector('slot');
        const notes = slot.assignedNodes({flatten: true}).filter(node => node.nodeType === Node.ELEMENT_NODE);

        notes.forEach(note => {
            const referenceId = note.getAttribute('data-reference-id');
            if (referenceId) {
                // Próba pobrania elementu o odpowiednim ID
                const element = document.getElementById(referenceId);
                if (element) {
                    let pre = note.querySelector('pre');
                    if (!pre) {
                        pre = document.createElement('pre');
                        note.appendChild(pre);
                    }
                    // Aktualizacja lub dodanie zawartości do <pre>
                    pre.textContent = element.outerHTML;
                }
            }
        });
    }
}

class EditableElement extends HTMLElement {
    constructor() {
      super();
  
      // Tworzenie shadow DOM
      this.attachShadow({ mode: 'open' });
  
        // Wstawienie HTML do shadow DOM
        this.shadowRoot.innerHTML = `
            <div>
                <input type="checkbox" id="checkbox">
                <label for="checkbox">Włącza edycję elementu DOM po jego kliknięciu.</label>
                <textarea id="editor" part="textarea" class="editor"></textarea>
                <button id="apply">Apply</button>
            </div>
            <style>
                .editor { width: 100%; height: 20vh; font-family: monospace; }
            </style>
        `;

        // Pobranie referencji do elementów
        this.checkbox = this.shadowRoot.querySelector("#checkbox");
        this.textarea = this.shadowRoot.querySelector("#editor");
        this.applyButton = this.shadowRoot.querySelector("#apply");

        // Właściwość przechowująca wybrany element
        this.selected = null;
    }
  
    connectedCallback() {
      // Dodanie event listenera do body
      document.body.addEventListener('click', this.handleBodyClick.bind(this));
      
      // Zdarzenie apply (zaktualizowanie innerHTML z textarea)
      this.applyButton.addEventListener('click', () => {
        if (this.selected) {
          this.selected.innerHTML = this.textarea.value;
        }
      });
    }
  
    disconnectedCallback() {
      // Usunięcie event listenera po odłączeniu komponentu
      document.body.removeEventListener('click', this.handleBodyClick.bind(this));
    }
  
    handleBodyClick(event) {
        // Pobierz ID elementu do zignorowania
        const ignoreId = this.getAttribute('ignore-id');

        // Ignorujemy kliknięcia w checkbox, textarea, applyButton, wewnątrz custom elementu lub element o określonym ID
        if (
            event.target === this.checkbox ||
            event.target === this.textarea ||
            event.target === this.applyButton ||
            this.contains(event.target) ||
            (ignoreId && event.target.id === ignoreId) // Sprawdzamy czy element ma id do zignorowania
        ) {
            return;
        }

      // Jeśli checkbox jest zaznaczony, wybieramy element i kopiujemy jego innerHTML do textarea
      if (this.checkbox.checked) {
        if (this.selected) {
          // Resetujemy poprzedni element
          this.selected.style.border = '';
          console.log(this.selected.style.cssText);
          if (this.selected.style.cssText === '') {
            console.log("0");
            this.selected.removeAttribute('style');
          }
        }
        
        if (this.hasAttribute("once")) {
            this.checkbox.checked = false;
        }
        // Przypisujemy kliknięty element do selected
        this.selected = event.target;
        this.textarea.value = this.selected.innerHTML;
        
        // Opcjonalnie, zaznaczamy kliknięty element, aby wizualnie wskazać, że jest wybrany
        this.selected.style.border = '2px solid blue';
      } else {
        // Jeśli checkbox nie jest zaznaczony, resetujemy textarea i selected
        this.textarea.value = '';
        if (this.selected) {
            this.selected.style.border = '';
            if (this.selected.style.cssText === '') {
                this.selected.removeAttribute('style');
            }
        }        
        this.selected = null;
      }
    }
  }

class CSSEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
            <div>
                <label for="styles-list">Arkusz CSS do edycji: </label>
                <select id="styles-list"></select>
                <textarea id="editor" class="editor" part="textarea"></textarea>
                <button id="apply">Apply</button>
                <button id="download">Download</button>
            </div>
            <style>
                .editor { width: 100%; height: 20vh; font-family: monospace; }
            </style>
        `;

        this.stylesList = this.shadowRoot.querySelector("#styles-list");
        this.editor = this.shadowRoot.querySelector("#editor");
        this.applyBtn = this.shadowRoot.querySelector("#apply");
        this.downloadBtn = this.shadowRoot.querySelector("#download");

        this.styles = [];
    }

    connectedCallback() {
        this.loadStyles();
        this.stylesList.addEventListener("change", () => this.loadStyleContent());
        this.applyBtn.addEventListener("click", () => this.applyChanges());
        this.downloadBtn.addEventListener("click", () => this.downloadCSS());
    }

    loadStyles() {
        document.querySelectorAll("style, link[rel='stylesheet']").forEach((el, index) => {
            const name = el.tagName === "LINK" ? el.href.split("/").pop() : `Inline Style ${index + 1}`;
            this.styles.push(el);
            this.stylesList.innerHTML += `<option value="${index}">${name}</option>`;
        });
        if (this.styles.length) this.loadStyleContent();
    }

    loadStyleContent() {
        const selectedStyle = this.styles[this.stylesList.value];
        if (selectedStyle.tagName === "LINK") {
            fetch(selectedStyle.href)
                .then(res => res.text())
                .then(css => this.editor.value = css);
        } else {
            this.editor.value = selectedStyle.innerHTML;
        }
    }

    applyChanges() {
        const selectedStyle = this.styles[this.stylesList.value];
        if (selectedStyle.tagName === "LINK") {
            const newStyle = document.createElement("style");
            newStyle.innerHTML = this.editor.value;
            document.head.appendChild(newStyle);
            selectedStyle.remove();
            this.styles[this.stylesList.value] = newStyle;
        } else {
            selectedStyle.innerHTML = this.editor.value;
        }
    }

    downloadCSS() {
        const blob = new Blob([this.editor.value], { type: "text/css" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = this.stylesList.selectedOptions[0].textContent;
        a.click();
    }
}

class ScriptEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
            <div>
                <label for="scripts-list">Skrypt do edycji: </label>
                <select id="scripts-list"></select>
                <textarea id="editor" part="textarea" class="editor"></textarea>
                <button id="apply">Apply</button>
                <button id="download">Download</button>
            </div>
            <style>
                .editor { width: 100%; height: 20vh; font-family: monospace; }
            </style>
        `;

        this.scriptsList = this.shadowRoot.querySelector("#scripts-list");
        this.editor = this.shadowRoot.querySelector("#editor");
        this.applyBtn = this.shadowRoot.querySelector("#apply");
        this.downloadBtn = this.shadowRoot.querySelector("#download");

        this.scripts = [];
        this.scriptSources = {};
    }

    connectedCallback() {
        this.loadScripts();
        this.scriptsList.addEventListener("change", () => this.loadScriptContent());
        this.applyBtn.addEventListener("click", () => this.applyChanges());
        this.downloadBtn.addEventListener("click", () => this.downloadJS());
    }

    loadScripts() {
        document.querySelectorAll("script").forEach((el, index) => {
            const name = el.src ? el.src.split("/").pop() : `Inline Script ${index + 1}`;
            this.scripts.push(el);
            this.scriptSources[index] = el.src || null;
            this.scriptsList.innerHTML += `<option value="${index}">${name}</option>`;
        });
        if (this.scripts.length) this.loadScriptContent();
    }

    async loadScriptContent() {
        const selectedIndex = this.scriptsList.value;
        const selectedScript = this.scripts[selectedIndex];

        if (this.scriptSources[selectedIndex]) {
            // Jeśli skrypt pochodzi z pliku, pobieramy jego zawartość
            try {
                const res = await fetch(this.scriptSources[selectedIndex]);
                this.editor.value = await res.text();
            } catch (error) {
                console.error("Błąd pobierania pliku JS:", error);
                this.editor.value = "// Nie udało się załadować pliku";
            }
        } else {
            // Inline script
            this.editor.value = selectedScript.innerHTML;
        }
    }

    applyChanges() {
        const selectedIndex = this.scriptsList.value;
        const selectedScript = this.scripts[selectedIndex];

        if (this.scriptSources[selectedIndex]) {
            console.warn("Edytujesz zewnętrzny skrypt. Zmiany nie zostaną zapisane na serwerze.");
        }

        const newScript = document.createElement("script");
        newScript.innerHTML = this.editor.value;
        document.body.appendChild(newScript);

        selectedScript.remove();
        this.scripts[selectedIndex] = newScript;

        console.log("Kod JS zaktualizowany!");
    }

    downloadJS() {
        const blob = new Blob([this.editor.value], { type: "text/javascript" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = this.scriptsList.selectedOptions[0].textContent;
        a.click();
    }
}

class DocumentEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(){
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                .scrolable {
                    overflow: auto;
                    width: 90%;
                    margin-left: 5%;
                    max-height: 100vh;
                }
                .toggle-button {
                    cursor: pointer;
                    user-select: none;
                }
            </style>
            <toggle-content>
              <div slot="minimized" title="Kliknij, aby zobaczyć więcej"><h1>🔽EDYTOR strony WEB</h1></div>
              <div slot="expanded">
                  <div class="scrolable">
                      <div>
                          <h3>Edytor DOM tej strony</h3>
                          <editable-element ignore-id = "${this.getAttribute('ignore-id') || ''}"></editable-element>
                      </div>
                      <br>
                      <div>
                          <h3>Edytor STYLE tej strony</h3>
                          <css-editor></css-editor>
                      </div>
                      <br>
                      <div>
                          <h3>Edytor SCRIPT tej strony</h3>
                          <script-editor></script-editor>
                      </div>
                  </div>
              </div>  
          </toggle-content>
        `;
    }
}

// Rejestracja niestandardowego elementu
customElements.define('document-editor', DocumentEditor);
customElements.define("script-editor", ScriptEditor);
customElements.define("css-editor", CSSEditor);  
customElements.define('editable-element', EditableElement);
customElements.define('my-refresh', MyRefresh);
customElements.define("script-list", ScriptList);
customElements.define('toggle-content', ToggleContent);

export {ToggleContent, ScriptList, MyRefresh, EditableElement, CSSEditor, ScriptEditor, DocumentEditor};