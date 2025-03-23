// module scope variables
let focused;
let previous_BCG;

class EditableText extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const title = this.getAttribute('title') || 'Nagłówek';
        const description = this.getAttribute('description') || 'Opis';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    border: 1px solid black; /* Default border */
                    padding: 10px;
                    border-radius: 5px; /* Optional rounded corners */
                }
                div, textarea { font-family: Arial, sans-serif; }
                div { cursor: pointer; }
                textarea { width: 100%; height: 100px; display: none; }
            </style>
            <div data-role="display">
                <slot name="title"><h3>${title}</h3></slot>
                <slot name="description"><p>${description}</p></slot>
            </div>
            <textarea data-role="editor"></textarea>
        `;

        this.display = this.shadowRoot.querySelector('[data-role="display"]');
        this.textarea = this.shadowRoot.querySelector('[data-role="editor"]');

        // Pobieranie tekstu ze slotów (jeśli użytkownik je dostarczy)
        const titleElement = this.querySelector('[slot="title"]');
        const descriptionElement = this.querySelector('[slot="description"]');

        const titleText = titleElement ? titleElement.textContent.trim() : title;
        const descriptionText = descriptionElement ? descriptionElement.textContent.trim() : description;

        this.textarea.value = `${titleText}\n\n${descriptionText}`;

        this.display.addEventListener('click', () => this.toggleEdit(true));
        this.textarea.addEventListener('blur', () => this.toggleEdit(false));
    }

    toggleEdit(editing) {
        if (editing) {
            this.display.style.display = 'none';
            this.textarea.style.display = 'block';
            this.textarea.focus();
        } else {
            this.display.style.display = 'block';
            this.textarea.style.display = 'none';
        }
    }
}

class PageComponent extends HTMLElement {
    constructor() {
      super();
      // Tworzymy shadow DOM
      this.attachShadow({ mode: 'open' });

      // Inicjalizacja zmiennych
      this.currentPage = 0;
    }

    connectedCallback() {
      // Po połączeniu z dokumentem, dodajemy przyciski, suwak oraz input
      this.renderControls();
      this.updatePages();

      // Nasłuchujemy na zmiany suwaka
      this.shadowRoot.querySelector('#slider').addEventListener('input', (e) => this.changePageFromSlider(e));

      // Nasłuchujemy na zatwierdzenie wartości z inputa
      this.shadowRoot.querySelector('#page-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.changePageFromInput();
        }
      });

      // Nasłuchujemy na kliknięcia przycisków
      this.shadowRoot.querySelector('#prev').addEventListener('click', () => this.changePage(-1));
      this.shadowRoot.querySelector('#next').addEventListener('click', () => this.changePage(1));

      // Nasłuchujemy na kliknięcie przycisku "Zatwierdź"
      this.shadowRoot.querySelector('#submit').addEventListener('click', () => this.changePageFromInput());
    }

    renderControls() {
      // Tworzymy przyciski do przewijania stron
      const controls = document.createElement('div');

      const prevButton = document.createElement('button');
      const nextButton = document.createElement('button');
      const slider = document.createElement('input');
      const inputField = document.createElement('input');
      const submitButton = document.createElement('button');
      this.slider = slider;
      this.inputField = inputField;
      prevButton.id = 'prev';
      prevButton.textContent = 'Poprzednia';
      nextButton.id = 'next';
      nextButton.textContent = 'Następna';

      slider.id = 'slider';
      slider.type = 'range';
      slider.min = '0';
      //slider.max = '2';  // Liczba stron - 1 (bo indeksy zaczynają się od 0)
      slider.value = this.currentPage;

      inputField.id = 'page-input';
      inputField.type = 'number';
      inputField.value = this.currentPage + 1;  // Ustawiamy jako 1-indexed
      inputField.min = '1';
      //inputField.max = '3';  // Liczba stron
      inputField.placeholder = 'Wpisz numer strony';

      submitButton.id = 'submit';
      submitButton.textContent = 'Zatwierdź';
      
      controls.appendChild(prevButton);
      controls.appendChild(nextButton);
      controls.appendChild(slider);
      controls.appendChild(inputField);
      controls.appendChild(submitButton);

      this.shadowRoot.appendChild(controls);

    // Tworzymy slot
    const slot = document.createElement('slot');
    this.shadowRoot.appendChild(slot);
    }

    updatePages() {
      // Pobieramy wszystkie elementy przypisane do slotu
      const pages = this.querySelectorAll('div.page');
      this.slider.max = pages.length - 1;
      this.inputField.max = pages.length;
      // Ukrywamy wszystkie strony
      pages.forEach((page, index) => {
        page.style.display = "none";
        if (index === this.currentPage) {
          page.style.display = "block";
        }
      });

      // Aktualizujemy suwak i input
      this.shadowRoot.querySelector('#slider').value = this.currentPage;
      this.shadowRoot.querySelector('#page-input').value = this.currentPage + 1;
    }

    changePage(direction) {
      // Zmieniamy stronę (w prawo lub w lewo)
      const pages = this.querySelectorAll('div.page');
      this.currentPage += direction;

      // Zapobiegamy wychodzeniu poza zakres
      if (this.currentPage < 0) {
        this.currentPage = pages.length - 1;
      } else if (this.currentPage >= pages.length) {
        this.currentPage = 0;
      }

      // Aktualizujemy widoczność stron
      this.updatePages();
    }

    changePageFromSlider(event) {
      // Zmieniamy stronę na podstawie wartości suwaka
      this.currentPage = parseInt(event.target.value);
      this.updatePages();
    }

    changePageFromInput() {
      // Zmieniamy stronę na podstawie wartości w input (po kliknięciu "Enter" lub "Zatwierdź")
      const inputValue = parseInt(this.shadowRoot.querySelector('#page-input').value);
      if (inputValue >= 1 && inputValue <= 3) {
        this.currentPage = inputValue - 1;  // Ustawiamy na 0-indexed
        this.updatePages();
      } else {
        alert("Numer strony jest poza zakresem!");
      }
    }
}

// Funkcja z poprzedniego kroku
function findElementInShadowDom(selectors) {
    let currentElement = document.querySelector(selectors[0]);
    if (!currentElement) {
        return null;
    }

    for (let i = 1; i < selectors.length; i++) {
        if (currentElement.shadowRoot) {
            currentElement = currentElement.shadowRoot.querySelector(selectors[i]);
        } else {
            return null;
        }
        if (!currentElement) {
            return null;
        }
    }

    return currentElement;
}

function focusOnElement(element){
    if (focused){
        focused.style.backgroundColor = previous_BCG;
    }
    focused = element;
    previous_BCG = focused.style.backgroundColor;
    element.style.backgroundColor = "red";
}

// Stworzenie Web Componentu
class MyShadowComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Tworzenie przycisku w shadow DOM
        const button = document.createElement('button');
        button.textContent = 'Znaleźć element';
        button.addEventListener('click', () => this.handleClick());

        // Dodanie przycisku do shadow DOM
        this.shadowRoot.appendChild(button);
    }

    // Funkcja wywoływana po kliknięciu przycisku
    handleClick() {
        // Pobranie atrybutu z JSON-em, np.:
        const selectorsJson = this.getAttribute('selectors');
        if (!selectorsJson) {
            console.error('Brak atrybutu "selectors"!');
            return;
        }

        // Parsowanie JSON-a
        let selectors = [];
        try {
            selectors = JSON.parse(selectorsJson);
        } catch (e) {
            console.error('Niepoprawny format JSON w atrybucie "selectors"!');
            return;
        }

        // Wywołanie funkcji findElementInShadowDom
        const element = findElementInShadowDom(selectors);
        if (element) {
            // Przewinięcie do znalezionego elementu
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            focusOnElement(element);
        } else {
            console.log('Element nie został znaleziony');
        }
    }
}

class EncoderComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                div { display: flex; flex-direction: column; gap: 8px; }
                input, button, textarea { padding: 8px; font-size: 16px; }
            </style>
            <div>
                <label for="password">Hasło:</label>
                <input type="text" id="password" placeholder="Wpisz hasło">
                
                <label for="text">Tekst:</label>
                <textarea id="text" placeholder="Wpisz tekst"></textarea>
                
                <button id="encode">Zakoduj</button>
                <button id="decode">Zdekoduj</button>
            </div>
        `;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('encode').addEventListener('click', () => this.encodeText());
        this.shadowRoot.getElementById('decode').addEventListener('click', () => this.decodeText());
    }

    encodeText() {
        const password = this.shadowRoot.getElementById('password').value;
        const textArea = this.shadowRoot.getElementById('text');
        const text = textArea.value;
        if (!password || !text) return;
        
        let combined = text + password;
        let encoded = Array.from(combined)
            .map(char => char.charCodeAt(0).toString(36))
            .join('');
        
        textArea.value = encoded;
    }

    decodeText() {
        const password = this.shadowRoot.getElementById('password').value;
        const textArea = this.shadowRoot.getElementById('text');
        const encoded = textArea.value;
        if (!password || !encoded) return;
        
        try {
            let decoded = '';
            let temp = encoded;
            while (temp.length) {
                let charCode = parseInt(temp.substring(0, 2), 36);
                decoded += String.fromCharCode(charCode);
                temp = temp.substring(2);
            }
            
            if (decoded.endsWith(password)) {
                textArea.value = decoded.slice(0, -password.length);
            } else {
                alert("Błąd dekodowania: niepoprawne hasło");
            }
        } catch (e) {
            alert("Błąd dekodowania!");
        }
    }
}

