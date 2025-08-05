// ========== CRUD FORNECEDORES ========== 

// Criar fornecedor
async function criarFornecedor(dadosFornecedor) {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores')
            .insert([dadosFornecedor])
            .select();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        return { success: false, error: error.message };
    }
}

// Buscar todos os fornecedores
async function buscarFornecedores() {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores')
            .select('*')
            .order('nome', { ascending: true });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        return { success: false, error: error.message };
    }
}

// Buscar fornecedor por ID
async function buscarFornecedorPorId(id) {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar fornecedor:', error);
        return { success: false, error: error.message };
    }
}

// Atualizar fornecedor
async function atualizarFornecedor(id, dadosFornecedor) {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores')
            .update(dadosFornecedor)
            .eq('id', id)
            .select();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        return { success: false, error: error.message };
    }
}

// Excluir fornecedor
async function excluirFornecedor(id) {
    try {
        const { error } = await supabaseClient
            .from('fornecedores')
            .delete()
            .eq('id', id);
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        return { success: false, error: error.message };
    }
}

// ========== CRUD PAGAMENTOS DE FORNECEDORES ========== 

// Criar pagamento de fornecedor
async function criarPagamentoFornecedor(dadosPagamento) {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores_pagamentos')
            .insert([dadosPagamento])
            .select();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao criar pagamento de fornecedor:', error);
        return { success: false, error: error.message };
    }
}

// Buscar todos os pagamentos de fornecedores (com dados do fornecedor)
async function buscarPagamentosFornecedores() {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores_pagamentos')
            .select('*, fornecedores:fornecedor_id(nome, cpf_cnpj, celular)')
            .order('vencimento', { ascending: false });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar pagamentos de fornecedores:', error);
        return { success: false, error: error.message };
    }
}

// Buscar pagamento de fornecedor por ID
async function buscarPagamentoFornecedorPorId(id) {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores_pagamentos')
            .select('*, fornecedores(nome, produto)')
            .eq('id', id)
            .single();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar pagamento de fornecedor:', error);
        return { success: false, error: error.message };
    }
}

// Atualizar pagamento de fornecedor
async function atualizarPagamentoFornecedor(id, dadosPagamento) {
    try {
        const { data, error } = await supabaseClient
            .from('fornecedores_pagamentos')
            .update(dadosPagamento)
            .eq('id', id)
            .select();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao atualizar pagamento de fornecedor:', error);
        return { success: false, error: error.message };
    }
}

// Excluir pagamento de fornecedor
async function excluirPagamentoFornecedor(id) {
    try {
        const { error } = await supabaseClient
            .from('fornecedores_pagamentos')
            .delete()
            .eq('id', id);
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir pagamento de fornecedor:', error);
        return { success: false, error: error.message };
    }
}
// ============================================
// SOMA - Sistema de Gestão - Database Module
// ⚠️  CONFIDENCIAL - Contém informações sensíveis
// ============================================

// Configuração de produção - NÃO EXPOR EM DESENVOLVIMENTO
const SUPABASE_CONFIG = (function() {
    // Configuração protegida
    const config = {
        url: 'https://nkgcmqzaiawfiaortazz.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZ2NtcXphaWF3Zmlhb3J0YXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjk1MjgsImV4cCI6MjA2ODk0NTUyOH0.32Y_007CqXXmhdhdQdQFGbt274G2RSRsADERS8_bJ5g'
    };
    
    // Em produção, estas chaves devem vir de variáveis de ambiente
    if (typeof process !== 'undefined' && process.env) {
        return {
            url: process.env.SUPABASE_URL || config.url,
            key: process.env.SUPABASE_ANON_KEY || config.key
        };
    }
    
    return config;
})();

// Inicializar cliente Supabase com proteção
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// Verificação de segurança - TEMPORARIAMENTE DESABILITADA PARA DEBUG
/*
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Desabilitar console em produção
    console.log = function() {};
    console.warn = function() {};
    console.error = function() {};
    
    // Proteger contra debugging
    setInterval(function() {
        if (window.devtools.open) {
            window.location.href = 'about:blank';
        }
    }, 500);
}
*/

// ========== CRUD CLIENTES ==========

// Criar cliente
async function criarCliente(dadosCliente) {
    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .insert([dadosCliente])
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        return { success: false, error: error.message };
    }
}

// Buscar todos os clientes
async function buscarClientes() {
    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        return { success: false, error: error.message };
    }
}

