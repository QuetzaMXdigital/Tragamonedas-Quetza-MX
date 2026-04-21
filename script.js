// --- 1. VARIABLES Y CONFIGURACIÓN (EL CEREBRO FINANCIERO) ---
let saldoGlobal = 5000; // Saldo en tu portafolio de Quetza
let creditos = 0;       // Créditos cargados en la maquinita
let apuestaTotal = 0;
let enJuego = false;

// Registro de apuestas por símbolo
let apuestasActuales = {
    "Sandía": 0,
    "Estrella": 0,
    "Cereza": 0
};

const multiplicadores = {
    "Sandía": 20,
    "Estrella": 50,
    "Cereza": 2,
    "Tren": 0 
};

const mapaTablero = [
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren",
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía",
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren",
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía"
];

const secuenciaLuz = [
    0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7
];

// --- 2. ELEMENTOS DE LA PANTALLA (CONEXIÓN CON EL HTML) ---
const displaySaldoGlobal = document.getElementById("saldo-global"); // La barra superior
const displayCreditos = document.getElementById("creditos");
const displayApuesta = document.getElementById("apuesta");
const displayPremio = document.getElementById("premio");
const btnJugar = document.getElementById("btn-jugar");
const btnCobrar = document.querySelector(".btn-cobrar");
const botonesApuesta = document.querySelectorAll(".btn-apuesta");

// --- 3. LÓGICA DE APUESTAS ---
botonesApuesta.forEach(boton => {
    boton.addEventListener("click", () => {
        if (enJuego) return;
        
        // Primero intentamos usar créditos de la máquina, si no hay, jalamos del saldo global
        if (creditos >= 1) {
            let frutaSeleccionada = boton.innerText;
            creditos--;
            apuestaTotal++;
            apuestasActuales[frutaSeleccionada]++;
            
            displayCreditos.innerText = creditos;
            displayApuesta.innerText = apuestaTotal;
        } else if (saldoGlobal >= 1) {
            // Carga automática desde la billetera si la máquina está en 0
            let frutaSeleccionada = boton.innerText;
            saldoGlobal--;
            apuestaTotal++;
            apuestasActuales[frutaSeleccionada]++;
            
            displaySaldoGlobal.innerText = saldoGlobal;
            displayApuesta.innerText = apuestaTotal;
        } else {
            alert("No tienes fondos suficientes en tu portafolio.");
        }
    });
});

// --- 4. MOTOR DE GIRO ---
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

// --- 5. RESOLUCIÓN DE PREMIOS ---
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

// --- 6. BOTÓN COBRAR (SACA EL DINERO DE LA MAQUINA AL PORTAFOLIO GLOBAL) ---
btnCobrar.addEventListener("click", () => {
    if (enJuego) return;

    if (apuestaTotal > 0) {
        // Devolver apuesta a créditos de la máquina
        creditos += apuestaTotal;
        apuestaTotal = 0;
        apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
        displayCreditos.innerText = creditos;
        displayApuesta.innerText = apuestaTotal;
        return;
    }

    if (creditos > 0) {
        let montoARetirar = creditos;
        creditos = 0;
        saldoGlobal += montoARetirar; // Aquí ocurre la magia: el dinero sube a la billetera global
        
        displayCreditos.innerText = creditos;
        displaySaldoGlobal.innerText = saldoGlobal;
        
        alert(`💰 ¡Cobro exitoso!\nHas enviado ${montoARetirar} QC a tu Billetera Global.`);
    }
});

btnJugar.addEventListener("click", iniciarGiro);
