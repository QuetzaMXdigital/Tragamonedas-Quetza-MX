// --- 1. CONFIGURACIÓN BÁSICA (SIN ACENTOS PARA EVITAR ERRORES) ---
let saldoGlobal = 5000;
let creditos = 0;
let apuestaTotal = 0;
let enJuego = false;

let apuestasActuales = { "sandia": 0, "estrella": 0, "cereza": 0 };
const multiplicadores = { "sandia": 20, "estrella": 50, "cereza": 2, "tren": 0 };

const mapaTablero = [
    "tren", "cereza", "sandia", "cereza", "estrella", "cereza", "tren",
    "sandia", "cereza", "estrella", "cereza", "sandia",
    "tren", "cereza", "sandia", "cereza", "estrella", "cereza", "tren",
    "sandia", "cereza", "estrella", "cereza", "sandia"
];

const secuenciaLuz = [
    0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7
];

const iconos = { "tren": "🚂", "cereza": "🍒", "sandia": "🍉", "estrella": "⭐" };

// --- 2. CONEXIÓN CON LA PANTALLA ---
const displaySaldoGlobal = document.getElementById("saldo-global");
const displayCreditos = document.getElementById("creditos");
const displayApuesta = document.getElementById("apuesta");
const displayPremio = document.getElementById("premio");
const btnJugar = document.getElementById("btn-jugar");
const btnCobrar = document.querySelector(".btn-cobrar");
const botonesApuesta = document.querySelectorAll(".btn-apuesta");

// --- 3. PINTAR EL TABLERO ---
function inicializarTablero() {
    for (let i = 0; i < 24; i++) {
        let casilla = document.getElementById(`casilla-${i}`);
        if (casilla) {
            let figura = mapaTablero[i];
            casilla.innerText = iconos[figura];
            casilla.style.fontSize = "24px";
        }
    }
}
inicializarTablero();

// --- 4. APOSTAR (LÓGICA BLINDADA) ---
function actualizarPantallas() {
    displaySaldoGlobal.innerText = saldoGlobal;
    displayCreditos.innerText = creditos;
    displayApuesta.innerText = apuestaTotal;
}

botonesApuesta.forEach(boton => {
    boton.addEventListener("click", () => {
        if (enJuego) return;

        let contenido = boton.textContent.toLowerCase();
        let fruta = "";
        
        // Detección a prueba de balas (busca solo partes de la palabra)
        if (contenido.includes("sand")) fruta = "sandia";
        else if (contenido.includes("estrella")) fruta = "estrella";
        else if (contenido.includes("cereza")) fruta = "cereza";

        if (!fruta) return;

        // Cobro prioritario de la máquina, luego de la billetera global
        if (creditos >= 1) {
            creditos--;
        } else if (saldoGlobal >= 1) {
            saldoGlobal--;
        } else {
            alert("No tienes fondos suficientes.");
            return;
        }

        apuestaTotal++;
        apuestasActuales[fruta]++;
        actualizarPantallas();
        console.log(`Apuesta registrada a: ${fruta}. Llevas: ${apuestasActuales[fruta]}`);
    });
});

// --- 5. EL MOTOR QUE GIRA ---
btnJugar.addEventListener("click", () => {
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
        let el = document.getElementById(`casilla-${idCasillaActiva}`);
        if (el) el.classList.add('activa');

        posicionActual++;
        if (posicionActual >= secuenciaLuz.length) {
            posicionActual = 0;
            vueltas++;
        }

        // Frenado final
        if (vueltas >= 2 && posicionActual === metaFinal) {
            clearTimeout(temporizador);
            finalizarGiro(idCasillaActiva);
        } else {
            if (vueltas >= 2) velocidad += 20;
            temporizador = setTimeout(moverLuz, velocidad);
        }
    }
    moverLuz();
});

// --- 6. RESOLUCIÓN DE PREMIOS ---
function finalizarGiro(idGanador) {
    let frutaGanadora = mapaTablero[idGanador]; // ej. "sandia"
    let apostado = apuestasActuales[frutaGanadora] || 0;

    console.log(`La máquina se detuvo en: ${frutaGanadora}`);

    if (apostado > 0) {
        let premio = apostado * multiplicadores[frutaGanadora];
        creditos += premio;
        displayPremio.innerText = premio;
        
        // Alerta triunfal para que sea imposible ignorarlo
        setTimeout(() => {
            alert(`🎉 ¡GANASTE!\n\nLe atinaste a la ${iconos[frutaGanadora]}\nPremio: ${premio} créditos.`);
        }, 100);
    } else {
        console.log("No tenías apuesta en esta figura.");
    }

    // Resetear apuestas de la mesa
    apuestaTotal = 0;
    apuestasActuales = { "sandia": 0, "estrella": 0, "cereza": 0 };
    actualizarPantallas();

    // Efecto de parpadeo de la casilla ganadora
    let parpadeos = 0;
    let el = document.getElementById(`casilla-${idGanador}`);
    let parpadeoTimer = setInterval(() => {
        if(el) el.classList.toggle('activa');
        parpadeos++;
        if (parpadeos > 6) {
            clearInterval(parpadeoTimer);
            if(el) el.classList.add('activa');
            enJuego = false;
            btnJugar.style.opacity = "1";
        }
    }, 150);
}

// --- 7. BOTÓN COBRAR ---
btnCobrar.addEventListener("click", () => {
    if (enJuego) return;
    
    // Si tienes apuesta pero no giraste, te la regresa
    if (apuestaTotal > 0) {
        creditos += apuestaTotal;
        apuestaTotal = 0;
        apuestasActuales = { "sandia": 0, "estrella": 0, "cereza": 0 };
    } 
    // Si tienes dinero ganado, se va a tu cuenta de Quetza
    else if (creditos > 0) {
        let monto = creditos;
        saldoGlobal += monto;
        creditos = 0;
        alert(`💰 ¡CA-CHING!\n\nCobraste ${monto} QC a tu Billetera Global.`);
    }
    actualizarPantallas();
});
// --- 9. SISTEMA DE RECARGA (DEPÓSITO) ---
const btnCargar = document.getElementById("btn-cargar-100");

btnCargar.addEventListener("click", () => {
    if (enJuego) return;

    const montoARecargar = 100; // Monto fijo por clic, podrías usar un input

    if (saldoGlobal >= montoARecargar) {
        // Ejecutar la transferencia
        saldoGlobal -= montoARecargar;
        creditos += montoARecargar;
        
        // Actualizar visualmente ambos saldos
        actualizarPantallas();
        
        console.log(`✅ Depósito exitoso: ${montoARecargar} QC movidos al juego.`);
        // Opcional: un pequeño sonido de monedas
    } else {
        alert("⚠️ No tienes suficiente saldo en tu Billetera Global de Quetza.");
    }
});
