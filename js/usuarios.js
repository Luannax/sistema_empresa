// Controle de Usuários
let usuariosData = [];
let usuariosFiltrados = [];
let paginaAtual = 1;
const usuariosPorPagina = 12;

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado e é admin usando AuthManager
    const usuario = await window.AuthManager.verificarAutenticacao();
    
    if (!usuario) {
        return; // verificarAutenticacao já redireciona se necessário
    }
    
    // Verificar se é admin
    if (usuario.prioridade !== 'ADM') {
        Swal.fire({
            icon: 'error',
            title: 'Acesso negado',
            text: 'Apenas administradores podem acessar o controle de usuários.',
            confirmButtonColor: '#4a7c59'
        }).then(() => {
            window.location.href = '/pages/dashboard.html';
        });
        return;
    }
    
    // Usuário admin logado
    document.getElementById('nomeUsuario').innerHTML = 
        `<i class="bi bi-person-circle"></i> ${usuario.nome}`;
    
    // Mostrar link de usuários (já que está na página de usuários)
    const linkUsuarios = document.getElementById('linkUsuarios');
    if (linkUsuarios) {
        linkUsuarios.classList.remove('d-none');
    }
        
    // Carregar usuários
    carregarUsuarios();
});

async function carregarUsuarios() {
    try {
        // Sempre tentar carregar do banco de dados primeiro
        const resultado = await obterTodosUsuarios();
        
        if (resultado.success && resultado.data && resultado.data.length > 0) {
            // Dados do banco de dados
            usuariosData = resultado.data;
            console.log('✅ Usuários carregados do banco de dados:', usuariosData.length);
        } else {
            // Se não houver dados no banco, verificar localStorage
            const usuariosLocal = localStorage.getItem('usuariosSoma');
            if (usuariosLocal) {
                usuariosData = JSON.parse(usuariosLocal);
                console.log('⚠️ Usuários carregados do localStorage (emergência):', usuariosData.length);
                
                // Tentar migrar dados do localStorage para o banco
                await migrarUsuariosParaBanco();
            } else {
                // Criar dados iniciais apenas se não existir nada
                usuariosData = [];
                console.log('🆕 Nenhum usuário encontrado. Use o painel para criar usuários.');
            }
        }
        
        usuariosFiltrados = [...usuariosData];
        renderizarUsuarios();
        renderizarPaginacao();
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        
        // Em caso de erro, tentar localStorage como fallback
        const usuariosLocal = localStorage.getItem('usuariosSoma');
        if (usuariosLocal) {
            usuariosData = JSON.parse(usuariosLocal);
            usuariosFiltrados = [...usuariosData];
            renderizarUsuarios();
            renderizarPaginacao();
            console.log('⚠️ Erro no servidor. Usando dados locais como backup.');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro ao carregar usuários',
                text: 'Não foi possível carregar os usuários. Verifique a conexão com o banco de dados.',
                confirmButtonColor: '#4a7c59'
            });
        }
    }
}

// Função para migrar usuários do localStorage para o banco
async function migrarUsuariosParaBanco() {
    try {
        const usuariosLocal = JSON.parse(localStorage.getItem('usuariosSoma') || '[]');
        
        if (usuariosLocal.length > 0) {
            console.log('🔄 Migrando usuários do localStorage para o banco...');
            
            for (const usuario of usuariosLocal) {
                const { id, ...dadosUsuario } = usuario; // Remover ID local
                await criarNovoUsuario(dadosUsuario);
            }
            
            // Limpar localStorage após migração bem-sucedida
            localStorage.removeItem('usuariosSoma');
            console.log('✅ Migração concluída. localStorage limpo.');
            
            // Recarregar dados do banco
            await carregarUsuarios();
        }
    } catch (error) {
        console.error('Erro na migração:', error);
    }
}

