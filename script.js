// Variables del sistema
let creditos = 1000;
let enJuego = false;

// Elementos del DOM (Pantalla)
const btnJugar = document.getElementById("btn-jugar");
const displayCreditos = document.getElementById("creditos");

// Esta es la ruta exacta del perímetro (en el sentido de las agujas del reloj)
// Basado en tu esqueleto: Top -> Derecha -> Abajo -> Izquierda
const secuenciaLuz = [
    0, 1, 2, 3, 4, 5, 6,       // Fila de arriba (hacia la derecha)
    8, 10, 12, 14, 16,         // Columna derecha (hacia abajo)
    23, 22, 21, 20, 19, 18, 17, // Fila de abajo (hacia la izquierda)
    15, 13, 11, 9, 7           // Columna izquierda (hacia arriba)
];

// Función principal para girar la ruleta perimetral
function iniciarGiro() {
    // Si ya está girando, no hacer nada
    if (enJuego) return;
    
    // Descontar costo de giro (ejemplo: 10 créditos)
    if (creditos < 10) {
        alert("¡No tienes suficientes créditos!");
        return;
    }
    
    creditos -= 10;
    displayCreditos.innerText = creditos;
    enJuego = true;
    
    // Desactivar el botón jugar
    btnJugar.style.opacity = "0.5";
    btnJugar.style.cursor = "not-allowed";

    let posicionActual = 0;
    let vueltas = 0;
    // RNG: Elegir una casilla final al azar (del 0 al 23)
    const metaFinal = Math.floor(Math.random() * secuenciaLuz.length); 
    
    // Velocidad de la luz (milisegundos)
    let velocidad = 50; 
    let temporizador;

    // Función que mueve la luz paso a paso
    function moverLuz() {
        // 1. Apagar todas las casillas
        document.querySelectorAll('.casilla').forEach(c => c.classList.remove('activa'));

        // 2. Encender la casilla actual de la secuencia
        let idCasillaActiva = secuenciaLuz[posicionActual];
        document.getElementById(`casilla-${idCasillaActiva}`).classList.add('activa');

        // 3. Avanzar a la siguiente posición
        posicionActual++;

        // Si llegamos al final del arreglo, dar la vuelta
        if (posicionActual >= secuenciaLuz.length) {
            posicionActual = 0;
            vueltas++;
        }

        // 4. Lógica de frenado (después de 2 vueltas, empezamos a frenar)
        if (vueltas >= 2 && posicionActual === metaFinal) {
            // ¡SE DETUVO EN LA META!
            clearTimeout(temporizador);
            finalizarGiro(idCasillaActiva);
        } else {
            // Seguir girando (hacerlo más lento si ya dimos 2 vueltas)
            if (vueltas >= 2) {
                velocidad += 20; // Efecto de frenado
            }
            temporizador = setTimeout(moverLuz, velocidad);
        }
    }

    // Iniciar el motor
    moverLuz();
}

// Función cuando la luz se detiene
function finalizarGiro(casillaGanadora) {
    enJuego = false;
    btnJugar.style.opacity = "1";
    btnJugar.style.cursor = "pointer";
    
    // Aquí luego conectaremos los premios. Por ahora solo mostramos en consola
    console.log("Se detuvo en la casilla ID:", casillaGanadora);
    
    // Un pequeño efecto visual de parpadeo al ganar
    let parpadeos = 0;
    let parpadeoTimer = setInterval(() => {
        let elemento = document.getElementById(`casilla-${casillaGanadora}`);
        elemento.classList.toggle('activa');
        parpadeos++;
        if (parpadeos > 5) {
            clearInterval(parpadeoTimer);
            elemento.classList.add('activa'); // Dejarla encendida al final
        }
    }, 200);
}

// Escuchar el clic del botón
btnJugar.addEventListener("click", iniciarGiro);