class QRScanner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                #video-container {
                    width: 300px;
                    height: 300px;
                    display: none;
                }
                video {
                    width: 100%;
                    height: auto; 
                }
                #start-btn {
                    font-size: 24px;
                    cursor: pointer;
                }
            </style>
            <button id="start-btn">📷</button>
            <div id="video-container">
                <video id="video" autoplay playsinline></video>
            </div>
            <input type="text" id="qr-result" readonly placeholder="Kod QR tutaj">
        `;
    }

    connectedCallback() {
        this.videoStream = null;
        this.video = this.shadowRoot.getElementById('video');
        this.qrResult = this.shadowRoot.getElementById('qr-result');
        this.videoContainer = this.shadowRoot.getElementById('video-container');
        this.startBtn = this.shadowRoot.getElementById('start-btn');

        this.startBtn.addEventListener('click', () => this.startCamera());
    }

    async startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Twoja przeglądarka nie obsługuje dostępu do kamery.');
            return;
        }
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            this.video.srcObject = this.videoStream;
            this.videoContainer.style.display = 'block';
            this.detectQR();
        } catch (error) {
            alert('Błąd uruchamiania kamery: ' + error.message);
            console.error('Błąd uruchamiania kamery:', error);
        }
    }

    async detectQR() {
        if (!('BarcodeDetector' in window)) {
            alert('Twoja przeglądarka nie obsługuje BarcodeDetector API.');
            return;
        }
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
        const interval = setInterval(async () => {
            try {
                const barcodes = await barcodeDetector.detect(this.video);
                if (barcodes.length > 0) {
                    this.qrResult.value = barcodes[0].rawValue;
                    this.stopCamera();
                    clearInterval(interval);
                    this.dispatchEvent(new CustomEvent('qr-scanned', { detail: barcodes[0].rawValue }));
                }
            } catch (error) {
                console.error('Błąd detekcji kodu QR:', error);
            }
        }, 500);
    }

    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
            this.videoContainer.style.display = 'none';
        }
    }
}

class CustomCheckboxGroup extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.max = parseInt(this.getAttribute('max')) || Infinity;
        this.calcFunc = this.getCalcFunction(this.getAttribute('calc'));
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; padding: 10px; border: 1px solid #ccc; }
                button { cursor: pointer; border: none; background: none; font-size: 1.2em; }
                .error { color: red; font-size: 0.9em; display: none; }
            </style>
            <slot></slot>
            <button title="Odznacz wszystko">🗑️</button>
            <p class="error">Można wybrać opcje w liczbie maksymalnie: ${this.max}.</p>
            <p>Wynik: <span id="result">0</span></p>
        `;
    }

    connectedCallback() {
        this.checkboxes = Array.from(this.querySelectorAll('input[type="checkbox"]'));
        this.button = this.shadowRoot.querySelector('button');
        this.resultSpan = this.shadowRoot.querySelector('#result');
        this.errorMsg = this.shadowRoot.querySelector('.error');
        
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => this.updateSelection(event));
        });
        this.button.addEventListener('click', () => this.clearSelection());
    }

    getCalcFunction(name) {
        const functions = {
            sum: values => values.reduce((a, b) => a + b, 0),
            multiply: values => values.reduce((a, b) => a * b, 1),
            max: values => Math.max(...values, 0),
        };
        return functions[name] || functions.sum;
    }

    updateSelection(event) {
        const checked = this.checkboxes.filter(cb => cb.checked);
        if (checked.length > this.max) {
            event.target.checked = false;
            this.errorMsg.style.display = 'block';
        } else {
            this.errorMsg.style.display = 'none';
        }
        this.updateResult();
    }

    updateResult() {
        const values = this.checkboxes
            .filter(cb => cb.checked)
            .map(cb => parseFloat(cb.getAttribute('data-value')) || 0);
        this.resultSpan.textContent = this.calcFunc(values);
    }

    clearSelection() {
        this.checkboxes.forEach(cb => cb.checked = false);
        this.errorMsg.style.display = 'none';
        this.updateResult();
    }
}