async function renderizarUsuarios() {
    const inicio = (paginaAtual - 1) * usuariosPorPagina;
    const fim = inicio + usuariosPorPagina;
    const usuariosPagina = usuariosFiltrados.slice(inicio, fim);
    
    const container = document.getElementById('listaUsuarios');
    
    if (usuariosPagina.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-people" style="font-size: 4rem; color: #ccc;"></i>
                <h5 class="text-muted mt-3">Nenhum usuário encontrado</h5>
                <p class="text-muted">Tente ajustar os filtros ou adicione um novo usuário.</p>
            </div>
        `;
        return;
    }

    // Buscar dados de vendas para todos os usuários da página
    console.log('📊 Carregando dados de vendas para usuários...');
    const anoAtual = new Date().getFullYear();
    
    // Criar cards dos usuários com placeholder para vendas
    container.innerHTML = usuariosPagina.map(usuario => `
        <div class="col-lg-6 col-md-12 mb-4">
            <div class="card user-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-light rounded-circle p-3 me-3">
                            <i class="bi bi-person-fill" style="font-size: 1.5rem; color: #4a7c59;"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-1">${usuario.nome}</h6>
                            <small class="text-muted">${usuario.email}</small>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="badge ${usuario.prioridade === 'ADM' ? 'admin-badge' : 'user-badge'} status-badge me-2">
                            <i class="bi bi-${usuario.prioridade === 'ADM' ? 'shield-check' : 'person'} me-1"></i>
                            ${usuario.prioridade === 'ADM' ? 'Administrador' : 'Vendedor'}
                        </span>
                        <span class="badge ${usuario.status === 'ativo' ? 'bg-success' : 'bg-secondary'} status-badge">
                            <i class="bi bi-${usuario.status === 'ativo' ? 'check-circle' : 'x-circle'} me-1"></i>
                            ${usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="bi bi-calendar-plus me-1"></i>
                            Criado em: ${formatarData(usuario.data_criacao || usuario.dataCriacao)}
                        </small><br>
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            Último login: ${formatarData(usuario.ultimo_login || usuario.ultimoLogin) || 'Nunca logou'}
                        </small>
                    </div>
                    
                    <!-- Seção de Vendas ${anoAtual} -->
                    <div class="mb-3" id="vendas-usuario-${usuario.id}">
                        <div class="d-flex align-items-center mb-2">
                            <div class="spinner-border spinner-border-sm ms-auto" role="status">
                                <span class="visually-hidden">Carregando...</span>
                            </div>
                        </div>
                        <button class="btn btn-outline-info btn-sm w-100 d-flex align-items-center justify-content-center" 
                                onclick="mostrarDetalhesVendas(${usuario.id}, '${usuario.nome}')">
                            <i class="bi bi-eye me-1"></i>Ver Vendas
                        </button>
                    </div>
                    
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="editarUsuario(${usuario.id})">
                            <i class="bi bi-pencil me-1"></i>Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="excluirUsuario(${usuario.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Carregar dados de vendas para cada usuário
    for (const usuario of usuariosPagina) {
        carregarVendasUsuario(usuario.id, anoAtual);
    }
}

// Função para carregar vendas de um usuário específico
async function carregarVendasUsuario(usuarioId, ano) {
    try {
        const resultado = await buscarVendasPorUsuario(usuarioId, ano);
        
        if (resultado.success) {
            const dados = resultado.data;
            
            // Atualizar elementos na interface
            const totalElement = document.getElementById(`total-${usuarioId}`);
            const pedidosElement = document.getElementById(`pedidos-${usuarioId}`);
            const melhorMesElement = document.getElementById(`melhor-mes-${usuarioId}`);
            const spinnerContainer = document.querySelector(`#vendas-usuario-${usuarioId} .spinner-border`);
            
            if (totalElement) {
                totalElement.textContent = `R$ ${dados.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            }
            
            if (pedidosElement) {
                pedidosElement.textContent = dados.totalPedidos.toString();
            }
            
            if (melhorMesElement) {
                // Encontrar o mês com maior valor de vendas
                const melhorMes = dados.vendas.reduce((melhor, atual) => 
                    atual.total > melhor.total ? atual : melhor
                );
                
                if (melhorMes.total > 0) {
                    melhorMesElement.textContent = melhorMes.mes.substring(0, 3);
                    melhorMesElement.title = `${melhorMes.mes}: R$ ${melhorMes.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                } else {
                    melhorMesElement.textContent = 'N/A';
                    melhorMesElement.title = 'Nenhuma venda registrada';
                }
            }
            
            // Remover spinner
            if (spinnerContainer) {
                spinnerContainer.remove();
            }
            
        } else {
            console.error(`Erro ao carregar vendas do usuário ${usuarioId}:`, resultado.error);
            
            // Remover spinner e mostrar erro
            const spinnerContainer = document.querySelector(`#vendas-usuario-${usuarioId} .spinner-border`);
            if (spinnerContainer) {
                spinnerContainer.remove();
                const errorIcon = document.createElement('i');
                errorIcon.className = 'bi bi-exclamation-triangle text-warning ms-auto';
                errorIcon.title = 'Erro ao carregar dados de vendas';
                spinnerContainer.parentNode.appendChild(errorIcon);
            }
        }
        
    } catch (error) {
        console.error(`Erro ao carregar vendas do usuário ${usuarioId}:`, error);
        
        // Remover spinner em caso de erro
        const spinnerContainer = document.querySelector(`#vendas-usuario-${usuarioId} .spinner-border`);
        if (spinnerContainer) {
            spinnerContainer.remove();
        }
    }
}

// Função para mostrar detalhes de vendas por mês
async function mostrarDetalhesVendas(usuarioId, nomeUsuario, ano = null) {
    const anoSelecionado = parseInt(ano) || new Date().getFullYear();
    console.log(`📊 Mostrando detalhes de vendas para ${nomeUsuario} (ID: ${usuarioId}) - Ano: ${anoSelecionado}`);
    
    // Mostrar loading no modal
    Swal.fire({
        title: `Vendas de ${nomeUsuario}`,
        html: `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-3 text-muted">Carregando dados de vendas para ${anoSelecionado}...</p>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        width: '900px'
    });
    
    try {
        const resultado = await buscarVendasPorUsuario(usuarioId, anoSelecionado);
        
        if (!resultado.success) {
            throw new Error(resultado.error);
        }
        
        const dados = resultado.data;
        
        // Verificar se existem dados para o ano
        const temVendas = dados.totalPedidos > 0;
        
        // Criar tabela com vendas por mês
        let tabelaMeses = '';
        if (temVendas) {
            tabelaMeses = dados.vendas.map(mes => `
                <tr>
                    <td>${mes.mes}</td>
                    <td class="text-center">${mes.pedidos}</td>
                    <td class="text-center">${mes.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</td>
                    <td class="text-end">R$ ${mes.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('');
        } else {
            tabelaMeses = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-inbox" style="font-size: 2rem; color: #ccc;"></i>
                        <p class="mt-2 mb-0">Nenhuma venda registrada em ${anoSelecionado}</p>
                    </td>
                </tr>
            `;
        }
        
        // Criar seletor de anos (últimos 5 anos)
        const anoAtual = new Date().getFullYear();
        const anosDisponiveis = [];
        for (let i = 0; i < 5; i++) {
            anosDisponiveis.push(anoAtual - i);
        }
        
        const seletorAnos = anosDisponiveis.map(a => 
            `<option value="${a}" ${a === anoSelecionado ? 'selected' : ''}>${a}</option>`
        ).join('');
        
        Swal.fire({
            title: `📊 Vendas de ${nomeUsuario}`,
            html: `
                <div class="text-start">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="d-flex align-items-center">
                            <label class="form-label mb-0 me-2">Ano:</label>
                            <select class="form-select form-select-sm" style="width: auto;" id="seletorAno">
                                ${seletorAnos}
                            </select>
                        </div>
                    </div>
                    
                    ${temVendas ? `
                        <div class="row g-3 mb-4">
                            <div class="col-12">
                                <div class="card bg-light">
                                    <div class="card-body text-center py-3">
                                        <i class="bi bi-currency-dollar text-success mb-2" style="font-size: 1.5rem;"></i>
                                        <div class="fw-bold text-success">R$ ${dados.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                        <small class="text-muted">Total Vendas</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card bg-light">
                                    <div class="card-body text-center py-3">
                                        <i class="bi bi-cart text-info mb-2" style="font-size: 1.5rem;"></i>
                                        <div class="fw-bold text-info">${dados.totalPedidos}</div>
                                        <small class="text-muted">Pedidos</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card bg-light">
                                    <div class="card-body text-center py-3">
                                        <i class="bi bi-box text-warning mb-2" style="font-size: 1.5rem;"></i>
                                        <div class="fw-bold text-warning">${dados.totalQuantidade.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</div>
                                        <small class="text-muted">Itens</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="alert alert-info text-center mb-4">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Nenhuma venda encontrada para ${anoSelecionado}</strong>
                            <p class="mb-0 mt-2 small">Este usuário não realizou vendas neste ano ou os dados ainda não foram sincronizados.</p>
                        </div>
                    `}
                    
                    <h6 class="text-primary mb-3">Vendas por Mês - ${anoSelecionado}</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped month-details-table">
                            <thead class="table-dark">
                                <tr>
                                    <th>Mês</th>
                                    <th class="text-center">Pedidos</th>
                                    <th class="text-center">Quantidade</th>
                                    <th class="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tabelaMeses}
                            </tbody>
                            ${temVendas ? `
                                <tfoot class="table-dark">
                                    <tr>
                                        <th>TOTAL</th>
                                        <th class="text-center">${dados.totalPedidos}</th>
                                        <th class="text-center">${dados.totalQuantidade.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</th>
                                        <th class="text-end">R$ ${dados.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</th>
                                    </tr>
                                </tfoot>
                            ` : ''}
                        </table>
                    </div>
                    
                    ${!temVendas ? `
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                <i class="bi bi-lightbulb me-1"></i>
                                Dica: Selecione outro ano acima para ver dados de períodos diferentes
                            </small>
                        </div>
                    ` : ''}
                </div>
            `,
            width: '900px',
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#4a7c59',
            customClass: {
                htmlContainer: 'text-start'
            },
            didOpen: () => {
                // Garantir que o select funcione
                const select = Swal.getHtmlContainer().querySelector('#seletorAno');
                if (select) {
                    select.addEventListener('change', function() {
                        const novoAno = this.value;
                        console.log('📅 Alterando ano para:', novoAno);
                        mostrarDetalhesVendas(usuarioId, nomeUsuario, novoAno);
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao mostrar detalhes de vendas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao carregar dados!',
            text: `Não foi possível carregar os dados de vendas para ${anoSelecionado}. Erro: ${error.message}`,
            confirmButtonColor: '#dc3545',
            width: '600px'
        });
    }
}

function renderizarPaginacao() {
    const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
    const paginacao = document.getElementById('paginacao');
    
    if (totalPaginas <= 1) {
        paginacao.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botão anterior
    html += `
        <li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaAtual - 2 && i <= paginaAtual + 2)) {
            html += `
                <li class="page-item ${i === paginaAtual ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="mudarPagina(${i})">${i}</a>
                </li>
            `;
        } else if (i === paginaAtual - 3 || i === paginaAtual + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Botão próximo
    html += `
        <li class="page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacao.innerHTML = html;
}

function mudarPagina(pagina) {
    const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
    
    if (pagina < 1 || pagina > totalPaginas) return;
    
    paginaAtual = pagina;
    renderizarUsuarios();
    renderizarPaginacao();
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filtrarUsuarios() {
    const filtroNome = document.getElementById('filtroNome').value.toLowerCase();
    const filtroTipo = document.getElementById('filtroTipo').value;
    const filtroStatus = document.getElementById('filtroStatus').value;
    
    usuariosFiltrados = usuariosData.filter(usuario => {
        const nomeMatch = usuario.nome.toLowerCase().includes(filtroNome) || 
                         usuario.email.toLowerCase().includes(filtroNome);
        const tipoMatch = !filtroTipo || usuario.prioridade === filtroTipo;
        const statusMatch = !filtroStatus || usuario.status === filtroStatus;
        
        return nomeMatch && tipoMatch && statusMatch;
    });
    
    paginaAtual = 1;
    renderizarUsuarios();
    renderizarPaginacao();
}

function limparFiltros() {
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroStatus').value = '';
    
    usuariosFiltrados = [...usuariosData];
    paginaAtual = 1;
    renderizarUsuarios();
    renderizarPaginacao();
}

function abrirModalNovoUsuario() {
    document.getElementById('tituloModal').innerHTML = '<i class="bi bi-person me-2"></i> Novo Usuário';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('senha').required = true;
    
    // Restaurar label da senha
    const senhaLabel = document.querySelector('label[for="senha"]');
    senhaLabel.innerHTML = 'Senha';
    
// Remover classes de validação
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    
    // Focar no primeiro campo
    setTimeout(() => {
        document.getElementById('nomeCompleto').focus();
    }, 300);
    
    new bootstrap.Modal(document.getElementById('modalUsuario')).show();
}

function editarUsuario(id) {
    const usuario = usuariosData.find(u => u.id === id);
    
    if (!usuario) {
        Swal.fire({
            icon: 'error',
            title: 'Usuário não encontrado',
            text: 'O usuário selecionado não foi encontrado.',
            confirmButtonColor: '#4a7c59'
        });
        return;
    }
    
    document.getElementById('tituloModal').innerHTML = '<i class="bi bi-pencil me-2"></i> Editar Usuário';
    document.getElementById('usuarioId').value = usuario.id;
    document.getElementById('nomeCompleto').value = usuario.nome || '';
    document.getElementById('nomeUsuario').value = usuario.nome_usuario || usuario.usuario || '';
    document.getElementById('email').value = usuario.email || '';
    document.getElementById('senha').value = '';
    document.getElementById('senha').required = false;
    document.getElementById('tipoUsuario').value = usuario.prioridade || usuario.tipo || '';
    document.getElementById('statusUsuario').value = usuario.status || 'ativo';
    
    // Remover classes de validação
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    
    // Adicionar dica sobre senha
    const senhaLabel = document.querySelector('label[for="senha"]');
    senhaLabel.innerHTML = 'Senha <small class="text-muted">(deixe em branco para manter a atual)</small>';
    
    new bootstrap.Modal(document.getElementById('modalUsuario')).show();
}

async function salvarUsuario() {
    console.log('🔄 Iniciando salvamento de usuário...');
    
    const form = document.getElementById('formUsuario');
    const usuarioId = document.getElementById('usuarioId').value;
    
    console.log('📋 Dados do formulário:', {
        usuarioId: usuarioId,
        nomeCompleto: document.getElementById('nomeCompleto').value,
        nomeUsuario: document.getElementById('nomeUsuario').value,
        email: document.getElementById('email').value,
        tipoUsuario: document.getElementById('tipoUsuario').value,
        statusUsuario: document.getElementById('statusUsuario').value
    });
    
    // Validar formulário
    console.log('✅ Validando formulário...');
    if (!validarFormulario()) {
        console.log('Formulário inválido!');
        Swal.fire({
            icon: 'error',
            title: 'Dados inválidos',
            text: 'Por favor, verifique os campos em vermelho e tente novamente.',
            confirmButtonColor: '#4a7c59'
        });
        return;
    }
    
    console.log('✅ Formulário válido! Preparando dados do usuário...');
    
    const dadosUsuario = {
        nome: document.getElementById('nomeCompleto').value.trim(),
        nome_usuario: document.getElementById('nomeUsuario').value.trim(),
        email: document.getElementById('email').value.trim(),
        prioridade: document.getElementById('tipoUsuario').value,
        status: document.getElementById('statusUsuario').value
    };
    
    const senha = document.getElementById('senha').value.trim();
    if (senha) {
        dadosUsuario.senha = senha;
    }
    
    console.log('📦 Dados finais do usuário:', dadosUsuario);
    
    try {
        let resultado = { success: false };
        
        // Sempre tentar salvar no banco de dados primeiro
        if (usuarioId) {
            // Editar usuário existente
            console.log('📝 Atualizando usuário no banco de dados...', dadosUsuario);
            resultado = await atualizarUsuario(usuarioId, dadosUsuario);
        } else {
            // Criar novo usuário
            console.log('➕ Criando novo usuário no banco de dados...', dadosUsuario);
            resultado = await criarNovoUsuario(dadosUsuario);
        }
        
        if (resultado.success) {
            console.log('✅ Usuário salvo no banco de dados com sucesso!');
            
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: `Usuário ${usuarioId ? 'atualizado' : 'criado'} com sucesso no banco de dados.`,
                confirmButtonColor: '#4a7c59'
            });
            
            bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
            await carregarUsuarios(); // Recarregar dados atualizados do banco
        } else {
            console.error('❌ Erro ao salvar no banco:', resultado.error);
            
            // Só usar localStorage em caso de erro extremo
            const resultadoLocal = salvarUsuarioLocal(usuarioId, dadosUsuario);
            
            if (resultadoLocal.success) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Salvo localmente',
                    text: 'Usuário salvo localmente. Será sincronizado com o banco quando possível.',
                    confirmButtonColor: '#ffc107'
                });
                await carregarUsuarios();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: resultado.error || 'Erro ao salvar usuário.',
                    confirmButtonColor: '#4a7c59'
                });
            }
        }
        
    } catch (error) {
        console.error('Erro crítico ao salvar usuário:', error);
        
        // Backup de emergência no localStorage
        const resultadoLocal = salvarUsuarioLocal(usuarioId, dadosUsuario);
        
        if (resultadoLocal.success) {
            Swal.fire({
                icon: 'warning',
                title: 'Conexão perdida',
                text: 'Usuário salvo localmente. Verifique sua conexão com o banco de dados.',
                confirmButtonColor: '#ffc107'
            });
            await carregarUsuarios();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro crítico!',
                text: 'Não foi possível salvar o usuário em lugar nenhum.',
                confirmButtonColor: '#dc3545'
            });
        }
    }
}

// Função auxiliar para salvar usuário localmente
function salvarUsuarioLocal(usuarioId, dadosUsuario) {
    try {
        let usuarios = JSON.parse(localStorage.getItem('usuariosSoma') || '[]');
        
        if (usuarioId) {
            // Editar usuário existente
            const index = usuarios.findIndex(u => u.id == usuarioId);
            if (index !== -1) {
                usuarios[index] = { 
                    ...usuarios[index], 
                    ...dadosUsuario,
                    updated_at: new Date().toISOString()
                };
            }
        } else {
            // Criar novo usuário
            const novoId = Math.max(...usuarios.map(u => u.id || 0), 0) + 1;
            const novoUsuario = {
                id: novoId,
                ...dadosUsuario,
                data_criacao: new Date().toISOString(),
                ultimo_login: null
            };
            usuarios.push(novoUsuario);
        }
        
        localStorage.setItem('usuariosSoma', JSON.stringify(usuarios));
        return { success: true };
        
    } catch (error) {
        console.error('Erro ao salvar usuário localmente:', error);
        return { success: false, error: 'Erro ao salvar usuário localmente' };
    }
}

function validarFormulario() {
    console.log('🔍 Iniciando validação do formulário...');
    
    const campos = [
        { 
            id: 'nomeCompleto', 
            validacao: val => val.length >= 2,
            mensagem: 'Nome completo deve ter pelo menos 2 caracteres'
        },
        { 
            id: 'nomeUsuario', 
            validacao: val => val.length >= 3 && /^[a-zA-Z0-9_]+$/.test(val),
            mensagem: 'Nome de usuário deve ter pelo menos 3 caracteres e conter apenas letras, números e underscore'
        },
        { 
            id: 'email', 
            validacao: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
            mensagem: 'Por favor, insira um e-mail válido'
        },
        { 
            id: 'tipoUsuario', 
            validacao: val => ['ADM', 'VENDEDOR'].includes(val),
            mensagem: 'Por favor, selecione o tipo de usuário'
        }
    ];
    
    const senha = document.getElementById('senha');
    const usuarioId = document.getElementById('usuarioId').value;
    
    // Validar senha apenas para novo usuário ou se foi preenchida
    if (!usuarioId || senha.value) {
        campos.push({ 
            id: 'senha', 
            validacao: val => val.length >= 4,
            mensagem: 'Senha deve ter pelo menos 4 caracteres'
        });
    }
    
    let valido = true;
    let erros = [];
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        const valor = elemento.value.trim();
        
        console.log(`📝 Validando ${campo.id}:`, valor);
        
        if (!campo.validacao(valor)) {
            elemento.classList.add('is-invalid');
            // Atualizar mensagem de erro específica
            const feedbackElement = elemento.nextElementSibling;
            if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
                feedbackElement.textContent = campo.mensagem;
            }
            erros.push(`${campo.id}: ${campo.mensagem}`);
            valido = false;
            console.log(`❌ ${campo.id} inválido:`, campo.mensagem);
        } else {
            elemento.classList.remove('is-invalid');
            console.log(`✅ ${campo.id} válido`);
        }
    });
    
    // Validação especial para nome de usuário duplicado (apenas para novos usuários)
    if (!usuarioId) {
        const nomeUsuario = document.getElementById('nomeUsuario').value.trim();
        const usuarioExistente = usuariosData.find(u => u.nome_usuario === nomeUsuario || u.usuario === nomeUsuario);
        
        if (usuarioExistente) {
            document.getElementById('nomeUsuario').classList.add('is-invalid');
            const feedbackElement = document.querySelector('#nomeUsuario + .invalid-feedback');
            if (feedbackElement) {
                feedbackElement.textContent = 'Este nome de usuário já está em uso.';
            }
            erros.push('Nome de usuário já existe');
            valido = false;
            console.log('❌ Nome de usuário duplicado');
        }
    }
    
    console.log('📊 Resultado da validação:', {
        valido: valido,
        erros: erros
    });
    
    return valido;
}

async function excluirUsuario(id) {
    const usuario = usuariosData.find(u => u.id === id);
    
    if (!usuario) {
        Swal.fire({
            icon: 'error',
            title: 'Usuário não encontrado',
            text: 'O usuário selecionado não foi encontrado.',
            confirmButtonColor: '#4a7c59'
        });
        return;
    }
    
    // Não permitir excluir o próprio usuário
    const usuarioLogado = await window.AuthManager.obterUsuarioAtual();
    if (usuarioLogado && (usuarioLogado.id === id || usuarioLogado.nome_usuario === usuario.nome_usuario)) {
        Swal.fire({
            icon: 'warning',
            title: 'Ação não permitida',
            text: 'Você não pode excluir seu próprio usuário.',
            confirmButtonColor: '#4a7c59'
        });
        return;
    }
    
    const resultado = await Swal.fire({
        title: 'Excluir Usuário?',
        html: `
            <p>Deseja realmente excluir o usuário <strong>"${usuario.nome}"</strong>?</p>
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Esta ação não pode ser desfeita.
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });
    
    if (resultado.isConfirmed) {
        try {
            let resultadoExclusao = { success: false };
            
            // Tentar excluir no servidor primeiro
            console.log('🗑️ Excluindo usuário do banco de dados...');
            resultadoExclusao = await excluirUsuarioBD(id);
            
            if (resultadoExclusao.success) {
                console.log('Usuário excluído do banco de dados com sucesso!');
                
                Swal.fire({
                    icon: 'success',
                    title: 'Usuário excluído!',
                    text: 'O usuário foi excluído com sucesso do banco de dados.',
                    confirmButtonColor: '#4a7c59'
                });
                
                await carregarUsuarios(); // Recarregar dados atualizados
            } else {
                console.error('❌ Erro ao excluir do banco:', resultadoExclusao.error);
                
                // Fallback para localStorage
                const resultadoLocal = excluirUsuarioLocal(id);
                
                if (resultadoLocal.success) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Excluído localmente',
                        text: 'Usuário excluído localmente. Será sincronizado com o banco quando possível.',
                        confirmButtonColor: '#ffc107'
                    });
                    await carregarUsuarios();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro!',
                        text: resultadoExclusao.error || 'Erro ao excluir usuário.',
                        confirmButtonColor: '#4a7c59'
                    });
                }
            }
        } catch (error) {
            console.error('Erro crítico ao excluir usuário:', error);
            
            // Backup de emergência no localStorage
            const resultadoLocal = excluirUsuarioLocal(id);
            
            if (resultadoLocal.success) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Conexão perdida',
                    text: 'Usuário excluído localmente. Verifique sua conexão com o banco de dados.',
                    confirmButtonColor: '#ffc107'
                });
                await carregarUsuarios();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro crítico!',
                    text: 'Não foi possível excluir o usuário.',
                    confirmButtonColor: '#dc3545'
                });
            }
        }
    }
}