// Buscar cliente por ID
async function buscarClientePorId(id) {
    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return { success: false, error: error.message };
    }
}

// Atualizar cliente
async function atualizarCliente(id, dadosCliente) {
    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .update(dadosCliente)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return { success: false, error: error.message };
    }
}

// Excluir cliente
async function excluirCliente(id) {
    try {
        const { error } = await supabaseClient
            .from('clientes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        return { success: false, error: error.message };
    }
}

// ========== CRUD PEDIDOS ==========

// Criar pedido
async function criarPedido(dadosPedido) {
    try {
        const { data, error } = await supabaseClient
            .from('pedidos')
            .insert([dadosPedido])
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        return { success: false, error: error.message };
    }
}

// Buscar todos os pedidos com dados do cliente e vendedor
async function buscarPedidos() {
    try {
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                *,
                clientes:cliente_id (
                    nome,
                    cpf_cnpj
                ),
                usuarios:vendedor_id (
                    nome,
                    nome_usuario
                )
            `)
            .order('data_pedido', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return { success: false, error: error.message };
    }
}

// Buscar pedido por ID
async function buscarPedidoPorId(id) {
    try {
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                *,
                clientes:cliente_id (*),
                usuarios:vendedor_id (
                    nome,
                    nome_usuario
                )
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return { success: false, error: error.message };
    }
}

// Atualizar pedido
async function atualizarPedido(id, dadosAtualizados) {
    try {
        const { data, error } = await supabaseClient
            .from('pedidos')
            .update(dadosAtualizados)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        return { success: false, error: error.message };
    }
}

// Excluir pedido
async function excluirPedido(id) {
    try {
        const { error } = await supabaseClient
            .from('pedidos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        return { success: false, error: error.message };
    }
}

// ========== FUNÇÕES AUXILIARES ==========

// Buscar cliente por CPF/CNPJ
async function buscarClientePorCpf(cpfCnpj) {
    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('cpf_cnpj', cpfCnpj)
            .maybeSingle();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar cliente por CPF:', error);
        return { success: false, error: error.message };
    }
}

// Buscar pedidos agrupados por cliente e data (para relatório de compras)
async function buscarComprasAgrupadas() {
    try {
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                cliente_id,
                vendedor,
                data_pedido,
                id,
                discriminacao,
                quantidade,
                unidade,
                valor_unitario,
                total,
                clientes:cliente_id (
                    nome,
                    cpf_cnpj,
                    cidade,
                    celular,
                    endereco,
                    estado
                )
            `)
            .order('data_pedido', { ascending: false })
            .order('cliente_id', { ascending: true });
        
        if (error) throw error;
        
        // Agrupar pedidos por cliente e data
        const comprasAgrupadas = [];
        const grupos = {};
        
        data.forEach(pedido => {
            const chaveGrupo = `${pedido.cliente_id}-${pedido.data_pedido}-${pedido.vendedor}`;
            
            if (!grupos[chaveGrupo]) {
                grupos[chaveGrupo] = {
                    compra_id: pedido.id, // Usar o ID do primeiro pedido do grupo
                    cliente_id: pedido.cliente_id,
                    vendedor: pedido.vendedor,
                    data_pedido: pedido.data_pedido,
                    cliente: pedido.clientes,
                    itens: [],
                    total_compra: 0,
                    quantidade_itens: 0
                };
            }
            
            grupos[chaveGrupo].itens.push({
                id: pedido.id,
                discriminacao: pedido.discriminacao,
                quantidade: pedido.quantidade,
                unidade: pedido.unidade,
                valor_unitario: pedido.valor_unitario,
                total: pedido.total
            });
            
            grupos[chaveGrupo].total_compra += pedido.total || 0;
            grupos[chaveGrupo].quantidade_itens++;
        });
        
        // Converter objeto em array
        Object.values(grupos).forEach(grupo => {
            comprasAgrupadas.push(grupo);
        });
        
        return { success: true, data: comprasAgrupadas };
    } catch (error) {
        console.error('Erro ao buscar compras agrupadas:', error);
        return { success: false, error: error.message };
    }
}

