// quetza-banco.js - Conector Universal para tus páginas HTML

const SUPABASE_URL = 'https://bhgnilcpdksfniishdzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ25pbGNwZGtzZm5paXNoZHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTczMywiZXhwIjoyMDk0MTg3NzMzfQ.E1pOAw9J-9tJwmFyusk-mFgNV0eK7uxBmwfarE_Gw9s';

const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Esta función inicializa la interfaz e inyecta el saldo en cualquier página
async function inicializarBancoEnPagina(onUsuarioListo) {
    const { data: { user } } = await cliente.auth.getUser();
    
    if (!user) {
        // Si no está logueado, lo mandamos a la puerta de entrada principal
        window.location.href = 'index.html';
        return;
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
            <span class="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">QUETZA</span>
            <span class="text-xs bg-gray-900 px-2 py-1 rounded text-gray-400 font-mono">Wallet</span>
        </div>
        <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-400 hidden sm:inline">${user.email}</span>
            <div class="bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
                <span class="text-xs text-purple-400 font-bold mr-1">SALDO:</span>
                <span id="nav-saldo-quetza" class="font-bold text-white">${saldo} QTZ</span>
            </div>
        </div>
    `;
    
    // Lo insertamos al principio del body del HTML actual
    document.body.insertBefore(header, document.body.firstChild);

    // Le devolvemos los datos del usuario al juego/oráculo para que sepa quién está jugando
    if (onUsuarioListo) {
        onUsuarioListo(user, saldo);
    }
}

// Función global que tus juegos llamarán para pagar o cobrar
async function modificarSaldoUsuario(userId, amount, tipoTransaccion, esIngreso) {
    try {
        // Llamamos al motor interno de la bóveda (usando 'cliente', no 'supabase')
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
        
        // Retornamos el nuevo saldo para que el juego actualice la pantalla
        return { exito: true, nuevoSaldo: data };
        
    } catch (err) {
        console.error("Error de conexión con la bóveda:", err);
        return { exito: false, mensaje: err.message };
    }
}