// Versão temporária simplificada do AuthManager (sem controle de sessão única)
// Use este arquivo temporariamente se houver problemas com o login

(function() {
    'use strict';

    // ========== CONFIGURAÇÕES ==========
    
    const SESSAO_VALIDA_HORAS = 24; // Sessão válida por 24 horas

    // ========== FUNÇÕES PRINCIPAIS ==========

    /**
     * Obter usuário logado atual (versão simplificada)
     */
    async function obterUsuarioAtual() {
        try {
            // Verificar sessão do Supabase Auth primeiro
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (session && session.user) {
                // Buscar dados completos do usuário no banco
                const { data: userData, error: userError } = await supabaseClient
                    .from('usuarios')
                    .select('*')
                    .eq('email', session.user.email)
                    .eq('status', 'ativo')
                    .single();
                
                if (userData && !userError) {
                    return formatarDadosUsuario(userData);
                }
            }
            
            // Se não tem sessão auth, buscar último usuário logado recentemente
            const { data: ultimoUsuario, error: ultimoError } = await supabaseClient
                .from('usuarios')
                .select('*')
                .eq('status', 'ativo')
                .not('ultimo_login', 'is', null)
                .order('ultimo_login', { ascending: false })
                .limit(1)
                .single();
            
            if (ultimoUsuario && !ultimoError) {
                // Verificar se o login foi recente (dentro do prazo de sessão)
                if (isLoginRecente(ultimoUsuario.ultimo_login)) {
                    return formatarDadosUsuario(ultimoUsuario);
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }

    /**
     * Verificar se um login é recente
     */
    function isLoginRecente(ultimoLogin) {
        if (!ultimoLogin) return false;
        
        const dataLogin = new Date(ultimoLogin);
        const agora = new Date();
        const diferencaHoras = (agora - dataLogin) / (1000 * 60 * 60);
        
        return diferencaHoras <= SESSAO_VALIDA_HORAS;
    }

    /**
     * Formatar dados do usuário
     */
    function formatarDadosUsuario(userData) {
        return {
            id: userData.id,
            usuario: userData.nome_usuario, // Campo principal usado pelo sistema
            nome_usuario: userData.nome_usuario, // Compatibilidade
            nome: userData.nome,
            email: userData.email,
            prioridade: userData.prioridade,
            status: userData.status,
            ultimo_login: userData.ultimo_login,
            data_criacao: userData.data_criacao,
            senha: userData.senha // Incluir senha para validações
        };
    }

    /**
     * Verificar se usuário tem permissão específica
     */
    async function temPermissao(permissao) {
        const usuario = await obterUsuarioAtual();
        if (!usuario || !usuario.prioridade) return false;
        
        const permissoesPorTipo = {
            ADM: ['dashboard', 'pedidos', 'relatorios', 'usuarios', 'backup'],
            VENDEDOR: ['dashboard', 'pedidos', 'relatorios']
        };
        
        const permissoesUsuario = permissoesPorTipo[usuario.prioridade] || [];
        return permissoesUsuario.includes(permissao);
    }

    /**
     * Verificar se usuário está logado
     */
    async function verificarAutenticacao() {
        const usuario = await obterUsuarioAtual();
        
        const isLoginPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname === '/' ||
                           window.location.pathname === '' ||
                           window.location.pathname.endsWith('/');
        
        if (!usuario && !isLoginPage) {
            console.log('Usuário não autenticado - redirecionando para login');
            window.location.href = 'index.html'; // Sem a barra inicial
            return null;
        }
        
        return usuario;
    }

    /**
     * Realizar logout completo
     */
    async function realizarLogout() {
        try {            
            // Fazer logout no Supabase Auth
            await supabaseClient.auth.signOut();
            
            // Invalidar sessão no banco
            const usuario = await obterUsuarioAtual();
            if (usuario && usuario.id) {
                await supabaseClient
                    .from('usuarios')
                    .update({ ultimo_login: null })
                    .eq('id', usuario.id);
            }            
        } catch (error) {
            console.error('Erro durante logout:', error);
            throw error;
        }
    }

    /**
     * Atualizar último login do usuário
     */
    async function atualizarUltimoLogin(userId) {
        try {
            await supabaseClient
                .from('usuarios')
                .update({ ultimo_login: new Date().toISOString() })
                .eq('id', userId);                
        } catch (error) {
            console.error('Erro ao atualizar último login:', error);
        }
    }

    /**
     * Buscar usuário por credenciais
     */
    async function buscarUsuarioPorCredenciais(nomeUsuario, senha) {
        try {
            const { data, error } = await supabaseClient
                .from('usuarios')
                .select('*')
                .eq('nome_usuario', nomeUsuario)
                .eq('senha', senha)
                .eq('status', 'ativo')
                .single();
            
            if (data && !error) {
                return formatarDadosUsuario(data);
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return null;
        }
    }

    // ========== EXPOSIÇÃO GLOBAL ==========
    
    window.AuthManager = {
        obterUsuarioAtual,
        temPermissao,
        verificarAutenticacao,
        realizarLogout,
        atualizarUltimoLogin,
        buscarUsuarioPorCredenciais,
        isLoginRecente
    };
})();