// Buscar todos os itens de uma compra específica
async function buscarItensCompra(clienteId, dataPedido, vendedor) {
    try {
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                *,
                clientes:cliente_id (
                    nome,
                    cpf_cnpj,
                    cidade,
                    celular,
                    endereco,
                    estado
                )
            `)
            .eq('cliente_id', clienteId)
            .eq('data_pedido', dataPedido)
            .eq('vendedor', vendedor)
            .order('id', { ascending: true });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar itens da compra:', error);
        return { success: false, error: error.message };
    }
}

// Pesquisar pedidos
async function pesquisarPedidos(termo) {
    try {
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                *,
                clientes:cliente_id (
                    nome,
                    cpf_cnpj
                )
            `)
            .or(`discriminacao.ilike.%${termo}%,vendedor.ilike.%${termo}%,clientes.nome.ilike.%${termo}%`)
            .order('data_pedido', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao pesquisar pedidos:', error);
        return { success: false, error: error.message };
    }
}

// Função duplicada removida - mantida apenas a implementação mais completa abaixo

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

// Obter usuário logado do localStorage (DEPRECADO - usar AuthManager)
function obterUsuarioLogado() {
    console.warn('⚠️ obterUsuarioLogado() está deprecated. Use AuthManager.obterUsuarioAtual()');
    
    // Tentar pegar do localStorage (pode não existir mais)
    const dadosUsuario = localStorage.getItem('usuarioLogado');
    if (dadosUsuario) {
        try {
            return JSON.parse(dadosUsuario);
        } catch (error) {
            console.error('Erro ao parsear dados do localStorage:', error);
            localStorage.removeItem('usuarioLogado'); // Limpar dados corrompidos
        }
    }
    
    // Se não tem no localStorage, retornar null
    // O AuthManager deve ser usado como fonte principal
    return null;
}

// Realizar logout
function realizarLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/index.html';
}

// Verificar se usuário está logado (usar em outras páginas)
function verificarAutenticacao() {
    // Não verificar autenticação na página de login
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    
    if (isLoginPage) {
        return null; // Na página de login, não fazer verificação
    }
    
    const usuarioLogado = obterUsuarioLogado();
    
    if (!usuarioLogado) {
        Swal.fire({
            icon: 'warning',
            title: 'Acesso negado',
            text: 'Você precisa fazer login para acessar esta página.',
            confirmButtonColor: '#4a7c59'
        }).then(() => {
            window.location.href = '/index.html';
        });
        return false;
    }
    
    return usuarioLogado;
}

// ========== FUNCIONALIDADES AVANÇADAS ==========

// Obter estatísticas para dashboard
async function obterEstatisticas() {
    try {
        console.log('🔍 Iniciando consulta de estatísticas...');
        
        // Buscar dados dos últimos 30 dias para estatísticas dinâmicas
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 30);
        
        // Total de pedidos
        console.log('📊 Consultando total de pedidos...');
        const { count: totalPedidos } = await supabaseClient
            .from('pedidos')
            .select('*', { count: 'exact', head: true });
        console.log('🔢 Total de pedidos:', totalPedidos);
        
        // Total de clientes ativos
        console.log('👥 Consultando total de clientes...');
        const { count: clientesAtivos } = await supabaseClient
            .from('clientes')
            .select('*', { count: 'exact', head: true });
        console.log('🔢 Total de clientes:', clientesAtivos);
        
        // Faturamento total
        console.log('💰 Consultando faturamento total...');
        const { data: pedidosValor } = await supabaseClient
            .from('pedidos')
            .select('total');
        console.log('💰 Dados de faturamento:', pedidosValor);
        
        const faturamentoTotal = pedidosValor?.reduce((acc, p) => acc + (p.total || 0), 0) || 0;
        console.log('💰 Faturamento calculado:', faturamentoTotal);
        
        // Vendas este mês
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        const dataIsoMes = inicioMes.toISOString();
        console.log('📅 Consultando vendas do mês desde:', dataIsoMes);
        
        const { count: vendasMes } = await supabaseClient
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .gte('data_pedido', dataIsoMes);
        console.log('🔢 Vendas do mês:', vendasMes);
        
        const resultado = {
            success: true,
            data: {
                totalPedidos: totalPedidos || 0,
                clientesAtivos: clientesAtivos || 0,
                faturamentoTotal: faturamentoTotal,
                vendasMes: vendasMes || 0
            }
        };
        
        console.log('✅ Estatísticas finais:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        return {
            success: false,
            data: {
                totalPedidos: 0,
                clientesAtivos: 0,
                faturamentoTotal: 0,
                vendasMes: 0
            }
        };
    }
}

// Adicione esta função auxiliar no início ou antes de obterDadosGraficos
function formatarDataLocal(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');
}

