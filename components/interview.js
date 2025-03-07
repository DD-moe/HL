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

customElements.define('editable-text', EditableText);
export {EditableText};