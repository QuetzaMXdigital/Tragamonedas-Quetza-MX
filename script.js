// ==========================================
// 1. CONFIGURACIÓN Y ECONOMÍA GLOBAL
// ==========================================
// 🔴 ELIMINAMOS saldoGlobal = 5000; 
// Ahora el juego usa 'saldoDisponible' que viene directamente del banco.
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
// 3. INICIALIZAR EL TABLERO Y LOS BOTONES
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
    // 🟢 Usamos saldoDisponible en lugar de saldoGlobal
    document.getElementById("saldo-global").innerText = typeof saldoDisponible !== 'undefined' ? saldoDisponible : 0;
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
        
        // 🟢 Validamos contra el saldo real del banco
        if (costoTotal <= saldoDisponible) {
            apuestas[fruta] = nueva;
            reproducir(sonidoMoneda);
        } else {
            alert("Saldo insuficiente en tu Billetera Quetza.");
        }
    }
    actualizarPantallas();
};

actualizarPantallas();

// ==========================================
// 5. MOTOR DEL JUEGO (COBRO AL BANCO Y GIRAR)
// ==========================================
// 🟢 Agregamos 'async' para poder conectarnos a Supabase
document.getElementById("btn-jugar").addEventListener("click", async () => {
    let totalMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
    
    if (enJuego || totalMesa === 0) return;
    
    // Verificación final de saldo
    if (saldoDisponible < totalMesa) {
        alert("No tienes suficientes Quetza Coins en tu billetera.");
        return;
    }

    // 🟢 1. COBRO OFICIAL EN LA BASE DE DATOS ANTES DE GIRAR
    const transaccion = await modificarSaldoUsuario(usuarioLogueado.id, totalMesa, 'apuesta_tragamonedas', false);
    
    if (!transaccion.exito) {
        alert("Error procesando tu apuesta en el banco: " + transaccion.mensaje);
        return; // Detenemos el giro si el banco falló
    }

    // 2. ACTUALIZACIÓN VISUAL (El banco ya cobró el dinero)
    saldoDisponible -= totalMesa;
    pozoDeLaCasa += totalMesa;
    ultimoPremio = 0;
    enJuego = true;
    actualizarPantallas();
    reproducir(sonidoGiro);

    // Sistema RTP (La ventaja de la casa)
    let rng = Math.random() * 100;
    let acumulado = 0;
    let frutaElegida = "exit";
    for (let clave in catalogo) {
        acumulado += catalogo[clave].peso;
        if (rng <= acumulado) { frutaElegida = clave; break; }
    }
    let opciones = [];
    for (let i = 0; i < mapaTablero.length; i++) {
        if (mapaTablero[i] === frutaElegida) opciones.push(i);
    }
    
    let metaAbsoluta = opciones[Math.floor(Math.random() * opciones.length)];
    let metaFinal = secuenciaLuz.indexOf(metaAbsoluta);
    
    let pos = 0, vueltas = 0, velocidad = 50;

    function mover() {
        document.querySelectorAll('.casilla').forEach(c => c.classList.remove('activa'));
        let idActual = secuenciaLuz[pos];
        let el = document.getElementById(`casilla-${idActual}`);
        if(el) el.classList.add('activa');
        
        pos++;
        if(pos >= secuenciaLuz.length) {
            pos = 0;
            vueltas++;
        }

        if(vueltas >= 2 && pos === (metaFinal + 1) % secuenciaLuz.length) {
            detener(sonidoGiro);
            finalizar(secuenciaLuz[(pos - 1 + secuenciaLuz.length) % secuenciaLuz.length]);
        } else {
            setTimeout(mover, vueltas >= 2 ? velocidad + 20 : velocidad);
        }
    }
    mover();
});

// ==========================================
// 6. RESULTADO Y PAGO DE PREMIOS (BÓVEDA)
// ==========================================
// 🟢 Transformamos a 'async' para depositar las ganancias
async function finalizar(idGanador) {
    let fruta = mapaTablero[idGanador];
    let gano = false;
    let premioCalculado = 0;
    
    if (fruta !== "exit" && apuestas[fruta] > 0) {
        premioCalculado = apuestas[fruta] * catalogo[fruta].multi;
        
        // 🟢 DEPÓSITO OFICIAL DESDE LA BÓVEDA A LA BILLETERA
        const pago = await modificarSaldoUsuario(usuarioLogueado.id, premioCalculado, 'premio_tragamonedas', true);
        
        if (pago.exito) {
            ultimoPremio = premioCalculado;
            pozoDeLaCasa -= ultimoPremio;
            saldoDisponible += ultimoPremio; // Sumamos al saldo real
            gano = true;
            reproducir(sonidoPremio);
        } else {
            alert("Hubo un problema depositando tu premio: " + pago.mensaje);
        }
    }
    
    actualizarPantallas();
    
    // Efecto visual de parpadeo de la casilla ganadora
    let parpadeos = 0;
    let el = document.getElementById(`casilla-${idGanador}`);
    let pTimer = setInterval(() => {
        if(el) el.classList.toggle('activa');
        parpadeos++;
        if (parpadeos > 6) {
            clearInterval(pTimer);
            if(el) el.classList.add('activa');
            enJuego = false;
            
            if (gano) {
                setTimeout(() => {
                    textoVictoria.innerText = `¡GANASTE ${ultimoPremio} QC!`;
                    modalVictoria.classList.add("mostrar");
                }, 100);
            }
        }
    }, 150);
}

// ==========================================
// 7. BOTÓN COBRAR (LIMPIAR MESA)
// ==========================================
document.getElementById("btn-cobrar").addEventListener("click", () => {
    if (enJuego) return;
    reproducir(sonidoCobrar);
    Object.keys(apuestas).forEach(f => apuestas[f] = 0);
    ultimoPremio = 0;
    actualizarPantallas();
});