// Obter dados para gráficos
async function obterDadosGraficos() {
    try {
        // Buscar todos os pedidos do ano atual
        const anoAtual = new Date().getFullYear();
        const inicioAno = `${anoAtual}-01-01T00:00:00.000Z`;
        const fimAno = `${anoAtual}-12-31T23:59:59.999Z`;

        const { data: pedidos, error } = await supabaseClient
            .from('pedidos')
            .select('total, data_pedido')
            .gte('data_pedido', inicioAno)
            .lte('data_pedido', fimAno);

        if (error) throw error;

        // Inicializa array de 12 meses
        const vendasMensais = Array(12).fill(0);

        pedidos?.forEach(pedido => {
            const data = new Date(pedido.data_pedido);
            const mes = data.getUTCMonth(); // 0 = Jan, 11 = Dez
            vendasMensais[mes] += pedido.total || 0;
        });

        // Top produtos (mantém igual)
        const { data: produtos } = await supabaseClient
            .from('pedidos')
            .select('discriminacao, total')
            .order('total', { ascending: false })
            .limit(10);

        const produtosAgrupados = {};
        produtos?.forEach(p => {
            const produto = p.discriminacao || 'Produto sem nome';
            produtosAgrupados[produto] = (produtosAgrupados[produto] || 0) + (p.total || 0);
        });

        const topProdutos = Object.entries(produtosAgrupados)
            .map(([nome, vendas]) => ({ nome, vendas }))
            .slice(0, 5);

        return {
            success: true,
            vendas: vendasMensais,
            produtos: topProdutos
        };
    } catch (error) {
        console.error('Erro ao obter dados dos gráficos:', error);
        return {
            success: false,
            vendas: [],
            produtos: []
        };
    }
}

// Obter últimos pedidos
async function obterUltimosPedidos() {
    try {
        console.log('🔍 Consultando últimos pedidos...');
        
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                id,
                data_pedido,
                total,
                vendedor,
                clientes (nome)
            `)
            .order('data_pedido', { ascending: false })
            .limit(10);
        
        console.log('📋 Dados brutos dos pedidos:', data);
        console.log('❌ Erro na consulta:', error);
        
        if (error) throw error;
        
        const pedidos = data?.map(p => ({
            id: p.id,
            cliente: p.clientes?.nome || 'Cliente não encontrado',
            data: p.data_pedido,
            valor: p.total || 0,
            status: 'Entregue' // Status padrão
        })) || [];
        
        console.log('✅ Pedidos processados:', pedidos);
        
        return { success: true, data: pedidos };
    } catch (error) {
        console.error('❌ Erro ao obter últimos pedidos:', error);
        return { success: false, data: [] };
    }
}

// Obter dados completos para backup
async function obterDadosCompletos() {
    try {
        const [clientes, pedidos] = await Promise.all([
            supabaseClient.from('clientes').select('*'),
            supabaseClient.from('pedidos').select('*')
        ]);
        
        return {
            success: true,
            data: {
                clientes: clientes.data || [],
                pedidos: pedidos.data || [],
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Erro ao obter dados completos:', error);
        return { success: false, error: error.message };
    }
}

// ========== CONTROLE DE USUÁRIOS ==========

// Obter todos os usuários (apenas admins)
async function obterTodosUsuarios() {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error && error.code !== 'PGRST116') throw error;
        
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro ao obter usuários:', error);
        return { success: false, data: [] };
    }
}

// Criar novo usuário
async function criarNovoUsuario(dadosUsuario) {
    try {
        const usuario = {
            nome: dadosUsuario.nome,
            nome_usuario: dadosUsuario.nome_usuario,
            email: dadosUsuario.email,
            senha: dadosUsuario.senha, // Em produção, usar hash adequado
            prioridade: dadosUsuario.prioridade,
            status: dadosUsuario.status || 'ativo',
            data_criacao: new Date().toISOString(),
            ultimo_login: null
        };
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .insert([usuario])
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return { success: false, error: error.message };
    }
}

// Atualizar usuário
async function atualizarUsuario(id, dadosAtualizados) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .update(dadosAtualizados)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return { success: false, error: error.message };
    }
}

// Excluir usuário
async function excluirUsuarioBD(id) {
    try {
        const { error } = await supabaseClient
            .from('usuarios')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return { success: false, error: error.message };
    }
}

// Atualizar perfil do próprio usuário
async function atualizarPerfilUsuario(nomeUsuario, dadosAtualizados) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .update(dadosAtualizados)
            .eq('nome_usuario', nomeUsuario)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { success: false, error: error.message };
    }
}

// Alterar senha do usuário
async function alterarSenhaUsuario(nomeUsuario, novaSenha) {
    try {
        // Atualizar senha diretamente
        const { data, error } = await supabaseClient
            .from('usuarios')
            .update({ 
                senha: novaSenha, 
                updated_at: new Date().toISOString() 
            })
            .eq('nome_usuario', nomeUsuario)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return { success: false, error: error.message };
    }
}

// ========== RELATÓRIOS DE VENDAS ==========

// Buscar vendas por usuário com agrupamento por mês
async function buscarVendasPorUsuario(usuarioId, ano = new Date().getFullYear()) {
    try {
        const inicioAno = `${ano}-01-01T00:00:00.000Z`;
        const fimAno = `${ano}-12-31T23:59:59.999Z`;
        
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                vendedor_id,
                vendedor,
                data_pedido,
                quantidade,
                total
            `)
            .eq('vendedor_id', usuarioId)
            .gte('data_pedido', inicioAno)
            .lte('data_pedido', fimAno)
            .order('data_pedido', { ascending: true });
        
        if (error) throw error;
        
        // Agrupar por mês
        const vendasPorMes = {};
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        // Inicializar todos os meses com 0
        meses.forEach((mes, index) => {
            vendasPorMes[index + 1] = {
                mes: mes,
                quantidade: 0,
                total: 0,
                pedidos: 0
            };
        });
        
        // Agrupar vendas por mês
        data.forEach(venda => {
            const dataVenda = new Date(venda.data_pedido);
            const mes = dataVenda.getMonth() + 1; // getMonth() retorna 0-11
            
            vendasPorMes[mes].quantidade += parseFloat(venda.quantidade) || 0;
            vendasPorMes[mes].total += parseFloat(venda.total) || 0;
            vendasPorMes[mes].pedidos += 1;
        });
        
        return {
            success: true,
            data: {
                usuarioId: usuarioId,
                ano: ano,
                vendas: Object.values(vendasPorMes),
                totalGeral: data.reduce((acc, venda) => acc + (parseFloat(venda.total) || 0), 0),
                totalPedidos: data.length,
                totalQuantidade: data.reduce((acc, venda) => acc + (parseFloat(venda.quantidade) || 0), 0)
            }
        };
    } catch (error) {
        console.error('Erro ao buscar vendas por usuário:', error);
        return { success: false, error: error.message };
    }
}

