// --- 1. VARIABLES GLOBALES FINANCIERAS ---
let saldoGlobal = 5000;
let creditos = 0;
let apuestaTotal = 0;
let enJuego = false;

let apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
const multiplicadores = { "Sandía": 20, "Estrella": 50, "Cereza": 2, "Tren": 0 };

// --- 2. CONFIGURACIÓN DEL TABLERO ---
const mapaTablero = [
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren",
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía",
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren",
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía"
];

const secuenciaLuz = [
    0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7
];

const iconos = {
    "Tren": "🚂",
    "Cereza": "🍒",
    "Sandía": "🍉",
    "Estrella": "⭐"
};

// --- 3. ELEMENTOS DE LA PANTALLA ---
const displaySaldoGlobal = document.getElementById("saldo-global");
const displayCreditos = document.getElementById("creditos");
const displayApuesta = document.getElementById("apuesta");
const displayPremio = document.getElementById("premio");
const btnJugar = document.getElementById("btn-jugar");
const btnCobrar = document.querySelector(".btn-cobrar");
const botonesApuesta = document.querySelectorAll(".btn-apuesta");

// --- 4. INICIALIZAR FRUTAS (Reemplaza los números) ---
function inicializarTablero() {
    for (let i = 0; i < 24; i++) {
        let casilla = document.getElementById(`casilla-${i}`);
        let figura = mapaTablero[i];
        casilla.innerText = iconos[figura];
        casilla.style.fontSize = "28px"; // Tamaño del emoji
    }
}
inicializarTablero(); // Se ejecuta al abrir la página

// --- 5. LÓGICA DE APUESTAS ---
botonesApuesta.forEach(boton => {
    boton.addEventListener("click", () => {
        if (enJuego) return;

        // Detectar a qué fruta apostó ignorando el emoji
        let textoBoton = boton.innerText;
        let frutaSeleccionada = "";
        if (textoBoton.includes("Sandía")) frutaSeleccionada = "Sandía";
        if (textoBoton.includes("Estrella")) frutaSeleccionada = "Estrella";
        if (textoBoton.includes("Cereza")) frutaSeleccionada = "Cereza";

        // Cobrar del saldo global si la máquina no tiene créditos
        if (creditos >= 1) {
            creditos--;
            apuestaTotal++;
            apuestasActuales[frutaSeleccionada]++;
            displayCreditos.innerText = creditos;
            displayApuesta.innerText = apuestaTotal;
        } else if (saldoGlobal >= 1) {
            saldoGlobal--;
            apuestaTotal++;
            apuestasActuales[frutaSeleccionada]++;
            displaySaldoGlobal.innerText = saldoGlobal;
            displayApuesta.innerText = apuestaTotal;
        } else {
            alert("No tienes fondos suficientes en tu Billetera.");
        }
    });
});

// --- 6. MOTOR DE GIRO (LA LUZ) ---
function iniciarGiro() {
    if (enJuego || apuestaTotal === 0) return;
    enJuego = true;
    displayPremio.innerText = "0";
    btnJugar.style.opacity = "0.5";

    let posicionActual = 0;
    let vueltas = 0;
    const metaFinal = Math.floor(Math.random() * secuenciaLuz.length);
    let velocidad = 50;
    let temporizador;

    function moverLuz() {
        document.querySelectorAll('.casilla').forEach(c => c.classList.remove('activa'));
        let idCasillaActiva = secuenciaLuz[posicionActual];
        document.getElementById(`casilla-${idCasillaActiva}`).classList.add('activa');

        posicionActual++;
        if (posicionActual >= secuenciaLuz.length) {
            posicionActual = 0;
            vueltas++;
        }

        if (vueltas >= 2 && posicionActual === metaFinal) {
            clearTimeout(temporizador);
            finalizarGiro(idCasillaActiva);
        } else {
            if (vueltas >= 2) velocidad += 20;
            temporizador = setTimeout(moverLuz, velocidad);
        }
    }
    moverLuz();
}

// --- 7. PAGAR PREMIOS ---
function finalizarGiro(idCasillaGanadora) {
    let frutaGanadora = mapaTablero[idCasillaGanadora];
    let monedasApostadas = apuestasActuales[frutaGanadora] || 0;

    if (monedasApostadas > 0) {
        let premioTotal = monedasApostadas * multiplicadores[frutaGanadora];
        creditos += premioTotal;
        displayPremio.innerText = premioTotal;
    }

    apuestaTotal = 0;
    apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
    displayCreditos.innerText = creditos;
    displayApuesta.innerText = apuestaTotal;

    // Efecto de parpadeo al ganar
    let parpadeos = 0;
    let parpadeoTimer = setInterval(() => {
        let elemento = document.getElementById(`casilla-${idCasillaGanadora}`);
        elemento.classList.toggle('activa');
        parpadeos++;
        if (parpadeos > 5) {
            clearInterval(parpadeoTimer);
            elemento.classList.add('activa');
            enJuego = false;
            btnJugar.style.opacity = "1";
        }
    }, 200);
}

// --- 8. BOTÓN COBRAR ---
btnCobrar.addEventListener("click", () => {
    if (enJuego) return;
    
    // Si hay apuesta atorada, devolverla a la máquina
    if (apuestaTotal > 0) {
        creditos += apuestaTotal;
        apuestaTotal = 0;
        apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
        displayCreditos.innerText = creditos;
        displayApuesta.innerText = apuestaTotal;
        return;
    }
    
    // Si hay créditos, mandarlos a Quetza Pulse
    if (creditos > 0) {
        let montoARetirar = creditos;
        creditos = 0;
        saldoGlobal += montoARetirar;
        displayCreditos.innerText = creditos;
        displaySaldoGlobal.innerText = saldoGlobal;
        alert(`💰 ¡CA-CHING!\nHas enviado ${montoARetirar} QC a tu Billetera Global.`);
    }
});

btnJugar.addEventListener("click", iniciarGiro);