// Função auxiliar para excluir usuário localmente
function excluirUsuarioLocal(id) {
    try {
        let usuarios = JSON.parse(localStorage.getItem('usuariosSoma') || '[]');
        usuarios = usuarios.filter(u => u.id != id);
        localStorage.setItem('usuariosSoma', JSON.stringify(usuarios));
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir usuário localmente:', error);
        return { success: false, error: 'Erro ao excluir usuário localmente' };
    }
}

// Funções auxiliares
function formatarData(data) {
    if (!data) return 'N/A';
    try {
        return new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

// ========== FUNCIONALIDADES DE BACKUP ==========

async function abrirModalBackups() {
    new bootstrap.Modal(document.getElementById('modalBackups')).show();
    await carregarListaBackups();
}

async function carregarListaBackups() {
    try {
        const tbody = document.getElementById('listaBackups');
        
        if (sistemaBackup) {
            const backups = await sistemaBackup.obterBackupsLocais();
            
            if (backups.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted">Nenhum backup encontrado</td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = backups.map(backup => `
                <tr>
                    <td>${formatarData(backup.data)}</td>
                    <td>
                        <span class="badge ${backup.tipo === 'automatico' ? 'bg-info' : 'bg-success'}">
                            ${backup.tipo === 'automatico' ? 'Automático' : 'Manual'}
                        </span>
                    </td>
                    <td>${backup.metadados.totalClientes || 0}</td>
                    <td>${backup.metadados.totalPedidos || 0}</td>
                    <td>
                        <button class="btn btn-outline-primary btn-sm" onclick="baixarBackup(${backup.id})">
                            <i class="bi bi-download"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">Sistema de backup não disponível</td>
                </tr>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar lista de backups:', error);
        document.getElementById('listaBackups').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">Erro ao carregar backups</td>
            </tr>
        `;
    }
}

async function realizarBackupManual() {
    if (sistemaBackup) {
        const resultado = await sistemaBackup.executarBackupManual();
        if (resultado.success) {
            await carregarListaBackups(); // Recarregar lista
        }
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Sistema não disponível',
            text: 'O sistema de backup não está disponível.',
            confirmButtonColor: '#4a7c59'
        });
    }
}

async function baixarBackup(backupId) {
    try {
        if (sistemaBackup) {
            await sistemaBackup.baixarBackup(backupId);
        } else {
            throw new Error('Sistema de backup não disponível');
        }
    } catch (error) {
        console.error('Erro ao baixar backup:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao baixar backup',
            text: 'Ocorreu um erro ao baixar o arquivo de backup.',
            confirmButtonColor: '#4a7c59'
        });
    }
}

async function processarArquivoBackup(input) {
    const arquivo = input.files[0];
    if (!arquivo) return;
    
    try {
        Swal.fire({
            title: 'Processando arquivo...',
            text: 'Verificando arquivo de backup.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        if (sistemaBackup) {
            const resultado = await sistemaBackup.restaurarBackup(arquivo);
            
            if (resultado.success) {
                const confirmacao = await Swal.fire({
                    title: 'Restaurar Backup?',
                    html: `
                        <p>Deseja realmente restaurar este backup?</p>
                        <div class="alert alert-warning">
                            <strong>Atenção:</strong> Esta ação irá substituir todos os dados atuais.
                        </div>
                        <small class="text-muted">
                            Clientes: ${resultado.metadados?.totalClientes || 0}<br>
                            Pedidos: ${resultado.metadados?.totalPedidos || 0}
                        </small>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sim, restaurar',
                    cancelButtonText: 'Cancelar'
                });
                
                if (confirmacao.isConfirmed) {
                    // Aqui você implementaria a lógica de restauração real
                    Swal.fire({
                        icon: 'info',
                        title: 'Funcionalidade em desenvolvimento',
                        text: 'A restauração de backup será implementada em uma versão futura.',
                        confirmButtonColor: '#4a7c59'
                    });
                }
            }
        } else {
            throw new Error('Sistema de backup não disponível');
        }
        
    } catch (error) {
        console.error('Erro ao processar arquivo de backup:', error);
        Swal.fire({
            icon: 'error',
            title: 'Arquivo inválido',
            text: 'O arquivo selecionado não é um backup válido.',
            confirmButtonColor: '#4a7c59'
        });
    } finally {
        input.value = ''; // Limpar input
    }
}
