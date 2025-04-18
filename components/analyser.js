// globalne zmienne
let globalnyJSON = null; // wyodrębnione baseline z json z komentarza w systemie
let wynikiZBadania = {}; // baseline przechowywane w pamięci przeglądarki
let clickedTextarea = null; // ostatnio kliknięty textarea
let process = true;

// stylowanie panelu
const panel = document.createElement('div');
panel.id = 'emoji-panel';
panel.title = 'wciśnij: "shift" + "alt" + "p" aby włączyć/wyłączyć sprawdzanie CTCAE.';
panel.style.cssText = `
  position: absolute;
  background: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  display: none;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
`;

// przycisk do extrakcji danych do baseline
const btnExtract = document.createElement('button');
btnExtract.textContent = '📝';
btnExtract.title = 'Wydobądź dane z tekstu';
btnExtract.style.fontSize = '24px';
btnExtract.style.margin = '5px';

// przycisk do wstawienia danych baseline do komentarza w systemie
const btnInsert = document.createElement('button');
btnInsert.textContent = '🛠️';
btnInsert.title = 'Wstaw JSON z danych';
btnInsert.style.fontSize = '24px';
btnInsert.style.margin = '5px';

// przycisk do usówania JSON z <baseline>...</baseline> z komentarza w systemie
const btnRemove = document.createElement('button');
btnRemove.textContent = '🧹';
btnRemove.title = 'Usuń JSON z <baseline>...</baseline>';
btnRemove.style.fontSize = '24px';
btnRemove.style.margin = '5px';

panel.appendChild(btnRemove);
panel.appendChild(btnExtract);
panel.appendChild(btnInsert);

// Tworzymy nowy panel dla alertów
const alert_panel = document.createElement('div');
alert_panel.id = 'alert-panel';
alert_panel.style.cssText = `
  position: fixed;
  background: #f9f9f9;
  border: 1px solid red;
  border-radius: 8px;
  padding: 10px;
  display: none;
  z-index: 888;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  left: 25%;
  top: 25%;
  width: 50%;
  height: 50%;
  overflow: auto;
`;


const header = document.createElement('h3');
header.textContent = 'Znaleziono nieprawidłowości w wynikach:';
const list = document.createElement('ul');
alert_panel.appendChild(header);
alert_panel.appendChild(list);

// dodajemy panele do wspólnego div
const panel_container = document.createElement('div');
document.body.appendChild(panel);
document.body.appendChild(alert_panel);

// Wyszukaj JSON wewnątrz znaczników <baseline>...</baseline>
function extractBaselineJSONs(text) {
  const regex = /<baseline>(.*?)<\/baseline>/gs;
  const matches = [...text.matchAll(regex)];
  return matches.map(m => m[1].trim());
}

// Sprawdź, czy string to poprawny JSON
function isValidJSON(str) {
  try {
    const obj = JSON.parse(str);
    return obj && typeof obj === 'object';
  } catch {
    return false;
  }
}

function ocenBadania(text) {
    // 1. Rozpoznanie typu badania
    const badanie = wykryjBadanie(text);
    let nieprawidlowosci = [];
    if (badanie === "morfologia") {
        nieprawidlowosci = analyze(text);
    }

    // 4. Wyświetlanie nieprawidłowości w panelu – zawsze wywoływane
    if (nieprawidlowosci.length > 0) {
        AlertPanel(nieprawidlowosci);
        } 
    else {
        console.log('Wszystkie wyniki są w normie lub nie wykryto danych.');
    }
}

// Wyświetl panel akcji przy kliknięciu
function showPanel(x, y) {
  panel.style.left = `${x + 10}px`;
  panel.style.top = `${y + 10}px`;
  panel.style.display = 'block';
}

// Ukryj panel akcji
function hidePanel(no_reaction) {
    if (!(no_reaction.id === 'emoji-panel')) {
        panel.style.display = 'none';
    }
}

// Wyświetl panel alertu przy kliknięciu
function showPanel_a(x, y) {
    alert_panel.style.display = 'block';
  }
  
// Ukryj panel alertu
function hidePanel_a(no_reaction) {
if (!(no_reaction.id === 'alert-panel')) {
    alert_panel.style.display = 'none';
}
}

// Po kliknięciu textarea - uruchom domyślne przetwarzanie danych
document.addEventListener('click', (e) => {
  if (!process) {
    return;
  }
  hidePanel(e.target);
  hidePanel_a(e.target);
  const target = e.target;
  if (target.tagName === 'TEXTAREA') {
    clickedTextarea = target;
    const text = target.value;
    const candidates = extractBaselineJSONs(text);
    globalnyJSON = null;

    for (const jsonStr of candidates) {
      if (isValidJSON(jsonStr)) {
        globalnyJSON = JSON.parse(jsonStr);
        showPanel(e.pageX, e.pageY);
        return;
      }
    }

    // Jeśli nie znaleziono JSON → wykonaj analizę tekstu
    ocenBadania(text);
    showPanel(e.pageX, e.pageY);
  }
});

// uruchamianie głównego skryptu do extrakcji baselines
btnExtract.addEventListener('click', () => {
    hidePanel(panel);
    const textarea = clickedTextarea;
    if (!textarea) return;
  
    wynikiZBadania = {}; // reset
    const lines = textarea.value.trim().split("\n");
    
    lines.forEach(line => {
        const result = extractIfMatches(line);
        if (result && result.name && result.param !== undefined) {
            wynikiZBadania[result.name] = result.param;
        }
    });    
});  

