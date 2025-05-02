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

// przycisk do czysszczenia zebranych danych
const btnClearBaseline = document.createElement('button');
btnClearBaseline.textContent = '🗑️';
btnClearBaseline.title = 'Wyczyść wszystkie dane ze zmiennej globalnej wynikiZBadania';
btnClearBaseline.style.fontSize = '24px';
btnClearBaseline.style.margin = '5px';

panel.appendChild(btnRemove);
panel.appendChild(btnExtract);
panel.appendChild(btnInsert);
panel.appendChild(btnClearBaseline);

// Tworzymy nowy panel dla alertów
const alert_panel = document.createElement('div');
alert_panel.id = 'alert-panel';
alert_panel.title = 'wciśnij: "shift" + "alt" + "p" aby włączyć/wyłączyć sprawdzanie CTCAE.';
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
        nieprawidlowosci = analyzeMorfologia(text);
    } else if (badanie === "ciśnienie") {
        nieprawidlowosci = analyzeCisnienie(text);
    } else if (badanie === "masa") {
        nieprawidlowosci = analyzeMasa(text);
    } else if (badanie === "alat") {
        nieprawidlowosci = analyzeAlat(text);
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

// funkcaj czyszcząca zgromadzone dane w zmiennej globalnej
btnClearBaseline.onclick = () => {
    if (window.wynikiZBadania && typeof wynikiZBadania === 'object') {
        for (const key in wynikiZBadania) {
            if (wynikiZBadania.hasOwnProperty(key)) {
                delete wynikiZBadania[key];
            }
        }
        console.log('Wszystkie dane w wynikiZBadania zostały usunięte.');
        alert('Wszystkie dane w wynikiZBadania zostały wyczyszczone.');
    } else {
        console.warn('Brak zmiennej globalnej wynikiZBadania.');
        alert('Nie znaleziono zmiennej wynikiZBadania.');
    }
};

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
    } else if (text.includes("Ciśnienie")) {
        return "ciśnienie"; // pomiar ciśnienia
    } else if (text.includes("Masa")) {
        return "masa"; // masa ciała
    } else if (text.includes("ALAT")) {
        return "alat"; // próby wątrobowe
    }
    return null; // brak rozpoznania
}


