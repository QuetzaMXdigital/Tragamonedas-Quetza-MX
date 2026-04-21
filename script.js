// --- 1. CONFIGURACIÓN DEL SISTEMA ---
let saldoGlobal = 5000;
let premioSesion = 0;
let enJuego = false;

// Catálogo de símbolos, multiplicadores y Probabilidad
const catalogo = {
    "exit":     { icono: "<img src='exit.png' alt='Exit'>", multi: 0,  peso: 35 },
    "manzana":  { icono: "<img src='manzana.png' alt='Manzana'>", multi: 3,  peso: 25 },
    "naranja":  { icono: "<img src='naranja.png' alt='Naranja'>", multi: 5,  peso: 15 },
    "sandia":   { icono: "<img src='sandia.png' alt='Sandía'>", multi: 10, peso: 10 },
    "limon":    { icono: "<img src='limon.png' alt='Limón'>", multi: 15, peso: 8  },
    "fresa":    { icono: "<img src='fresa.png' alt='Fresa'>", multi: 20, peso: 4  },
    "estrella": { icono: "<img src='estrella.png' alt='Estrella'>", multi: 30, peso: 2  },
    "tren":     { icono: "<img src='tren.png' alt='Tren'>", multi: 50, peso: 1  } 
};

let apuestas = { manzana: 0, naranja: 0, sandia: 0, limon: 0, fresa: 0, estrella: 0, tren: 0 };

const mapaTablero = [
    "exit", "manzana", "naranja", "limon", "sandia", "fresa", "exit", 
    "manzana", "estrella", "naranja", "limon", "manzana",              
    "tren", "sandia", "fresa", "naranja", "limon",                     
    "exit", "manzana", "naranja", "limon", "sandia", "fresa", "exit"  
];

const secuenciaLuz = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7];

// --- 2. ELEMENTOS UI ---
const domSaldo = document.getElementById("saldo-global");
const domPremio = document.getElementById("premio");
const domApuestaTotal = document.getElementById("apuesta-total");
const panelApuestas = document.querySelector(".panel-apuestas");
const btnJugar = document.getElementById("btn-jugar");
const btnCobrar = document.getElementById("btn-cobrar");

// --- 3. INICIALIZACIÓN ---
function inicializarTablero() {
    for (let i = 0; i < 24; i++) {
        let casilla = document.getElementById(`casilla-${i}`);
        if (casilla) {
            let tipo = mapaTablero[i];
            casilla.innerHTML = catalogo[tipo].icono;
        }
    }
}

function inicializarControles() {
    panelApuestas.innerHTML = ""; 
    Object.keys(apuestas).forEach(fruta => {
        let modulo = document.createElement("div");
        modulo.className = "modulo-apuesta";
        modulo.innerHTML = `
            <div class="modulo-icono">${catalogo[fruta].icono}</div>
            <span class="modulo-multiplicador">${catalogo[fruta].multi}x</span>
            <div class="controles-modulo">
                <button class="btn-ajuste" onclick="ajustarApuesta('${fruta}', -1)">-</button>
                <span class="monto-apuesta" id="monto-${fruta}">0</span>
                <button class="btn-ajuste" onclick="ajustarApuesta('${fruta}', 1)">+</button>
            </div>
        `;
        panelApuestas.appendChild(modulo);
    });
}

inicializarTablero();
inicializarControles();
actualizarPantallas();

// --- 4. CONFIGURAR APUESTAS (Solo prepara la mesa, NO cobra) ---
window.ajustarApuesta = function(fruta, cantidad) {
    if (enJuego) return;

    // Sumar o restar a la configuración de la apuesta
    let nuevaApuesta = apuestas[fruta] + cantidad;
    
    // Evitar apuestas negativas
    if (nuevaApuesta >= 0) {
        apuestas[fruta] = nuevaApuesta;
    }
    
    actualizarPantallas();
};

function actualizarPantallas() {
    domSaldo.innerText = saldoGlobal;
    domPremio.innerText = premioSesion;
    
    let totalApostado = 0;
    Object.keys(apuestas).forEach(f => {
        let spanMonto = document.getElementById(`monto-${f}`);
        if(spanMonto) spanMonto.innerText = apuestas[f];
        totalApostado += apuestas[f];
    });
    domApuestaTotal.innerText = totalApostado;
}