// Wstawienie JSON do <baseline>...</baseline>
btnInsert.addEventListener('click', () => {
    hidePanel(panel);
    const textarea = clickedTextarea;
    if (!textarea) return;
  
    const jsonStr = JSON.stringify(wynikiZBadania, null, 2);
    const baselineRegex = /<baseline>[\s\S]*?<\/baseline>/;
  
    if (baselineRegex.test(textarea.value)) {
      // Nadpisz istniejący blok
      textarea.value = textarea.value.replace(baselineRegex, `<baseline>\n${jsonStr}\n</baseline>`);
    } else {
      // Jeśli nie ma, dodaj na końcu
      textarea.value += `\n<baseline>\n${jsonStr}\n</baseline>`;
    }
  });  

// Funkcja usuwająca JSON między <baseline>...</baseline>
btnRemove.addEventListener('click', () => {
    hidePanel(panel);
    const textarea = clickedTextarea;
    if (!textarea) return;
    // Usuwanie wszystkich wystąpień <baseline>...</baseline>
    textarea.value = textarea.value.replace(/<baseline>[\s\S]*?<\/baseline>/g, '');
  });

// Tworzenie panelu z alertem
function AlertPanel(nieprawidlowosci) {
    list.innerHTML = '';
    nieprawidlowosci.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = item ;
      list.appendChild(li);
    });
    showPanel_a();
}

// domyślny skrót klawiszowy, który aktywuje skrypt:
// Nasłuchiwanie na klawiaturę
document.addEventListener('keydown', function (e) {
  if (e.shiftKey && e.altKey && e.code === 'KeyP') {
    process = !process;
    console.log('Zmienna process:', process);
    if (!process) {
        hidePanel(alert_panel);
        hidePanel_a(panel);
    }
  }
});

//################################### funkcje do przeszukiwania

// Wykrywanie typu badania
function wykryjBadanie(text) {
    if (text.includes("WBC")) {
      return "morfologia"; // morfologia
    }
    return null; // brak rozpoznania
  }

// zwraca wszystkie nieprawidłowości
function analyze(input) {
    const lines = input.trim().split("\n");
    const results = [];

    lines.forEach(line => {
        const result = parseIfMatches(line);
        if (result) {
            results.push(result);
        }
    });
    return results;
}

// zwraca tekst nieprawidłowego wyniku
function parseIfMatches(line) {
    // WBC#
    if (line.includes("WBC")) {
        if (line.includes("10*3/uL")) {
            const match = line.match(/(\d+,\d+)\s*-/);
            if (match) {
                const parts = line.trim().split(/\s+/);
                const name = parts[0];
                const value = parseFloat(parts[1].replace(",", "."));
                const refLow = parseFloat(match[1].replace(",", "."));
                let grade = 0;

                if (value < refLow) {
                    if (value > 3) {
                        grade = 1;
                    } else if (value > 2) {
                        grade = 2;
                    } else if (value > 1) {
                        grade = 3;
                    } else {
                        grade = 4;
                    }
                    return `<b>${name}:</b> GRADE: <b>${grade}</b> w CTCAE dla wartości: ${value.toFixed(2)} * 10*3/u; gdzie norma to: >${refLow.toFixed(2)}`;
                }
            }
        }
    }
    // NEUT#
    else if (line.includes("NEUT#")) {
        if (line.includes("10*3/uL")) {
            const match = line.match(/(\d+,\d+)\s*-/);
            if (match) {
                const parts = line.trim().split(/\s+/);
                const name = parts[0];
                const value = parseFloat(parts[1].replace(",", "."));
                const refLow = parseFloat(match[1].replace(",", "."));
                let grade = 0;

                if (value < refLow) {
                    if (value > 1.5) {
                        grade = 1;
                    } else if (value > 1) {
                        grade = 2;
                    } else if (value > 0.5) {
                        grade = 3;
                    } else {
                        grade = 4;
                    }
                    return `<b>${name}:</b> GRADE: <b>${grade}</b> w CTCAE dla wartości: ${value.toFixed(2)} * 10*3/u; gdzie norma to: >${refLow.toFixed(2)}`;
                }
            }
        }
    }   
    // LYMPH#
    else if (line.includes("LYMPH#")) {
        if (line.includes("10*3/uL")) {
            const match = line.match(/(\d+,\d+)\s*-/);
            if (match) {
                const parts = line.trim().split(/\s+/);
                const name = parts[0];
                const value = parseFloat(parts[1].replace(",", "."));
                const refLow = parseFloat(match[1].replace(",", "."));
                let grade = 0;

                if (value < refLow) {
                    if (value > 0.8) {
                        grade = 1;
                    } else if (value > 0.5) {
                        grade = 2;
                    } else if (value > 0.2) {
                        grade = 3;
                    } else {
                        grade = 4;
                    }
                    return `<b>${name}:</b> GRADE: <b>${grade}</b> w CTCAE dla wartości: ${value.toFixed(2)} * 10*3/u; gdzie norma to: >${refLow.toFixed(2)}`;
                }
            }
        }
    }      
    return null;
}

// extrakcja danych dla baselines
function extractIfMatches(line){
    if (line.includes("WBC")) {
        if (line.includes("10*3/uL")) {
            const match = line.match(/(\d+,\d+)\s*-/);
            if (match) {
                const parts = line.trim().split(/\s+/);
                const name = parts[0];
                const value = parseFloat(parts[1].replace(",", "."));
                const params = {value};
                return  {name, params};
            }
        }
    }
    return null;
}