// ==========================================
// 1. CONFIGURACIÓN Y ECONOMÍA GLOBAL
// ==========================================
let saldoGlobal = 5000;
let pozoDeLaCasa = 100000;
let ultimoPremio = 0;
let enJuego = false;

const catalogo = {
    "exit":     { icono: "<img src='exit.png'>", multi: 0,  peso: 35 },
    "manzana":  { icono: "<img src='manzana.png'>", multi: 3,  peso: 25 },
    "naranja":  { icono: "<img src='naranja.png'>", multi: 5,  peso: 15 },
    "sandia":   { icono: "<img src='sandia.png'>", multi: 10, peso: 10 },
    "limon":    { icono: "<img src='limon.png'>", multi: 15, peso: 8  },
    "fresa":    { icono: "<img src='fresa.png'>", multi: 20, peso: 4  },
    "estrella": { icono: "<img src='estrella.png'>", multi: 30, peso: 2  },
    "tren":     { icono: "<img src='tren.png'>", multi: 50, peso: 1  } 
};

let apuestas = { manzana: 0, naranja: 0, sandia: 0, limon: 0, fresa: 0, estrella: 0, tren: 0 };

const mapaTablero = [
    "exit", "manzana", "naranja", "limon", "sandia", "fresa", "exit", 
    "manzana", "estrella", "naranja", "limon", "manzana",              
    "tren", "sandia", "fresa", "naranja", "limon",                     
    "exit", "manzana", "naranja", "limon", "sandia", "fresa", "exit"  
];

const secuenciaLuz = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7];

// ==========================================
// 2. CONEXIÓN CON ELEMENTOS VISUALES Y AUDIO
// ==========================================
const sonidoMoneda = document.getElementById("audio-moneda");
const sonidoGiro = document.getElementById("audio-giro");
const sonidoPremio = document.getElementById("audio-premio");
const sonidoCobrar = document.getElementById("audio-cobrar");

if(sonidoGiro) sonidoGiro.loop = true; 

const modalVictoria = document.getElementById("modal-victoria");
const textoVictoria = document.getElementById("texto-victoria");
const btnCerrarModal = document.getElementById("btn-cerrar-modal");

// Cerrar la ventana de premio
if(btnCerrarModal) {
    btnCerrarModal.addEventListener("click", () => {
        modalVictoria.classList.remove("mostrar");
    });
}

function reproducir(audio) {
    if(audio) { audio.currentTime = 0; audio.play().catch(e=>{}); }
}
function detener(audio) {
    if(audio) { audio.pause(); audio.currentTime = 0; }
}

// ==========================================
// 3. INICIALIZAR EL TABLERO Y LOS BOTONES (SOLO SUMAR +)
// ==========================================
const panelAp = document.querySelector(".panel-apuestas");
panelAp.innerHTML = "";
Object.keys(apuestas).forEach(fruta => {
    const div = document.createElement("div");
    div.className = "modulo-apuesta";
    div.innerHTML = `
        <div class="modulo-icono">${catalogo[fruta].icono}</div>
        <span class="modulo-multiplicador">${catalogo[fruta].multi}x</span>
        <div class="controles-modulo" style="justify-content: center; gap: 10px;">
            <span class="monto-apuesta" id="monto-${fruta}" style="font-size: 14px;">0</span>
            <button class="btn-ajuste" onclick="ajustarApuesta('${fruta}', 1)" style="width: 25px; background-color: #27ae60; border-radius: 4px;">+</button>
        </div>
    `;
    panelAp.appendChild(div);
});

for(let i=0; i<24; i++) {
    let el = document.getElementById(`casilla-${i}`);
    if(el) el.innerHTML = catalogo[mapaTablero[i]].icono;
}

// ==========================================
// 4. LÓGICA DE APUESTAS Y PANTALLAS
// ==========================================
function actualizarPantallas() {
    document.getElementById("saldo-global").innerText = saldoGlobal;
    document.getElementById("premio").innerText = ultimoPremio;
    let total = 0;
    Object.keys(apuestas).forEach(f => {
        const el = document.getElementById(`monto-${f}`);
        if(el) el.innerText = apuestas[f];
        total += apuestas[f];
    });
    document.getElementById("apuesta-total").innerText = total;
}

window.ajustarApuesta = function(fruta, cantidad) {
    if (enJuego) return;
    let nueva = apuestas[fruta] + cantidad;
    if (nueva >= 0) {
        let costoTotal = Object.values(apuestas).reduce((a,b)=>a+b, 0) - apuestas[fruta] + nueva;
        if (costoTotal <= saldoGlobal) {
            apuestas[fruta] = nueva;
            reproducir(sonidoMoneda);
        }
    }
    actualizarPantallas();
};

actualizarPantallas();

// ==========================================
// 5. MOTOR DEL JUEGO (JUGAR, VENTAJA Y GIRAR)
// ==========================================
document.getElementById("btn-jugar").addEventListener("click", () => {
    let totalMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
    if (enJuego || totalMesa === 0 || saldoGlobal < totalMesa) return;

    // Transacción a la casa
    saldoGlobal -= totalMesa;
    pozoDeLaCasa += totalMesa;
    ultimoPremio = 0;
    enJuego = true;
    actualizarPantallas();
    reproducir(sonidoGiro);

    // Sistema RTP (La ventaja de la casa)
    let rng = Math.random() * 100;
    let acumulado = 0