// Buscar resumo de vendas de todos os usuários
async function buscarResumoVendasTodosUsuarios(ano = new Date().getFullYear()) {
    try {
        const inicioAno = `${ano}-01-01T00:00:00.000Z`;
        const fimAno = `${ano}-12-31T23:59:59.999Z`;
        
        const { data, error } = await supabaseClient
            .from('pedidos')
            .select(`
                vendedor_id,
                vendedor,
                data_pedido,
                quantidade,
                total
            `)
            .gte('data_pedido', inicioAno)
            .lte('data_pedido', fimAno)
            .order('data_pedido', { ascending: true });
        
        if (error) throw error;
        
        // Agrupar por vendedor e mês
        const resumoPorVendedor = {};
        
        data.forEach(venda => {
            const vendedorId = venda.vendedor_id;
            const dataVenda = new Date(venda.data_pedido);
            const mes = dataVenda.getMonth() + 1;
            
            if (!resumoPorVendedor[vendedorId]) {
                resumoPorVendedor[vendedorId] = {
                    vendedor_id: vendedorId,
                    vendedor: venda.vendedor,
                    meses: {},
                    totalGeral: 0,
                    totalPedidos: 0,
                    totalQuantidade: 0
                };
                
                // Inicializar todos os meses
                for (let i = 1; i <= 12; i++) {
                    resumoPorVendedor[vendedorId].meses[i] = {
                        quantidade: 0,
                        total: 0,
                        pedidos: 0
                    };
                }
            }
            
            const vendedorData = resumoPorVendedor[vendedorId];
            vendedorData.meses[mes].quantidade += parseFloat(venda.quantidade) || 0;
            vendedorData.meses[mes].total += parseFloat(venda.total) || 0;
            vendedorData.meses[mes].pedidos += 1;
            
            vendedorData.totalGeral += parseFloat(venda.total) || 0;
            vendedorData.totalPedidos += 1;
            vendedorData.totalQuantidade += parseFloat(venda.quantidade) || 0;
        });
        
        return {
            success: true,
            data: {
                ano: ano,
                vendedores: Object.values(resumoPorVendedor)
            }
        };
    } catch (error) {
        console.error('Erro ao buscar resumo de vendas:', error);
        return { success: false, error: error.message };
    }
}