class DirectoryExplorer extends HTMLElement {
    constructor() {
        super();

        // Tworzymy Shadow DOM
        this.attachShadow({ mode: 'open' });

        // Dodajemy zawartość do Shadow DOM
        this.shadowRoot.innerHTML = `
            <button id="selectDirBtn">📂 Wybierz katalog</button>
            <input type="file" id="directoryInput" webkitdirectory multiple hidden>
        `;

        // Inicjalizacja slotu w Shadow DOM (nazwa slotu nie jest potrzebna)
        const slot = document.createElement('slot');
        this.shadowRoot.appendChild(slot); // Dodajemy slot do Shadow DOM
    }

    connectedCallback() {
        // Przypisanie event listenerów do elementów
        this.shadowRoot.getElementById("selectDirBtn").addEventListener("click", () => {
            this.shadowRoot.getElementById("directoryInput").click();
        });

        this.shadowRoot.getElementById("directoryInput").addEventListener("change", (event) => {
            const files = Array.from(event.target.files);
            const fileTree = {};

            // Tworzenie struktury drzewa katalogów
            files.forEach(file => {
                const parts = file.webkitRelativePath.split("/");
                let current = fileTree;

                for (let i = 0; i < parts.length; i++) {
                    if (!current[parts[i]]) {
                        current[parts[i]] = i === parts.length - 1 ? null : {};
                    }
                    current = current[parts[i]];
                }
            });

            // Funkcja do budowania listy plików
            this.buildList(fileTree, this.querySelector('ul'));
        });
    }