// zwraca wszystkie nieprawidłowości
function analyzeMorfologia(input) {
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

// zwraca wszystkie nieprawidłowości
function analyzeMasa(input) {
    const lines = input.trim().split("\n");
    const results = [];

    lines.forEach(line => {
        const result = parseMasaIfMatches(line);
        if (result) {
            results.push(result);
        }
    });
    return results;
}

// zwraca wszystkie nieprawidłowości
function analyzeCisnienie(input) {
    const lines = input.trim().split("\n");
    const results = [];

    lines.forEach(line => {
        const result = parseCisnienieIfMatches(line);
        if (result) {
            results.push(result);
        }
    });
    return results;
}

// zwraca wszystkie nieprawidłowości
function analyzeAlat(input) {
    const lines = input.trim().split("\n");
    const results = [];

    lines.forEach(line => {
        const result = parseAlatIfMatches(line);
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
    // HGB (anemia)
    else if (line.includes("HGB")) {
        if (line.includes("g/dL")) {
            const match = line.match(/(\d+,\d+)\s*-\s*(\d+,\d+)/); // np. "12,0 - 16,0"
            if (match) {
                const parts = line.trim().split(/\s+/);
                const name = parts[0]; // "HGB"
                const value = parseFloat(parts[1].replace(",", ".")); // np. "10,2" => 10.2
                const refLow = parseFloat(match[1].replace(",", ".")); // np. "12,0" => 12.0
                let grade = 0;

                if (value < refLow) {
                    if (value >= 10.0) {
                        grade = 1;
                    } else if (value >= 8.0) {
                        grade = 2;
                    } else {
                        grade = 3; // <8.0 + transfusion indicated
                    }
                    return `<b>${name}:</b> GRADE: <b>${grade}</b> wg CTCAE dla wartości: ${value.toFixed(1)} g/dL; gdzie norma to: ${refLow.toFixed(1)} - ${parseFloat(match[2].replace(",", ".")).toFixed(1)} g/dL`;
                }
            }
        }
    }
    return null;
}

function parseMasaIfMatches(line) {
    if (line.includes("Masa") && line.includes("kg")) {
        const parts = line.trim().split(/\s+/);
        let value = null;

        // Szukamy liczby (np. 72.3) w danych
        for (const part of parts) {
            const num = parseFloat(part.replace(",", "."));
            if (!isNaN(num)) {
                value = num;
                break;
            }
        }

        if (wynikiZBadania.masa && wynikiZBadania.masa.params && wynikiZBadania.masa.params.value !== undefined) {
            if (value !== null && wynikiZBadania.masa.params.value !== undefined) {
                const baseline = wynikiZBadania.masa.params.value;
                const spadekProc = ((baseline - value) / baseline) * 100;
                let grade = 0;
    
                if (spadekProc >= 5 && spadekProc < 10) {
                    grade = 1;
                } else if (spadekProc >= 10 && spadekProc < 20) {
                    grade = 2;
                } else if (spadekProc >= 20) {
                    grade = 3;
                }
    
                if (grade > 0) {
                    return `<b>Masa ciała:</b> GRADE: <b>${grade}</b> w CTCAE – spadek o ${spadekProc.toFixed(1)}% (wartość: ${value.toFixed(1)} kg; baseline: ${baseline.toFixed(1)} kg)`;
                }
            }
        }
    }
    return null;
}

function parseCisnienieIfMatches(line) {
    if (line.includes("Ciśnienie") && line.includes("mmHg")) {
        const match = line.match(/(\d+)\s*\/\s*(\d+)/); // np. 125/80
        if (match) {
            const systolic = parseInt(match[1], 10);
            const diastolic = parseInt(match[2], 10);
            let grade = 0;

            if ((systolic >= 120 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
                grade = 1;
            }
            if ((systolic >= 140 && systolic <= 159) || (diastolic >= 90 && diastolic <= 99)) {
                grade = 2;
            }
            if (systolic >= 160 || diastolic >= 100) {
                grade = 3;
            }

            if (grade > 0) {
                return `<b>Ciśnienie:</b> GRADE: <b>${grade}</b> w CTCAE (wynik: ${systolic}/${diastolic} mmHg)`;
            }
        }
    }
    return null;
}

function parseAlatIfMatches(line) {
    if (line.includes("ALAT") && line.includes("U/L")) {
        // 1. Wyciągnij wartość ALAT
        const matchValue = line.match(/(\d+[.,]?\d*)\s*U\/L/); // np. 45 U/L
        if (!matchValue) return null;
        const value = parseFloat(matchValue[1].replace(",", "."));

        // 2. Wyciągnij ULN jeśli dostępne
        let uln = null;
        const matchNorma = line.match(/norma:\s*\d+[.,]?\d*\s*-\s*(\d+[.,]?\d*)\s*U\/L/i);
        if (matchNorma) {
            uln = parseFloat(matchNorma[1].replace(",", "."));
        }

        let baseline;
        if (!wynikiZBadania.alat || !wynikiZBadania.alat.params || wynikiZBadania.alat.params.normal === undefined || wynikiZBadania.alat.params.value === undefined) {
            return; // Jeśli którakolwiek z właściwości nie istnieje, zakończ funkcję
        }
        
        if (wynikiZBadania.alat.params.normal) {
            // jeśli baseline jest normalny → używamy ULN
            if (uln !== null) {
                baseline = uln;
            } else {
                baseline = wynikiZBadania.alat.params.value; // fallback jeśli ULN nie znaleziono
            }
        } else {
            // jeśli baseline jest nieprawidłowy → używamy zapisanej wartości
            baseline = wynikiZBadania.alat.params.value;
        }

        // 3. Oblicz grade
        let grade = 0;
        if (wynikiZBadania.alat.params.normal) {
            if (value > baseline * 20.0) {
                grade = 4;
            } else if (value > baseline * 5.0) {
                grade = 3;
            } else if (value > baseline * 3.0) {
                grade = 2;
            } else if (value > baseline) {
                grade = 1;
            }
        } else {
            if (value > baseline * 20.0) {
                grade = 4;
            } else if (value > baseline * 5.0) {
                grade = 3;
            } else if (value > baseline * 3.0) {
                grade = 2;
            } else if (value > baseline * 1.5) {
                grade = 1;
            }
        }

        if (grade > 0) {
            return `<b>ALAT:</b> GRADE: <b>${grade}</b> w CTCAE (wynik: ${value.toFixed(2)} U/L; baseline: ${baseline.toFixed(2)} U/L; normalBaseline: ${wynikiZBadania.alat.params.normal})`;
        }
    }
    return null;
}


function extractIfMatches(line) {
    // 1️⃣ Masa ciała
    if (line.includes("Masa") && line.includes("kg")) {
        const match = line.match(/(\d+[.,]?\d*)\s*kg/i);
        if (match) {
            const value = parseFloat(match[1].replace(",", "."));
            return { name: "masa", params: { value } };
        }
    }

    // 2️⃣ ALAT
    if (line.includes("ALAT") && line.includes("U/L")) {
        const matchValue = line.match(/(\d+[.,]?\d*)\s*U\/L/); // szukamy wartości ALAT
        const matchNorma = line.match(/norma:\s*(\d+[.,]?\d*)\s*-\s*(\d+[.,]?\d*)\s*U\/L/i); // szukamy normy
        if (matchValue) {
            const value = parseFloat(matchValue[1].replace(",", "."));
            let normal = false;
            if (matchNorma) {
                const low = parseFloat(matchNorma[1].replace(",", "."));
                const high = parseFloat(matchNorma[2].replace(",", "."));
                // ALAT w normie jeśli value <= high
                normal = value <= high;
            }
            return { name: "alat", params: { value, normal } };
        }
    }

    return null; // jeśli nic nie pasuje
}
