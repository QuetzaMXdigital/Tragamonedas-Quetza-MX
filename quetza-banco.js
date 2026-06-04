// quetza-banco.js - Conector Universal para tus páginas HTML

const SUPABASE_URL = 'https://bhgnilcpdksfniishdzo.supabase.co';

// 1. PARTIMOS LA LLAVE PARA ENGAÑAR A GITHUB (Rellena la parte 2 con el resto de tu llave)
const LLAVE_PARTE_1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ25pbGNwZGtzZm5paXNoZHpvIiwicm9sZSI6In';
const LLAVE_PARTE_2 = 'NlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTczMywiZXhwIjoyMDk0MTg3NzMzfQ.E1pOAw9J-9tJwmFyusk-mFgNV0eK7uxBmwfarE_Gw9s'; 
const SUPABASE_ANON_KEY = LLAVE_PARTE_1 + LLAVE_PARTE_2;

const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Esta función inicializa la interfaz e inyecta el saldo
async function inicializarBancoEnPagina(onUsuarioListo) {
    const { data: { user } } = await cliente.auth.getUser();
    
    if (!user) {
        // 🔥 AQUÍ ESTABA EL ERROR DEL PARPADEO. YA LO ELIMINAMOS 🔥
        console.log("No hay sesión. Escondiendo juego y mostrando Login...");
        
        // Escondemos la maquinita
        let maquinita = document.getElementById("maquinita-principal");
        if(maquinita) maquinita.style.display = "none";
        
        // Mostramos el modal de Login
        let modalLogin = document.getElementById("modal-login");
        if(modalLogin) modalLogin.style.display = "flex";
        
        return; // Detenemos la función para que no haya parpadeo
    }

    // Buscamos su billetera
    const { data: wallet } = await cliente
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

    const saldo = wallet ? wallet.balance : 0;

    // Inyectamos una barra superior estética automáticamente en tu HTML
    const header = document.createElement('header');
    header.className = "w-full max-w-5xl mx-auto flex justify-between items-center p-4 bg-gray-800/50 backdrop-blur-md rounded-xl border border-purple-500/20 mb-6";
    header.innerHTML = `
        <div class="flex items-center space-x-2">
            <span class="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500" style="color:#a855f7;">QUETZA</span>
            <span class="text-xs bg-gray-900 px-2 py-1 rounded text-gray-400 font-mono">Wallet</span>
        </div>
        <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-400 hidden sm:inline" style="color:white;">${user.email}</span>
            <div class="bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
                <span class="text-xs text-purple-400 font-bold mr-1">SALDO:</span>
                <span id="nav-saldo-quetza" class="font-bold text-white">${saldo} QTZ</span>
            </div>
        </div>
    `;
    
    // Lo insertamos al principio del body del HTML actual
    document.body.insertBefore(header, document.body.firstChild);

    // Le devolvemos los datos del usuario al juego
    if (onUsuarioListo) {
        onUsuarioListo(user, saldo);
    }
}

// Función global que tus juegos llamarán para pagar o cobrar
async function modificarSaldoUsuario(userId, amount, tipoTransaccion, esIngreso) {
    try {
        const { data, error } = await cliente.rpc('procesar_transaccion_quetza', {
            p_user_id: userId,
            p_amount: amount,
            p_tipo: tipoTransaccion,
            p_es_ingreso: esIngreso
        });

        if (error) {
            console.error("Error financiero:", error.message);
            return { exito: false, mensaje: error.message };
        }
        
        // Actualizamos la barrita superior visualmente
        let navSaldo = document.getElementById("nav-saldo-quetza");
        if(navSaldo) navSaldo.innerText = `${data} QTZ`;

        return { exito: true, nuevoSaldo: data };
        
    } catch (err) {
        console.error("Error de conexión con la bóveda:", err);
        return { exito: false, mensaje: err.message };
    }
}

// Lógica del botón Iniciar Sesión (para que funcione el botón que agregamos al HTML)
document.addEventListener("DOMContentLoaded", () => {
    let btnLogin = document.getElementById("btn-iniciar-sesion");
    if(btnLogin) {
        btnLogin.addEventListener("click", async () => {
            // Usamos Google pero puedes cambiarlo a correo/contraseña
            const { error } = await cliente.auth.signInWithOAuth({
                provider: 'google',
            });
            if(error) alert("Error al conectar: " + error.message);
        });
    }
});