// --- 5. MOTOR DE PROBABILIDAD ---
function elegirCasillaConVentaja() {
    let rng = Math.random() * 100;
    let acumulado = 0;
    let frutaElegida = "exit";

    for (let clave in catalogo) {
        acumulado += catalogo[clave].peso;
        if (rng <= acumulado) {
            frutaElegida = clave;
            break;
        }
    }

    let opciones = [];
    for (let i = 0; i < mapaTablero.length; i++) {
        if (mapaTablero[i] === frutaElegida) opciones.push(i);
    }
    return opciones[Math.floor(Math.random() * opciones.length)];
}

// --- 6. EL GIRO Y EL COBRO REAL ---
btnJugar.addEventListener("click", () => {
    let totalMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
    
    if (enJuego || totalMesa === 0) return;

    // VERIFICACIÓN Y COBRO DEL GIRO
    if (premioSesion >= totalMesa) {
        // Cobra de las ganancias de esta sesión
        premioSesion -= totalMesa;
    } else if (saldoGlobal + premioSesion >= totalMesa) {
        // Cobra de las ganancias y lo que falte de la billetera global
        let falta = totalMesa - premioSesion;
        premioSesion = 0;
        saldoGlobal -= falta;
    } else {
        alert("⚠️ Saldo insuficiente en tu Billetera para jugar esta configuración.");
        return; // Detiene el juego si no hay fondos
    }

    actualizarPantallas();
    enJuego = true;
    btnJugar.style.opacity = "0.5";

    let posicionActual = 0;
    let vueltas = 0;
    let indexFinal = elegirCasillaConVentaja();
    let metaFinal = secuenciaLuz.indexOf(indexFinal);
    let velocidad = 50;
    let temporizador;

    function moverLuz() {
        document.querySelectorAll('.casilla').forEach(c => c.classList.remove('activa'));
        let idActiva = secuenciaLuz[posicionActual];
        let el = document.getElementById(`casilla-${idActiva}`);
        if(el) el.classList.add('activa');

        posicionActual++;
        if (posicionActual >= secuenciaLuz.length) {
            posicionActual = 0;
            vueltas++;
        }

        if (vueltas >= 2 && posicionActual === metaFinal) {
            clearTimeout(temporizador);
            finalizarGiro(idActiva);
        } else {
            if (vueltas >= 2) velocidad += 20;
            temporizador = setTimeout(moverLuz, velocidad);
        }
    }
    moverLuz();
});

function finalizarGiro(idGanador) {
    let frutaGanadora = mapaTablero[idGanador];
    
    if (frutaGanadora !== "exit" && apuestas[frutaGanadora] > 0) {
        let ganancia = apuestas[frutaGanadora] * catalogo[frutaGanadora].multi;
        premioSesion += ganancia; 
        actualizarPantallas();
    }

    let parpadeos = 0;
    let el = document.getElementById(`casilla-${idGanador}`);
    let pTimer = setInterval(() => {
        if(el) el.classList.toggle('activa');
        parpadeos++;
        if (parpadeos > 6) {
            clearInterval(pTimer);
            if(el) el.classList.add('activa');
            enJuego = false;
            btnJugar.style.opacity = "1";
        }
    }, 150);
}

// --- 7. SISTEMA DE COBRO ---
btnCobrar.addEventListener("click", () => {
    if (enJuego) return;
    
    if (premioSesion > 0) {
        saldoGlobal += premioSesion; 
        let montoCobrado = premioSesion;
        premioSesion = 0;
        
        // Limpiar la mesa de apuestas
        Object.keys(apuestas).forEach(f => apuestas[f] = 0);
        
        actualizarPantallas();
        alert(`💰 COBRO EXITOSO\nSe han transferido ${montoCobrado} QC a tu Billetera Global.`);
    } else {
        // Si no hay premio, solo limpia la mesa
        Object.keys(apuestas).forEach(f => apuestas[f] = 0);
        actualizarPantallas();
    }
});
