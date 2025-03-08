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

      prevButton.id = 'prev';
      prevButton.textContent = 'Poprzednia';
      nextButton.id = 'next';
      nextButton.textContent = 'Następna';

      slider.id = 'slider';
      slider.type = 'range';
      slider.min = '0';
      slider.max = '2';  // Liczba stron - 1 (bo indeksy zaczynają się od 0)
      slider.value = this.currentPage;

      inputField.id = 'page-input';
      inputField.type = 'number';
      inputField.value = this.currentPage + 1;  // Ustawiamy jako 1-indexed
      inputField.min = '1';
      inputField.max = '3';  // Liczba stron
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
    if (previous_BCG && focused){
        focused.style.backgroundColor = previous_BCG;
    }
    focused = element;
    previous_BCG = focused.style.backgroundColor;
    console.log(focused, previous_BCG);
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

// Rejestracja komponentu
customElements.define('my-shadow-component', MyShadowComponent);  
customElements.define('page-component', PageComponent);
customElements.define('editable-text', EditableText);
export {EditableText, PageComponent, MyShadowComponent};