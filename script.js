// --- 1. CONFIGURACIÓN INICIAL ---
let saldoGlobal = 5000;
let creditos = 0;
let apuestaTotal = 0;
let enJuego = false;

let apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
const multiplicadores = { "Sandía": 20, "Estrella": 50, "Cereza": 2, "Tren": 0 };

const mapaTablero = [
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren",
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía",
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren",
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía"
];

const secuenciaLuz = [
    0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7
];

const iconos = { "Tren": "🚂", "Cereza": "🍒", "Sandía": "🍉", "Estrella": "⭐" };

// --- 2. ELEMENTOS UI ---
const displaySaldoGlobal = document.getElementById("saldo-global");
const displayCreditos = document.getElementById("creditos");
const displayApuesta = document.getElementById("apuesta");
const displayPremio = document.getElementById("premio");
const btnJugar = document.getElementById("btn-jugar");
const btnCobrar = document.querySelector(".btn-cobrar");
const botonesApuesta = document.querySelectorAll(".btn-apuesta");

// --- 3. INICIALIZACIÓN ---
function inicializarTablero() {
    for (let i = 0; i < 24; i++) {
        let casilla = document.getElementById(`casilla-${i}`);
        if (casilla) {
            let figura = mapaTablero[i];
            casilla.innerText = iconos[figura];
            casilla.style.fontSize = "24px";
        }
    }
    console.log("✅ Tablero de Frutas listo.");
}
inicializarTablero();

// --- 4. LÓGICA DE APUESTAS ---
botonesApuesta.forEach(boton => {
    boton.addEventListener("click", () => {
        if (enJuego) return;

        // Detectar fruta de forma robusta
        let contenido = boton.textContent.toLowerCase();
        let fruta = "";
        if (contenido.includes("sandía") || contenido.includes("sandia")) fruta = "Sandía";
        else if (contenido.includes("estrella")) fruta = "Estrella";
        else if (contenido.includes("cereza")) fruta = "Cereza";

        if (!fruta) return;

        // Lógica de cobro: Prioridad a créditos de la máquina, luego Saldo Global
        if (creditos >= 1) {
            creditos--;
            procesarApuesta(fruta);
        } else if (saldoGlobal >= 1) {
            saldoGlobal--;
            procesarApuesta(fruta);
        } else {
            alert("Saldo insuficiente en tu billetera Quetza.");
        }
    });
});

function procesarApuesta(fruta) {
    apuestaTotal++;
    apuestasActuales[fruta]++;
    actualizarPantallas();
    console.log(`🎰 Apuesta a ${fruta}: ${apuestasActuales[fruta]}`);
}

function actualizarPantallas() {
    displaySaldoGlobal.innerText = saldoGlobal;
    displayCreditos.innerText = creditos;
    displayApuesta.innerText = apuestaTotal;
}

// --- 5. MOTOR DE GIRO ---
btnJugar.addEventListener("click", () => {
    if (enJuego || apuestaTotal === 0) return;
    
    enJuego = true;
    displayPremio.innerText = "0";
    btnJugar.style.opacity = "0.5";

    let posicionActual = 0;
    let vueltas = 0;
    const metaFinal = Math.floor(Math.random() * secuenciaLuz.length);
    let velocidad = 60;
    let temporizador;

    function moverLuz() {
        document.querySelectorAll('.casilla').forEach(c => c.classList.remove('activa'));
        let idCasillaActiva = secuenciaLuz[posicionActual];
        let el = document.getElementById(`casilla-${idCasillaActiva}`);
        if (el) el.classList.add('activa');

        posicionActual++;
        if (posicionActual >= secuenciaLuz.length) {
            posicionActual = 0;
            vueltas++;
        }

        if (vueltas >= 2 && posicionActual === metaFinal) {
            clearTimeout(temporizador);
            finalizarGiro(idCasillaActiva);
        } else {
            if (vueltas >= 2) velocidad += 25;
            temporizador = setTimeout(moverLuz, velocidad);
        }
    }
    moverLuz();
});

// --- 6. PREMIOS Y COBROS ---
function finalizarGiro(idGanador) {
    let frutaGanadora = mapaTablero[idGanador];
    let apostado = apuestasActuales[frutaGanadora] || 0;

    if (apostado > 0) {
        let premio = apostado * multiplicadores[frutaGanadora];
        creditos += premio;
        displayPremio.innerText = premio;
        console.log(`🎉 ¡GANASTE! Cayó en ${frutaGanadora}. Premio: ${premio}`);
    }

    // Limpiar ronda
    apuestaTotal = 0;
    apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
    actualizarPantallas();
    
    setTimeout(() => {
        enJuego = false;
        btnJugar.style.opacity = "1";
    }, 1000);
}

btnCobrar.addEventListener("click", () => {
    if (enJuego) return;
    
    if (apuestaTotal > 0) {
        creditos += apuestaTotal;
        apuestaTotal = 0;
        apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
        console.log("⏪ Apuesta devuelta a créditos.");
    } else if (creditos > 0) {
        saldoGlobal += creditos;
        alert(`💰 Has cobrado ${creditos} QC a tu Billetera Global.`);
        creditos = 0;
    }
    actualizarPantallas();
});