    buildList(obj, parentElement) {
        parentElement.innerHTML = ""; // Wyczyść poprzednią listę

        Object.keys(obj).forEach(key => {
            const li = document.createElement("li");

            // Dodanie checkboxa
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            // Ikona 📁 dla folderów i 📄 dla plików
            const icon = document.createElement("span");
            icon.textContent = obj[key] === null ? "📄" : "📁";

            li.appendChild(checkbox);
            li.appendChild(icon);
            li.appendChild(document.createTextNode(" " + key));

            parentElement.appendChild(li);

            if (obj[key] !== null) {
                const ul = document.createElement("ul");
                li.appendChild(ul);
                this.buildList(obj[key], ul);
            }
        });
    }
}

class EmojiKanji extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    static get observedAttributes() {
        return ['content'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'content' && oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const content = this.getAttribute('content');
        let elements = [];
        
        try {
            elements = JSON.parse(content) || [];
        } catch (e) {
            console.error('Invalid JSON in content attribute', e);
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                    width: 20px;
                    height: 20px;
                }
                .emoji {
                    position: absolute;
                    transform-origin: center;
                    font-size: 20px;
                }
            </style>
        `;

        elements.forEach(([char, transform]) => {
            const div = document.createElement('div');
            div.textContent = char;
            div.classList.add('emoji');
            div.style.transform = transform;
            this.shadowRoot.appendChild(div);
        });
    }
}

// Rejestracja niestandardowego elementu HTML
customElements.define('emoji-kanji', EmojiKanji);
customElements.define('directory-explorer', DirectoryExplorer);
customElements.define('custom-checkbox-group', CustomCheckboxGroup);
customElements.define('qr-scanner', QRScanner);
customElements.define('encoder-component', EncoderComponent);
customElements.define('my-shadow-component', MyShadowComponent);  
customElements.define('page-component', PageComponent);
customElements.define('editable-text', EditableText);
export {EditableText, PageComponent, MyShadowComponent, EncoderComponent, QRScanner, CustomCheckboxGroup
    , DirectoryExplorer, EmojiKanji
};