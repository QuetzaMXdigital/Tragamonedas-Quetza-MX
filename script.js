// --- 1. VARIABLES Y CONFIGURACIÓN ---
let creditos = 1000;
let apuestaTotal = 0;
let enJuego = false;

// Registro de cuánto apostó el jugador a cada figura en esta ronda
let apuestasActuales = {
    "Sandía": 0,
    "Estrella": 0,
    "Cereza": 0
};

// Tabla de multiplicadores (Lo que paga cada figura)
const multiplicadores = {
    "Sandía": 20,
    "Estrella": 50,
    "Cereza": 2,
    "Tren": 0 // El tren te hace perder
};

// Mapeo del tablero: Le decimos qué figura hay en cada casilla (del 0 al 23)
// Las posiciones 0, 6, 12 y 18 suelen ser las esquinas (Los Trenes/Exit)
const mapaTablero = [
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren", // Arriba
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía",                 // Derecha
    "Tren", "Cereza", "Sandía", "Cereza", "Estrella", "Cereza", "Tren", // Abajo
    "Sandía", "Cereza", "Estrella", "Cereza", "Sandía"                  // Izquierda
];

// Secuencia de giro (el orden de los IDs en el HTML)
const secuenciaLuz = [
    0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7
];


// --- 2. ELEMENTOS DE LA PANTALLA ---
const btnJugar = document.getElementById("btn-jugar");
const displayCreditos = document.getElementById("creditos");
const displayApuesta = document.getElementById("apuesta");
const displayPremio = document.getElementById("premio");

// Botones de apuesta (Seleccionamos todos los botones con la clase 'btn-apuesta')
const botonesApuesta = document.querySelectorAll(".btn-apuesta");


// --- 3. LÓGICA DE APUESTAS ---
// Le asignamos la función de apostar a cada botón verde
botonesApuesta.forEach(boton => {
    boton.addEventListener("click", () => {
        if (enJuego) return; // No puede apostar mientras gira
        
        if (creditos >= 1) {
            let frutaSeleccionada = boton.innerText;
            
            // Restar crédito y sumar a la apuesta
            creditos--;
            apuestaTotal++;
            apuestasActuales[frutaSeleccionada]++;
            
            // Actualizar la pantalla
            displayCreditos.innerText = creditos;
            displayApuesta.innerText = apuestaTotal;
            
            console.log(`Apostaste a: ${frutaSeleccionada}. Llevas: ${apuestasActuales[frutaSeleccionada]}`);
        } else {
            alert("No tienes suficientes créditos.");
        }
    });
});


// --- 4. MOTOR DE GIRO ---
function iniciarGiro() {
    if (enJuego) return;
    if (apuestaTotal === 0) {
        alert("¡Debes apostar al menos a una figura antes de jugar!");
        return;
    }
    
    enJuego = true;
    displayPremio.innerText = "0"; // Reiniciamos el premio visual
    btnJugar.style.opacity = "0.5";

    let posicionActual = 0;
    let vueltas = 0;
    // RNG: Elegir una casilla final al azar
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

        // Frenado
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
    // 1. Averiguamos qué fruta hay en esa casilla
    let frutaGanadora = mapaTablero[idCasillaGanadora];
    console.log(`¡Cayó en la casilla ${idCasillaGanadora}, que es: ${frutaGanadora}!`);

    // 2. Revisamos si el usuario apostó a esa fruta
    let monedasApostadas = apuestasActuales[frutaGanadora] || 0;
    
    if (monedasApostadas > 0) {
        // ¡Ganó! Calculamos el premio
        let multiplicador = multiplicadores[frutaGanadora];
        let premioTotal = monedasApostadas * multiplicador;
        
        creditos += premioTotal; // Le sumamos las ganancias
        displayPremio.innerText = premioTotal; // Mostramos el premio
        console.log(`¡GANASTE! ${premioTotal} créditos.`);
    } else {
        console.log("No apostaste a esta figura. Suerte para la próxima.");
    }

    // 3. Reiniciamos la máquina para la siguiente ronda
    apuestaTotal = 0;
    apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
    
    // Actualizamos pantallas
    displayCreditos.innerText = creditos;
    displayApuesta.innerText = apuestaTotal;
    
    // Parpadeo de la casilla ganadora
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

btnJugar.addEventListener("click", iniciarGiro);
// --- 6. BOTÓN COBRAR (CASH OUT) ---
const btnCobrar = document.querySelector(".btn-cobrar");

btnCobrar.addEventListener("click", () => {
    // Si la máquina está girando, bloqueamos el botón
    if (enJuego) return;

    // CASO 1: El usuario tiene apuestas puestas, pero no ha girado.
    // Acción: Devolvemos las monedas de la apuesta a sus créditos.
    if (apuestaTotal > 0) {
        creditos += apuestaTotal; // Devolvemos el dinero
        apuestaTotal = 0;         // Limpiamos el tablero de apuestas
        apuestasActuales = { "Sandía": 0, "Estrella": 0, "Cereza": 0 };
        
        // Actualizamos las pantallas
        displayCreditos.innerText = creditos;
        displayApuesta.innerText = apuestaTotal;
        
        console.log("Apuesta cancelada. Monedas devueltas.");
        return; // Detenemos la función aquí
    }

    // CASO 2: No hay apuestas activas. El usuario quiere retirar su dinero.
    if (creditos > 0) {
        let montoRetirado = creditos;
        creditos = 0; // Vaciamos la máquina
        displayCreditos.innerText = creditos;
        
        // Aquí es donde en el futuro llamaremos al Smart Contract de NEAR
        // Por ahora, lanzamos una alerta visual de éxito
        alert(`💰 ¡CA-CHING!\n\nHas cobrado: ${montoRetirado} Quetza Coins.\nSe han transferido a tu Wallet de Hormulz Pulse.`);
        console.log(`Retiro exitoso de ${montoRetirado} QC.`);
    } else {
        alert("Tu saldo está en 0. ¡Recarga Quetza Coins para seguir jugando!");
    }
});
