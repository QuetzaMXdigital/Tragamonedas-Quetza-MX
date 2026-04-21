// --- 1. CONFIGURACIÓN DEL SISTEMA ---
let saldoGlobal = 5000;
let premioSesion = 0;
let enJuego = false;

// Catálogo de símbolos, multiplicadores y RTP (Probabilidad de salir)
const catalogo = {
    "exit":     { icono: "❌", multi: 0,  peso: 35 }, // 35%
    "manzana":  { icono: "🍎", multi: 3,  peso: 25 }, // 25%
    "naranja":  { icono: "🍊", multi: 5,  peso: 15 }, // 15%
    "sandia":   { icono: "🍉", multi: 10, peso: 10 }, // 10%
    "limon":    { icono: "🍋", multi: 15, peso: 8  }, // 8%
    "fresa":    { icono: "🍓", multi: 20, peso: 4  }, // 4%
    "estrella": { icono: "⭐", multi: 30, peso: 2  }, // 2%
    "tren":     { icono: "🚂", multi: 50, peso: 1  }  // 1%
};

// Estado de las apuestas actuales en la mesa
let apuestas = { manzana: 0, naranja: 0, sandia: 0, limon: 0, fresa: 0, estrella: 0, tren: 0 };

// Diseño del tablero (Dónde va cada fruta visualmente)
// Las posiciones 0, 6, 17, 23 son las 4 esquinas del grid
const mapaTablero = [
    "exit", "manzana", "naranja", "limon", "sandia", "fresa", "exit", // Arriba (0-6)
    "manzana", "estrella", "naranja", "limon", "manzana",              // Lado Izq (7, 9, 11, 13, 15)
    "tren", "sandia", "fresa", "naranja", "limon",                     // Lado Der (8, 10, 12, 14, 16)
    "exit", "manzana", "naranja", "limon", "sandia", "fresa", "exit"  // Abajo (17-23)
];

// Ruta que sigue la luz (Perímetro en sentido horario)
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
            casilla.innerText = catalogo[tipo].icono;
        }
    }
}

function inicializarControles() {
    // Generar módulos de apuesta para cada fruta (excepto exit)
    Object.keys(apuestas).forEach(fruta => {
        let modulo = document.createElement("div");
        modulo.className = "modulo-apuesta";
        modulo.innerHTML = `
            <div class="modulo-icono">${catalogo[fruta].icono}</div>
            <span class="modulo-multiplicador">${catalogo[fruta].multi}x</span>
            <div class="controles-modulo">
                <button class="btn-ajuste" onclick="ajustarApuesta('${fruta}', -10)">-</button>
                <span class="monto-apuesta" id="monto-${fruta}">0</span>
                <button class="btn-ajuste" onclick="ajustarApuesta('${fruta}', 10)">+</button>
            </div>
        `;
        panelApuestas.appendChild(modulo);
    });
}

inicializarTablero();
inicializarControles();
actualizarPantallas();

// --- 4. SISTEMA DE APUESTAS FINANCIERAS ---
window.ajustarApuesta = function(fruta, cantidad) {
    if (enJuego) return;

    if (cantidad > 0) {
        // Aumentar apuesta (Descuenta de la Billetera)
        if (saldoGlobal >= cantidad) {
            saldoGlobal -= cantidad;
            apuestas[fruta] += cantidad;
        } else {
            alert("⚠️ Saldo insuficiente en tu Billetera Global.");
        }
    } else {
        // Disminuir apuesta (Regresa a la Billetera)
        let montoARestar = Math.abs(cantidad);
        if (apuestas[fruta] >= montoARestar) {
            apuestas[fruta] -= montoARestar;
            saldoGlobal += montoARestar;
        }
    }
    actualizarPantallas();
};

function actualizarPantallas() {
    domSaldo.innerText = saldoGlobal;
    domPremio.innerText = premioSesion;
    
    let totalApostado = 0;
    Object.keys(apuestas).forEach(f => {
        document.getElementById(`monto-${f}`).innerText = apuestas[f];
        totalApostado += apuestas[f];
    });
    domApuestaTotal.innerText = totalApostado;
}

// --- 5. MOTOR DE PROBABILIDAD (LA VENTAJA DE LA CASA) ---
function elegirCasillaConVentaja() {
    let rng = Math.random() * 100;
    let acumulado = 0;
    let frutaElegida = "exit";

    // Revisa la tabla de pesos para elegir la fruta
    for (let clave in catalogo) {
        acumulado += catalogo[clave].peso;
        if (rng <= acumulado) {
            frutaElegida = clave;
            break;
        }
    }

    // Busca todas las casillas que tengan esa fruta y elige una al azar
    let opciones = [];
    for (let i = 0; i < mapaTablero.length; i++) {
        if (mapaTablero[i] === frutaElegida) opciones.push(i);
    }
    return opciones[Math.floor(Math.random() * opciones.length)];
}

// --- 6. GIRO Y PREMIOS ---
btnJugar.addEventListener("click", () => {
    let totalMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
    if (enJuego || totalMesa === 0) return;

    enJuego = true;
    btnJugar.style.opacity = "0.5";

    let posicionActual = 0;
    let vueltas = 0;
    let indexFinal = elegirCasillaConVentaja(); // Magia Matemática
    let metaFinal = secuenciaLuz.indexOf(indexFinal);
    
    let velocidad = 50;
    let temporizador;

    console.log(`🎰 RNG decidió: ${mapaTablero[indexFinal]}`);

    function moverLuz() {
        document.querySelectorAll('.casilla').forEach(c => c.classList.remove('activa'));
        let idActiva = secuenciaLuz[posicionActual];
        document.getElementById(`casilla-${idActiva}`).classList.add('activa');

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
        premioSesion += ganancia; // Se va a la reserva de la sesión
        
        setTimeout(() => {
            alert(`🎉 ¡BINGO!\nGanaste ${ganancia} QC con ${catalogo[frutaGanadora].icono}`);
            actualizarPantallas();
        }, 100);
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
    
    let totalMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
    let totalARecibir = premioSesion + totalMesa;

    if (totalARecibir > 0) {
        saldoGlobal += totalARecibir; // Sube a la billetera global
        premioSesion = 0;
        
        // Limpiar mesa
        Object.keys(apuestas).forEach(f => apuestas[f] = 0);
        
        actualizarPantallas();
        alert(`💰 COBRO EXITOSO\nSe han transferido ${totalARecibir} QC a tu cuenta de Hormulz Pulse.`);
    }
});
