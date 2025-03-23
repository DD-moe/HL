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
        if (document.fullscreenElement) {
            this.exitFullscreen();
        }
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
        this.boundHandleBodyClick = this.handleBodyClick.bind(this);
    }
  
    connectedCallback() {
      // Dodanie event listenera do body
      document.body.addEventListener('click', this.boundHandleBodyClick);
      
      // Zdarzenie apply (zaktualizowanie innerHTML z textarea)
      this.applyButton.addEventListener('click', () => {
        // Resetujemy poprzedni element
        if (this.selected) {          
          this.selected.innerHTML = this.textarea.value;
        }
      });
    }
  
    disconnectedCallback() {
      // Usunięcie event listenera po odłączeniu komponentu
      if (this.selected) {
        this.selected.classList.remove(this.getAttribute("highlight-class"));   
    }    
    document.body.removeEventListener('click', this.boundHandleBodyClick);
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
            this.selected.classList.remove(this.getAttribute("highlight-class"));            
        }
        
        if (this.hasAttribute("once")) {
            this.checkbox.checked = false;
        }
        // Przypisujemy kliknięty element do selected
        this.selected = event.target;
        this.textarea.value = this.selected.innerHTML.replace(/\s*class\s*=\s*""\s*/g, '');

        this.selected.classList.add(this.getAttribute("highlight-class"));
      } else {
        // Jeśli checkbox nie jest zaznaczony, resetujemy textarea i selected
        this.textarea.value = '';
        if (this.selected) {
            this.selected.classList.remove(this.getAttribute("highlight-class"));            
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
                          <editable-element ignore-id = "${this.getAttribute('ignore-id') || ''}" highlight-class="${this.getAttribute('highlight-class') || 'selected-element'}"></editable-element>
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

class AIRequest extends HTMLElement {
    #shadow;
    #apiKey;
    #model;
    #input;
    #instruction;
    #output;
    #status;
    #controller;
    
    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'closed' });
        this.#render();
    }
    
    #render() {
        this.#shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 500px;
                    font-family: Arial, sans-serif;
                }
                input, textarea, button, div {
                    width: 100%;
                    margin: 5px 0;
                    padding: 10px;
                    box-sizing: border-box;
                }
                textarea { height: 100px; }
                button:disabled { background: #ccc; }
                .status { min-height: 20px; font-size: 14px; color: red; }
            </style>
            <label>API Token</label>
            <input type="password" placeholder="Enter API Token" />
            <label>Model Name</label>
            <input type="text" placeholder="Enter Model Name (e.g., gemini-2.0-flash-001)" />
            <label>Input</label>
            <textarea placeholder="Input"></textarea>
            <label>Instruction</label>
            <textarea placeholder="Instruction"></textarea>
            <label>Output</label>
            <textarea placeholder="Output" readonly></textarea>
            <button>Generate</button>
            <button disabled>Cancel</button>
            <div class="status"></div>
        `;
        
        const [apiInput, modelInput, input, instruction, output, generateBtn, cancelBtn, status] = 
            this.#shadow.querySelectorAll('input, textarea, button, div');
        
        this.#apiKey = apiInput;
        this.#model = modelInput;
        this.#input = input;
        this.#instruction = instruction;
        this.#output = output;
        this.#status = status;
        
        generateBtn.addEventListener('click', () => this.generate());
        cancelBtn.addEventListener('click', () => this.cancel());
    }
    
    async generate(inputText = this.#input.value, instructionText = this.#instruction.value) {
        if (!this.#apiKey.value) {
            this.#status.textContent = 'API key is required!';
            return;
        }
        
        const apiKey = this.#apiKey.value;
        const modelName = this.#model.value || 'gemini-2.0-flash-001';
        
        if (!inputText || !instructionText) {
            this.#status.textContent = 'Input and instruction are required!';
            return;
        }
        
        this.#setLoading(true);
        this.#controller = new AbortController();
        
        try {
            const { GoogleGenAI } = await import('https://cdn.jsdelivr.net/npm/@google/genai@latest/+esm');
            const ai = new GoogleGenAI({ apiKey });
            
            const response = await ai.models.generateContent({
                model: modelName,
                contents: `${instructionText}\n${inputText}`,
            });
            
            if (response && response.text) {
                this.#output.value = response.text;
                this.#status.textContent = 'Success!';
                this.#setLoading(false);
                return response.text;
            } else {
                this.#status.textContent = 'Unexpected response format.';
                this.#setLoading(false);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                this.#status.textContent = 'Request canceled.';
                this.#setLoading(false);
            } else {
                this.#status.textContent = 'Error fetching response.';
                this.#setLoading(false);
            }
        }
    }
    
    cancel() {
        if (this.#controller) {
            this.#controller.abort();
            this.#setLoading(false);
        }
    }
    
    #setLoading(loading) {
        const buttons = this.#shadow.querySelectorAll('button');
        const textareas = this.#shadow.querySelectorAll('textarea');
        
        buttons[0].disabled = loading;
        buttons[1].disabled = !loading;
        textareas.forEach(el => el.readOnly = loading);
    }
}

class RodoConsent extends HTMLElement {
    constructor() {
        super();
        this.consent = {};
        this.project ='';
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                toggle-content { display: block; }
                toggle-content::part(expanded) {
                    position: fixed;
                    top: 10vh;
                    left: 10vw;
                    width: 70vw;
                    height: 70vh;
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                    overflow-y: auto;
                }
            </style>
            <toggle-content>
                <div slot="minimized" title="Kliknij, aby zobaczyć więcej">🔽RODO🔽</div>
                <div slot="expanded" id='expanded'>
                    <div part="form">
                        <slot id="url_slot"></slot>
                    </div>
                    <button id="save-btn">Zatwierdź zmiany</button>
                </div>
            </toggle-content>
        `;
    }

    async connectedCallback() {
        const url = this.getAttribute('url');
        if (url) {
            const response = await fetch(url);
            const html = await response.text();
            const assignedElements = this.shadowRoot.querySelector('#url_slot').assignedElements({ flatten: true });
            if (assignedElements.length > 0) {
                // Jeśli są przypisane elementy, ustawiamy innerHTML na pierwszy element
                assignedElements[0].innerHTML = html;
              } else {
                console.log("Brak przypisanych elementów w slocie.");
              }

            requestAnimationFrame(() => {
                this.checkRodoVersion();
                this.loadSavedConsent();
                this.addGroupEventListeners();
            });
        }

        this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveConsent());
    }

    checkRodoVersion() {
        this.project = Array.from(this.shadowRoot.querySelector('#url_slot').assignedElements())
        .map(element => element.querySelector('[data-project]'))
        .find(element => element)?.getAttribute('data-project') || 'unknown';

        const versionFromForm = Array.from(this.shadowRoot.querySelector('#url_slot').assignedElements())
        .map(element => element.querySelector('[data-version]'))
        .find(element => element)?.getAttribute('data-version') || 'unknown';

        const savedVersion = localStorage.getItem(`rodoVersion_${this.project}`);
        if (savedVersion !== versionFromForm) {
            this.expand();
        }
    }

    loadSavedConsent() {
        const savedConsent = JSON.parse(localStorage.getItem(`rodoConsent_${this.project}`) || '{}');
        const assignedElements = this.shadowRoot.querySelector('#url_slot').assignedElements({ flatten: true });

        assignedElements.forEach((element) => {
            element.querySelectorAll('input[type=checkbox]').forEach(input => {
                const key = input.getAttribute('data-statement');
                if (key && savedConsent[key] !== undefined) {
                    input.checked = savedConsent[key];
                }
            });
            const rodoVersionElement = element.querySelector('#rodo-version');
            if (rodoVersionElement) {
                const rodoVersion = rodoVersionElement.getAttribute('data-version') || 'Brak wersji';
                rodoVersionElement.textContent = `Wersja RODO: ${rodoVersion}`;
            }
        });
    }

    addGroupEventListeners() {
        const assignedElements = this.shadowRoot.querySelector('#url_slot').assignedElements({ flatten: true });

        assignedElements.forEach((element) => {
            element.querySelectorAll('input[type=checkbox][data-group]').forEach(groupCheckbox => {
                groupCheckbox.addEventListener('change', () => {
                    const group = groupCheckbox.getAttribute('data-group');
                    assignedElements.forEach((el) => {
                        el.querySelectorAll(`input[type=checkbox][data-groups*="${group}"]`).forEach(cb => {
                            cb.checked = groupCheckbox.checked;
                        });
                    });
                });
            });
        });
    }

    expand() {
        this.shadowRoot.querySelector('toggle-content').expand();
    }

    minimize() {
        this.shadowRoot.querySelector('toggle-content').minimize();
    }

    saveConsent() {
        const consentData = {};
        const assignedElements = this.shadowRoot.querySelector('#url_slot').assignedElements({ flatten: true });
        
        assignedElements.forEach((element) => {
            element.querySelectorAll('input[type=checkbox]').forEach(input => {
                const key = input.getAttribute('data-statement');
                if (key) {
                    consentData[key] = input.checked;
                }
            });
        });
        this.consent = consentData;
        localStorage.setItem(`rodoConsent_${this.project}`, JSON.stringify(consentData));
        const versionFromForm = Array.from(this.shadowRoot.querySelector('#url_slot').assignedElements())
        .map(element => element.querySelector('[data-version]'))
        .find(element => element)?.getAttribute('data-version') || 'unknown';
        localStorage.setItem(`rodoVersion_${this.project}`, versionFromForm);
        // minimize
        this.minimize();
    }
}

customElements.define('rodo-consent', RodoConsent);
customElements.define('ai-request', AIRequest);
customElements.define('document-editor', DocumentEditor);
customElements.define("script-editor", ScriptEditor);
customElements.define("css-editor", CSSEditor);  
customElements.define('editable-element', EditableElement);
customElements.define('my-refresh', MyRefresh);
customElements.define("script-list", ScriptList);
customElements.define('toggle-content', ToggleContent);

export {ToggleContent, ScriptList, MyRefresh, EditableElement, CSSEditor, ScriptEditor,
     DocumentEditor, AIRequest, RodoConsent};