// Lógica da página de relatórios
let comprasCarregadas = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado usando AuthManager
    const usuario = await window.AuthManager.verificarAutenticacao();
    
    if (!usuario) {
        return; // verificarAutenticacao já redireciona se necessário
    }
    
    // Mostrar nome do usuário
    const nomeUsuarioElement = document.getElementById('nomeUsuario');
    if (nomeUsuarioElement) {
        nomeUsuarioElement.innerHTML = `<i class="bi bi-person-circle"></i> ${usuario.nome}`;
    }
    
    // Controlar links baseado na prioridade do usuário
    if (usuario.prioridade === 'ADM') {
        // Mostrar link de usuários para admin
        const linkUsuarios = document.getElementById('linkUsuarios');
        if (linkUsuarios) {
            linkUsuarios.classList.remove('d-none');
        }
    } else {
        // Ocultar links do dashboard para não-admin
        const linksDashboard = document.querySelectorAll('a[href="/pages/dashboard.html"]');
        linksDashboard.forEach(link => {
            link.style.display = 'none';
        });
    }

    const tabelaBody = document.querySelector('tbody');
    const inputBusca = document.querySelector('input[placeholder="BUSCAR"]');
    const btnBusca = document.querySelector('.btn-outline-secondary');

    // Carregar compras ao inicializar
    carregarCompras();

    // Configurar event listeners para busca
    setupEventListeners();

    // Função para configurar event listeners
    function setupEventListeners() {
        if (btnBusca) {
            btnBusca.addEventListener('click', realizarBusca);
        }
        
        if (inputBusca) {
            inputBusca.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    realizarBusca();
                }
            });
            
            // Busca em tempo real (opcional)
            inputBusca.addEventListener('input', function() {
                // Debounce para evitar muitas buscas
                clearTimeout(window.buscaTimeout);
                window.buscaTimeout = setTimeout(realizarBusca, 300);
            });
        }
    }

    // Função para carregar todas as compras agrupadas
    async function carregarCompras() {
        try {
            mostrarLoading();
            const resultado = await buscarComprasAgrupadas();
            
            if (resultado.success) {
                comprasCarregadas = resultado.data;
                renderizarTabela(resultado.data);
            } else {
                mostrarErro('Erro ao carregar compras: ' + resultado.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            mostrarErro('Erro ao carregar compras.');
        }
    }

    // Função para renderizar a tabela
    async function renderizarTabela(compras) {
        // Verificar se usuário é admin para controlar ações
        const usuario = await window.AuthManager.obterUsuarioAtual();
        const isAdmin = usuario && usuario.prioridade === 'ADM';
        const nomeUsuarioLogado = usuario?.nome?.trim() || '';
        
        if (!compras || compras.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="bi bi-inbox display-4 text-muted"></i>
                        <p class="mt-2 text-muted">Nenhuma compra encontrada</p>
                    </td>
                </tr>
            `;
            return;
        }

        tabelaBody.innerHTML = compras.map(compra => {
            // Se for vendedor (não ADM), ocultar o nome do vendedor se não for o logado
            let vendedorExibir = compra.vendedor || 'N/A';
            if (!isAdmin && vendedorExibir && vendedorExibir.trim() !== nomeUsuarioLogado) {
                // Borrar o nome do vendedor com bolinhas e cor cinza claro
                const bolinhas = '•'.repeat(vendedorExibir.length);
                vendedorExibir = `<span style=\"color:#b0b0b0;user-select:none;\">${bolinhas}</span>`;
            }
            return `
            <tr>
                <td class="text-center d-none d-sm-table-cell"><strong>${compra.compra_id}</strong></td>
                <td class="text-center d-none d-sm-table-cell">${vendedorExibir}</td>
                <td class="text-center">${compra.cliente?.nome || 'N/A'}</td>
                <td class="text-center">${formatarData(compra.data_pedido)}</td>
                <td class="text-center d-none d-sm-table-cell">
                    <span class="badge bg-info">${compra.quantidade_itens} itens</span>
                </td>
                <td class="text-center"><strong>R$ ${formatarMoeda(compra.total_compra)}</strong></td>
                <td class="text-center">
                    <div class="dropdown">
                        <button class="btn btn-sm" style="background-color: #4a7c59; color: white;" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu" style="min-width: 6rem;">
                            <li>
                                <a class="dropdown-item" href="#" onclick="visualizarCompra('${compra.compra_id}', ${compra.cliente_id}, '${compra.data_pedido}', '${compra.vendedor}')">
                                    <i class="bi bi-eye"></i> <span style="margin-left: 6px;">Ver</span>
                                </a>
                            </li>
                            ${isAdmin ? `
                            <li>
                                <a class="dropdown-item" href="#" onclick="editarCompra('${compra.compra_id}', ${compra.cliente_id}, '${compra.data_pedido}', '${compra.vendedor}')">
                                    <i class="bi bi-pencil"></i> <span style="margin-left: 6px;">Editar</span>
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="confirmarExclusaoCompra(${compra.cliente_id}, '${compra.data_pedido}', '${compra.vendedor}')">
                                    <i class="bi bi-trash"></i> <span style="margin-left: 6px;">Excluir</span>
                                </a>
                            </li>` : ''}
                        </ul>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    // Função de busca
    async function realizarBusca() {
        const termo = inputBusca.value.trim().toLowerCase();
        
        if (!termo) {
            renderizarTabela(comprasCarregadas);
            return;
        }
        
        const comprasFiltradas = comprasCarregadas.filter(compra => {
            // Buscar por ID do pedido
            const matchId = String(compra.compra_id).toLowerCase().includes(termo);
            
            // Buscar por vendedor
            const matchVendedor = compra.vendedor.toLowerCase().includes(termo);
            
            // Buscar por nome do cliente
            const matchCliente = compra.cliente?.nome?.toLowerCase().includes(termo);
            
            // Buscar por CPF/CNPJ do cliente
            const matchCpf = compra.cliente?.cpf_cnpj?.toLowerCase().includes(termo);
            
            // Buscar por cidade do cliente
            const matchCidade = compra.cliente?.cidade?.toLowerCase().includes(termo);
            
            // Buscar nos itens (discriminação)
            const matchItens = compra.itens.some(item => 
                item.discriminacao.toLowerCase().includes(termo)
            );
            
            return matchId || matchVendedor || matchCliente || matchCpf || matchCidade || matchItens;
        });
        
        renderizarTabela(comprasFiltradas);
    }

    // Função para mostrar loading
    function mostrarLoading() {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2">Carregando compras...</p>
                </td>
            </tr>
        `;
    }

    // Função para mostrar erro
    function mostrarErro(mensagem) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle display-4"></i>
                    <p class="mt-2">${mensagem}</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
                        Tentar novamente
                    </button>
                </td>
            </tr>
        `;
    }
});

// ========== FUNÇÕES UTILITÁRIAS GLOBAIS ==========

// Função para formatar CPF/CNPJ para exibição
function formatarCpfCnpjDisplay(valor) {
    if (!valor) return '';
    
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Se tem 11 dígitos, é CPF
    if (apenasNumeros.length === 11) {
        return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    // Se tem 14 dígitos, é CNPJ
    else if (apenasNumeros.length === 14) {
        return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    // Se não tem o tamanho esperado, retorna o valor original
    else {
        return valor;
    }
}

// Função para formatar celular para exibição
function formatarCelularDisplay(valor) {
    if (!valor) return '';
    
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Se tem 11 dígitos (9XXXX-XXXX) - celular com 9
    if (apenasNumeros.length === 11) {
        return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    // Se tem 10 dígitos (XXXX-XXXX) - telefone fixo
    else if (apenasNumeros.length === 10) {
        return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    // Se não tem o tamanho esperado, retorna o valor original
    else {
        return valor;
    }
}

function formatarData(data) {
    if (!data) return 'N/A';
    const date = new Date(data);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatarMoeda(valor) {
    if (!valor) return '0,00';
    return parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ========== FUNÇÕES GLOBAIS DOS MODAIS ==========

// Visualizar compra completa
async function visualizarCompra(compraId, clienteId, dataPedido, vendedor) {
    try {
        const resultado = await buscarItensCompra(clienteId, dataPedido, vendedor);
        
        if (resultado.success && resultado.data.length > 0) {
            const itens = resultado.data;
            const cliente = itens[0].clientes;
            const totalGeral = itens.reduce((acc, item) => acc + (item.total || 0), 0);
            
            // Armazenar dados para PDF
            dadosCompraAtual = {
                compraId: compraId,
                cliente: {
                    nome: cliente?.nome || 'N/A',
                    cpf_cnpj: cliente?.cpf_cnpj || 'N/A',
                    cidade: cliente?.cidade || 'N/A',
                    celular: cliente?.celular || 'N/A',
                    endereco: cliente?.endereco || 'N/A',
                    estado: cliente?.estado || 'N/A'
                },
                vendedor: vendedor || 'N/A',
                dataPedido: dataPedido,
                itens: itens.map(item => ({
                    discriminacao: item.discriminacao,
                    quantidade: item.quantidade,
                    unidade: item.unidade,
                    valor_unitario: item.valor_unitario,
                    total: item.total
                })),
                totalGeral: totalGeral
            };
            
            // Preencher dados do cliente
            document.getElementById('modalCompraId').textContent = compraId;
            document.getElementById('modalClienteNome').textContent = cliente?.nome || 'N/A';
            
            // Aplicar formatação para CPF/CNPJ e celular
            const cpfCnpjFormatado = formatarCpfCnpjDisplay(cliente?.cpf_cnpj || '');
            document.getElementById('modalClienteCpf').textContent = cpfCnpjFormatado || 'N/A';
            
            const celularFormatado = formatarCelularDisplay(cliente?.celular || '');
            document.getElementById('modalClienteCelular').textContent = celularFormatado || 'N/A';
            
            document.getElementById('modalClienteCidade').textContent = cliente?.cidade || 'N/A';
            
            // Preencher tabela de itens
            const tabelaItens = document.getElementById('modalItensTabela');
            tabelaItens.innerHTML = itens.map(item => `
                <tr>
                    <td>${item.discriminacao}</td>
                    <td class="text-center">${item.quantidade}</td>
                    <td class="text-center">${item.unidade}</td>
                    <td class="text-center">R$ ${parseFloat(item.valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-center"><strong>R$ ${parseFloat(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
            `).join('');
            
            // Total geral
            document.getElementById('modalTotalGeral').textContent = `R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            // Mostrar modal
            new bootstrap.Modal(document.getElementById('modalVisualizarPedido')).show();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Não foi possível carregar os detalhes da compra.'
        });
    }
}

// Editar compra
async function editarCompra(compraId, clienteId, dataPedido, vendedor) {
    try {
        const resultado = await buscarItensCompra(clienteId, dataPedido, vendedor);
        
        if (resultado.success && resultado.data.length > 0) {
            const itens = resultado.data;
            const cliente = itens[0].clientes;
            
            // Armazenar dados da compra atual para uso em outras funções
            dadosCompraAtual = {
                cliente_id: clienteId,
                vendedor: vendedor,
                data_pedido: dataPedido,
                itens_originais: itens.map(item => ({ id: item.id, discriminacao: item.discriminacao }))
            };
            
            // Preencher dados do cliente (apenas visualização)
            document.getElementById('modalEditCompraId').textContent = compraId;
            document.getElementById('editClienteNome').value = cliente?.nome || '';
            
            // Aplicar formatação para CPF/CNPJ
            const cpfCnpjFormatado = formatarCpfCnpjDisplay(cliente?.cpf_cnpj || '');
            document.getElementById('editClienteCpf').value = cpfCnpjFormatado;
            
            // Aplicar formatação para celular
            const celularFormatado = formatarCelularDisplay(cliente?.celular || '');
            document.getElementById('editClienteCelular').value = celularFormatado;
            
            document.getElementById('editClienteEndereco').value = cliente?.endereco || '';
            document.getElementById('editClienteEstado').value = cliente?.estado || '';
            document.getElementById('editClienteCidade').value = cliente?.cidade || '';
            
            // Preencher tabela editável de itens
            const tabelaItens = document.getElementById('editItensTabela');
            tabelaItens.innerHTML = itens.map((item, index) => `
                <tr data-item-id="${item.id}">
                    <td style="min-width: 120px;">
                        <input type="text" class="form-control form-control-sm" value="${item.discriminacao}">
                    </td>
                    <td class="text-center" style="min-width: 80px;">
                        <input type="number" class="form-control form-control-sm text-center" value="${item.quantidade}" min="0.01" step="0.01">
                    </td>
                    <td class="text-center" style="min-width: 80px;">
                        <input type="text" class="form-control form-control-sm text-center" value="${item.unidade}">
                    </td>
                    <td class="text-center" style="min-width: 100px;">
                        <input type="number" class="form-control form-control-sm text-center" value="${item.valor_unitario}" min="0.01" step="0.01">
                    </td>
                    <td class="text-center" style="min-width: 110px;">
                        <input type="number" class="form-control form-control-sm text-center" value="${item.total}" readonly>
                    </td>
                    <td class="text-center" style="min-width: 60px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removerItemEdicao(${item.id}, event)">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Adicionar eventos para recalcular totais
            adicionarEventosCalculoEdicao();
            
            // Mostrar modal
            new bootstrap.Modal(document.getElementById('modalEditarPedido')).show();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Não foi possível carregar os dados para edição.'
        });
    }
}

// Adicionar eventos para recalcular totais na edição
function adicionarEventosCalculoEdicao() {
    const tabela = document.getElementById('editItensTabela');
    
    tabela.addEventListener('input', function(e) {
        if (e.target.type === 'number' && (e.target.parentElement.cellIndex === 1 || e.target.parentElement.cellIndex === 3)) {
            const linha = e.target.closest('tr');
            const quantidade = parseFloat(linha.cells[1].querySelector('input').value) || 0;
            const valorUnitario = parseFloat(linha.cells[3].querySelector('input').value) || 0;
            const total = quantidade * valorUnitario;
            
            linha.cells[4].querySelector('input').value = total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    });
}

// Remover item da edição
function removerItemEdicao(itemId, event) {
    // Prevenir qualquer comportamento padrão
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('🗑️ Tentando remover item ID:', itemId);
    
    Swal.fire({
        title: 'Confirmar remoção',
        text: 'Deseja realmente remover este item?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                // Buscar a linha específica
                const linha = document.querySelector(`tr[data-item-id="${itemId}"]`);
                console.log('🔍 Linha encontrada:', linha);
                
                if (linha) {
                    // Remover a linha
                    linha.remove();
                    console.log('✅ Item removido com sucesso');
                    
                    // Recalcular totais da tabela
                    recalcularTotaisEdicao();
                    
                    // Mostrar feedback de sucesso
                    Swal.fire({
                        icon: 'success',
                        title: 'Item removido!',
                        text: 'O item foi removido da compra.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    console.error('❌ Linha não encontrada para o ID:', itemId);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro!',
                        text: 'Não foi possível encontrar o item para remover.',
                        confirmButtonColor: '#dc3545'
                    });
                }
            } catch (error) {
                console.error('❌ Erro ao remover item:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: 'Ocorreu um erro ao remover o item.',
                    confirmButtonColor: '#dc3545'
                });
            }
        }
    });
}

// Recalcular totais após remoção de item
function recalcularTotaisEdicao() {
    try {
        const tabela = document.getElementById('editItensTabela');
        const linhas = tabela.querySelectorAll('tr[data-item-id]');
        
        linhas.forEach(linha => {
            const inputs = linha.querySelectorAll('input[type="number"]');
            if (inputs.length >= 3) {
                const quantidade = parseFloat(inputs[0].value) || 0;
                const valorUnitario = parseFloat(inputs[1].value) || 0;
                const inputTotal = inputs[2];
                
                const novoTotal = quantidade * valorUnitario;
                inputTotal.value = novoTotal.toFixed(2);
            }
        });
        
        console.log('✅ Totais recalculados após remoção');
    } catch (error) {
        console.error('❌ Erro ao recalcular totais:', error);
    }
}

// Salvar edição da compra
async function salvarEdicaoPedido() {
    const botaoSalvar = document.querySelector('button[onclick="salvarEdicaoPedido()"]');
    const textoOriginal = botaoSalvar.innerHTML;
    
    botaoSalvar.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Salvando...';
    botaoSalvar.disabled = true;
    
    try {
        // Coletar dados editados
        const tabela = document.getElementById('editItensTabela');
        const linhas = tabela.querySelectorAll('tr[data-item-id]');
        
        // Verificar se há pelo menos um item
        if (linhas.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Atenção!',
                text: 'O pedido deve ter pelo menos um item.',
                confirmButtonColor: '#4a7c59'
            });
            return;
        }
        
        const itensExistentes = [];
        const novosItens = [];
        const itensParaExcluir = [];
        
        // Obter dados do cliente para novos itens
        const clienteId = dadosCompraAtual?.cliente_id || null;
        const vendedor = dadosCompraAtual?.vendedor || 'Sistema';
        const dataPedido = dadosCompraAtual?.data_pedido || new Date().toISOString();
        
        // Obter todos os IDs dos itens originais para identificar quais foram removidos
        const itensOriginais = dadosCompraAtual?.itens_originais || [];
        const itensAtuais = [];
        
        for (const linha of linhas) {
            const itemId = linha.getAttribute('data-item-id');
            const discriminacao = linha.cells[0].querySelector('input').value.trim();
            const quantidade = parseFloat(linha.cells[1].querySelector('input').value) || 0;
            const unidade = linha.cells[2].querySelector('input').value.trim();
            const valorUnitario = parseFloat(linha.cells[3].querySelector('input').value) || 0;
            const total = quantidade * valorUnitario;
            
            // Validar campos obrigatórios
            if (!discriminacao || quantidade <= 0 || !unidade || valorUnitario <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Dados inválidos!',
                    text: 'Todos os campos dos itens devem ser preenchidos com valores válidos.',
                    confirmButtonColor: '#dc3545'
                });
                return;
            }
            
            const itemData = {
                discriminacao,
                quantidade,
                unidade,
                valor_unitario: valorUnitario,
                total
            };
            
            // Se o ID é negativo, é um novo item
            if (parseInt(itemId) < 0) {
                // Adicionar dados para criação
                itemData.cliente_id = clienteId;
                itemData.vendedor = vendedor;
                itemData.data_pedido = dataPedido;
                novosItens.push(itemData);
            } else {
                // Item existente para atualização
                itemData.id = itemId;
                itensExistentes.push(itemData);
                itensAtuais.push(parseInt(itemId));
            }
        }
        
        // Identificar itens que foram removidos
        for (const itemOriginal of itensOriginais) {
            if (!itensAtuais.includes(itemOriginal.id)) {
                itensParaExcluir.push(itemOriginal.id);
            }
        }
        
        console.log('📝 Itens existentes para atualizar:', itensExistentes.length);
        console.log('➕ Novos itens para criar:', novosItens.length);
        console.log('🗑️ Itens para excluir:', itensParaExcluir.length);
        
        // Excluir itens removidos
        for (const itemId of itensParaExcluir) {
            const resultado = await excluirPedido(itemId);
            
            if (!resultado.success) {
                throw new Error(`Erro ao excluir item ${itemId}: ${resultado.error}`);
            }
        }
        
        // Atualizar itens existentes
        for (const item of itensExistentes) {
            const resultado = await atualizarPedido(item.id, {
                discriminacao: item.discriminacao,
                quantidade: item.quantidade,
                unidade: item.unidade,
                valor_unitario: item.valor_unitario,
                total: item.total
            });
            
            if (!resultado.success) {
                throw new Error(`Erro ao atualizar item ${item.id}: ${resultado.error}`);
            }
        }
        
        // Criar novos itens
        for (const item of novosItens) {
            const resultado = await criarPedido(item);
            
            if (!resultado.success) {
                throw new Error(`Erro ao criar novo item: ${resultado.error}`);
            }
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: `Compra atualizada com sucesso! ${itensExistentes.length} itens atualizados, ${novosItens.length} itens adicionados, ${itensParaExcluir.length} itens removidos.`,
            confirmButtonColor: '#4a7c59'
        }).then(() => {
            bootstrap.Modal.getInstance(document.getElementById('modalEditarPedido')).hide();
            location.reload(); // Recarregar página
        });
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: `Não foi possível salvar as alterações: ${error.message}`,
            confirmButtonColor: '#dc3545'
        });
    } finally {
        botaoSalvar.innerHTML = textoOriginal;
        botaoSalvar.disabled = false;
    }
}

// Confirmar exclusão de compra completa
async function confirmarExclusaoCompra(clienteId, dataPedido, vendedor) {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: 'Tem certeza que deseja excluir toda esta compra? Todos os itens serão removidos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir tudo',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            // Buscar todos os itens da compra
            const resultado = await buscarItensCompra(clienteId, dataPedido, vendedor);
            
            if (resultado.success) {
                // Excluir cada item
                for (const item of resultado.data) {
                    const exclusao = await excluirPedido(item.id);
                    if (!exclusao.success) {
                        throw new Error('Erro ao excluir item: ' + exclusao.error);
                    }
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Excluído!',
                    text: 'Compra excluída com sucesso.',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Recarregar a tabela
                location.reload();
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Não foi possível excluir a compra.'
            });
        }
    }
}

// ========== FUNÇÕES AUXILIARES ==========

// Função removida - carregarCidadesEdicao() 
// Função removida - carregarCidadesEdicao() 
// Os dados do cliente não são mais editáveis no modal de edição de pedido

// Obter sigla do estado pelo nome completo
function obterSiglaEstado(nomeEstado) {
    const estados = {
        'Acre': 'AC',
        'Alagoas': 'AL',
        'Amapá': 'AP',
        'Amazonas': 'AM',
        'Bahia': 'BA',
        'Ceará': 'CE',
        'Distrito Federal': 'DF',
        'Espírito Santo': 'ES',
        'Goiás': 'GO',
        'Maranhão': 'MA',
        'Mato Grosso': 'MT',
        'Mato Grosso do Sul': 'MS',
        'Minas Gerais': 'MG',
        'Pará': 'PA',
        'Paraíba': 'PB',
        'Paraná': 'PR',
        'Pernambuco': 'PE',
        'Piauí': 'PI',
        'Rio de Janeiro': 'RJ',
        'Rio Grande do Norte': 'RN',
        'Rio Grande do Sul': 'RS',
        'Rondônia': 'RO',
        'Roraima': 'RR',
        'Santa Catarina': 'SC',
        'São Paulo': 'SP',
        'Sergipe': 'SE',
        'Tocantins': 'TO'
    };
    
    return estados[nomeEstado] || '';
}

// ========== GERAÇÃO DE RELATÓRIO PDF ==========

async function gerarRelatorioCompleto() {
    try {
        // Verificar se há dados ou usar dados de exemplo
        if (!comprasCarregadas || comprasCarregadas.length === 0) {
            // Se não houver dados, ainda assim gerar um relatório vazio
        }
        
        Swal.fire({
            title: 'Gerando Relatório...',
            text: 'Por favor, aguarde enquanto o relatório é gerado.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Verificar se jsPDF está disponível
        if (!window.jspdf) {
            throw new Error('jsPDF não está carregado');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape'); // Paisagem para mais espaço

        // Configurações
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let currentY = margin;

        // Cabeçalho do relatório
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        
        // Desenhar retângulo para o cabeçalho
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 25, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 25);
        
        // Carregar e adicionar logo (opcional - não bloquear se falhar)
        try {
            const logoImg = await carregarImagemBase64('/img/logo.png');
            // Logo no centro-esquerda do cabeçalho
            doc.addImage(logoImg, 'PNG', margin + 10, currentY + 2.5, 20, 20);
        } catch (error) {
            console.log('Continuando sem logo:', error.message);
        }
        
        // Texto do cabeçalho (centralizado)
        currentY += 8;
        doc.text('EMPRESA Y', pageWidth / 2, currentY, { align: 'center' });
        currentY += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('EMPRESA Y LTDA', pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        doc.text('Rod MT Y N° Y-S Y. Y Cep:00.000.000 Arenápolis MT', pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        doc.text('Fone: (00) 0 0000-0000 ou (00) 0 0000-0000', pageWidth / 2, currentY, { align: 'center' });

        // Redes sociais (ícones simples usando Unicode)
        currentY += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        // Unicode: Instagram (📷), Facebook (📘), Email (✉️)
        const redesText = 'Instagram: @empresa   Facebook: /empresa   E-mail: empresa@gmail.com';
        doc.text(redesText, pageWidth / 2, currentY, { align: 'center' });

        currentY += 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RELATÓRIO COMPLETO DE PEDIDOS', pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        // Linha separadora
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;

        // Resumo estatístico
        doc.setFontSize(12);
        doc.text('Resumo Estatístico:', margin, currentY);
        currentY += 8;

        // Usar dados existentes ou valores padrão
        const dadosParaProcessar = comprasCarregadas || [];
        const totalCompras = dadosParaProcessar.length;
        const totalItens = dadosParaProcessar.reduce((acc, compra) => {
            const qtd = compra?.quantidade_itens || 0;
            return acc + qtd;
        }, 0);
        const faturamentoTotal = dadosParaProcessar.reduce((acc, compra) => {
            const total = parseFloat(compra?.total_compra) || 0;
            return acc + total;
        }, 0);

        doc.setFontSize(10);
        doc.text(`• Total de Compras: ${totalCompras}`, margin + 10, currentY);
        currentY += 6;
        doc.text(`• Total de Itens: ${totalItens}`, margin + 10, currentY);
        currentY += 6;
        doc.text(`• Faturamento Total: R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 10, currentY);
        currentY += 15;

        // Linha separadora
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;

        // Dados das compras
        doc.setFontSize(12);
        doc.text('Detalhamento das Compras:', margin, currentY);
        currentY += 10;

        // Verificar se há dados
        if (dadosParaProcessar.length === 0) {
            doc.setFontSize(10);
            doc.text('Nenhuma compra encontrada.', margin + 10, currentY);
        } else {
            // Cabeçalho da tabela
            doc.setFontSize(8);
            const colunas = ['ID', 'Vendedor', 'Cliente', 'Data', 'Itens', 'Total'];
            const larguraColunas = [25, 50, 70, 40, 30, 40];
            let x = margin;

            // Desenhar cabeçalho
            doc.setFillColor(74, 124, 89); // Verde da empresa
            doc.rect(x, currentY - 5, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255); // Texto branco

            for (let i = 0; i < colunas.length; i++) {
                doc.text(colunas[i], x + larguraColunas[i] / 2, currentY, { align: 'center' });
                x += larguraColunas[i];
            }
            currentY += 8;

            // Resetar cor do texto
            doc.setTextColor(0, 0, 0);

            // Dados das compras
            for (let i = 0; i < dadosParaProcessar.length; i++) {
                const compra = dadosParaProcessar[i];

                // Verificar se precisa de nova página
                if (currentY > pageHeight - 30) {
                    doc.addPage('landscape');
                    currentY = margin;
                }

                // Desenhar linha zebrada
                if (i % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margin, currentY - 5, pageWidth - 2 * margin, 10, 'F');
                }

                x = margin;
                
                // Tratar dados de forma mais segura
                const compraId = compra?.compra_id ? compra.compra_id.toString() : 'N/A';
                const vendedor = compra?.vendedor || 'N/A';
                const nomeCliente = compra?.cliente?.nome || 'N/A';
                const clienteTruncado = nomeCliente.length > 25 ? nomeCliente.substring(0, 25) + '...' : nomeCliente;
                const dataFormatada = formatarDataPDF(compra?.data_pedido);
                const quantItens = (compra?.quantidade_itens || 0).toString();
                const totalFormatado = `R$ ${formatarMoeda(compra?.total_compra || 0)}`;
                
                const dadosLinha = [
                    compraId,
                    vendedor,
                    clienteTruncado,
                    dataFormatada,
                    quantItens,
                    totalFormatado
                ];

                for (let j = 0; j < dadosLinha.length; j++) {
                    try {
                        doc.text(dadosLinha[j], x + larguraColunas[j] / 2, currentY, { align: 'center' });
                    } catch (textError) {
                        console.error(`Erro ao adicionar texto na coluna ${j}:`, textError);
                        doc.text('Erro', x + larguraColunas[j] / 2, currentY, { align: 'center' });
                    }
                    x += larguraColunas[j];
                }

                currentY += 8;
            }
        }

        // Rodapé
        console.log('Adicionando rodapé...'); // Debug
        const totalPaginas = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPaginas; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            doc.text('EMPRESA Y - Sistema de Gestão', margin, pageHeight - 10);
        }

        // Salvar PDF
        console.log('Salvando PDF...'); // Debug
        const nomeArquivo = `relatorio-pedidos-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nomeArquivo);
        console.log('PDF salvo com sucesso:', nomeArquivo); // Debug

        Swal.fire({
            icon: 'success',
            title: 'Relatório Gerado!',
            html: `
                <p>O relatório foi gerado e baixado com sucesso.</p>
                <small class="text-muted">
                    Total de compras: ${totalCompras}<br>
                    Faturamento total: R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </small>
            `,
            confirmButtonColor: '#4a7c59'
        });

    } catch (error) {
        console.error('Erro detalhado ao gerar PDF:', error);
        console.error('Stack trace:', error.stack);
        
        Swal.fire({
            icon: 'error',
            title: 'Erro ao gerar relatório',
            html: `
                <p>Ocorreu um erro ao gerar o relatório PDF.</p>
                <small class="text-muted">Erro: ${error.message}</small>
            `,
            confirmButtonColor: '#4a7c59'
        });
    }
}

// Função auxiliar para formatar data no PDF
function formatarDataPDF(data) {
    if (!data) return 'N/A';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

// Função auxiliar para carregar imagem como base64
function carregarImagemBase64(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.width;
            canvas.height = this.height;
            ctx.drawImage(this, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = function() {
            reject(new Error('Não foi possível carregar a imagem'));
        };
        img.src = src;
    });
}

// Gerar PDF de um pedido específico
let dadosCompraAtual = null; // Variável global para armazenar dados da compra atual

async function gerarPDFPedido() {
    try {
        if (!dadosCompraAtual) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Dados do pedido não encontrados.',
                confirmButtonColor: '#4a7c59'
            });
            return;
        }

        Swal.fire({
            title: 'Gerando PDF...',
            text: 'Por favor, aguarde enquanto o PDF é gerado.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configurações da página
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let currentY = margin;

        // ===== CABEÇALHO PRINCIPAL =====
        // Desenhar retângulo para o cabeçalho
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 25, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 25);
        
        // Carregar e adicionar logo
        try {
            const logoImg = await carregarImagemBase64('/img/logo.png');
            // Adicionar logo no lado esquerdo (20x20 px)
            doc.addImage(logoImg, 'PNG', margin + 3, currentY + 2.5, 20, 20);
        } catch (error) {
            console.log('Erro ao carregar logo:', error);
        }
        
        // Ajustar altura do cabeçalho para caber todo o texto
        // Redesenhar o retângulo do cabeçalho com altura maior
        const headerBoxHeight = 33;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, currentY, pageWidth - 2 * margin, headerBoxHeight, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, currentY, pageWidth - 2 * margin, headerBoxHeight);

        // Adicionar logo novamente (ajustar Y se necessário)
        try {
            const logoImg = await carregarImagemBase64('/img/logo.png');
            // Centralizar verticalmente na caixa do cabeçalho (headerBoxHeight)
            // headerBoxHeight = 38, imagem = 20px de altura
            // (38 - 20) / 2 = 9
            doc.addImage(logoImg, 'PNG', margin + 3, currentY + ((headerBoxHeight - 20) / 2), 25, 20);
        } catch (error) {
            // Se já tentou acima, pode ignorar aqui
        }

        // Texto do cabeçalho (ajustado para caber dentro da caixa)
        // Centralizar o texto do cabeçalho dentro da caixa
        // Cabeçalho: nome da empresa à esquerda, dados centrais
        let headerTextY = currentY + 8;
        const headerLeftX = margin + 35; // Deixar espaço para o logo

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('EMPRESA Y', headerLeftX, headerTextY, { align: 'left' });
        headerTextY += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('EMPRESA Y LTDA', headerLeftX, headerTextY, { align: 'left' });
        headerTextY += 5;
        doc.text('Rod MT Y N° Y-S Y. Y Cep:00.000.000 Arenápolis MT', headerLeftX, headerTextY, { align: 'left' });
        headerTextY += 5;
        doc.text('Fone: (00) 0 0000-0000 ou (00) 0 0000-0000', headerLeftX, headerTextY, { align: 'left' });

        // Redes sociais
        headerTextY += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const redesText = 'Instagram: @empresa   Facebook: /empresa   E-mail: empresa@gmail.com';
        doc.text(redesText, headerLeftX, headerTextY, { align: 'left' });

        // Atualizar currentY para logo após o cabeçalho
        currentY += headerBoxHeight;



        // ===== CABEÇALHO DO PEDIDO =====
        currentY += 7;
        
        // Caixa do PEDIDO
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(0, 0, 0);
        doc.rect(margin, currentY, 40, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        // Caixa do PEDIDO com número dentro
        doc.setTextColor(255, 255, 255);
        doc.text(`PEDIDO: ${String(dadosCompraAtual.compraId).padStart(4, '0')}`, margin + 6, currentY + 5);

        // Resetar cor e fonte para o restante
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const dataAtual = new Date();
        const dia = String(dataAtual.getDate()).padStart(2, '0');
        const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
        const ano = dataAtual.getFullYear();
        
        doc.text('Data:', pageWidth - 60, currentY + 5);
        doc.text(`${dia}/${mes}/${ano}`, pageWidth - 50, currentY + 5);
        
        // ===== DADOS DO CLIENTE =====
        currentY += 10;
        
        // Linha Nome
        //doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 2;
        doc.text('Nome:', margin, currentY + 5);
        doc.text(dadosCompraAtual.cliente.nome, margin + 15, currentY + 5);
        currentY += 8;
        
        // Linha CPF/CNPJ
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 2;
        doc.text('CPF/CNPJ:', margin, currentY + 5);
        doc.text(dadosCompraAtual.cliente.cpf_cnpj || '', margin + 20, currentY + 5);
        currentY += 8;
        
        // Linha Endereço
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 2;
        doc.text('Endereço:', margin, currentY + 5);
        doc.text(dadosCompraAtual.cliente.endereco || '', margin + 20, currentY + 5);
        currentY += 8;
        
        // Linha Cidade e Estado
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 2;
        doc.text('Cidade:', margin, currentY + 5);
        doc.text(dadosCompraAtual.cliente.cidade || '', margin + 15, currentY + 5);
        doc.text('Estado:', margin + 100, currentY + 5);
        doc.text(dadosCompraAtual.cliente.estado || '', margin + 115, currentY + 5);
        doc.text('Fone:', pageWidth - 60, currentY + 5);
        doc.text(dadosCompraAtual.cliente.celular || '', pageWidth - 50, currentY + 5);
        currentY += 8;
        
        // Inscrição Estadual 
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 2;
        doc.text('Inscrição Estadual:', margin, currentY + 5);
        doc.text(dadosCompraAtual.cliente.inscricao_estadual || '', margin + 25, currentY + 5);
        currentY += 8;

        

        // ===== CABEÇALHO DA TABELA DE ITENS =====
       // doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 2;
        
        // ===== TABELA DE ITENS DO PEDIDO =====
        // Definir larguras das colunas
        const colWidths = [25, 20, pageWidth - 2 * margin - 25 - 20 - 30 - 30, 30, 30]; // QUANT, UN, DISCRIMINAÇÃO, UNIT., TOTAL
        const colHeaders = ['QUANT', 'UN', 'DISCRIMINAÇÃO', 'UNIT.', 'TOTAL'];
        const startX = margin;
        let x = startX;

        // Cabeçalho da tabela
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setFillColor(0, 0, 0);
        doc.rect(startX, currentY, pageWidth - 2 * margin, 10, 'F');
        doc.setTextColor(255, 255, 255);

        // Desenhar linhas verticais do cabeçalho
        let colX = startX;
        for (let i = 0; i < colWidths.length; i++) {
            if (i > 0) {
            doc.setDrawColor(200, 200, 200);
            doc.line(colX, currentY, colX, currentY + 10);
            }
            colX += colWidths[i];
        }
        // Linha da direita
        doc.line(startX + colWidths.reduce((a, b) => a + b, 0), currentY, startX + colWidths.reduce((a, b) => a + b, 0), currentY + 10);

        x = startX;
        for (let i = 0; i < colHeaders.length; i++) {
            let align = i === 2 ? 'left' : 'center';
            let headerX = x + (colWidths[i] / 2);
            if (i === 2) headerX = x + 2; // Discriminação alinhada à esquerda
            doc.text(colHeaders[i], headerX, currentY + 6, { align });
            x += colWidths[i];
        }

        currentY += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        // Itens do pedido em formato de tabela
        let totalGeral = 0;
        dadosCompraAtual.itens.forEach((item, index) => {
            // Nova página se necessário
            if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = margin;
            }
            // Linha da tabela
            doc.setDrawColor(200, 200, 200);
            doc.rect(startX, currentY, pageWidth - 2 * margin, 10);

            // Desenhar linhas verticais das colunas
            let colX = startX;
            for (let i = 0; i < colWidths.length; i++) {
            if (i > 0) {
                doc.line(colX, currentY, colX, currentY + 10);
            }
            colX += colWidths[i];
            }
            // Linha da direita
            doc.line(startX + colWidths.reduce((a, b) => a + b, 0), currentY, startX + colWidths.reduce((a, b) => a + b, 0), currentY + 10);

            x = startX;
            // QUANT
            doc.text(
            (parseFloat(item.quantidade) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
            x + colWidths[0] / 2,
            currentY + 7,
            { align: 'center' }
            );
            x += colWidths[0];

            // UN
            doc.text(
            item.unidade || 'KG',
            x + colWidths[1] / 2,
            currentY + 7,
            { align: 'center' }
            );
            x += colWidths[1];

            // DISCRIMINAÇÃO (quebra se muito longo)
            let discr = item.discriminacao || '';
            if (discr.length > 45) discr = discr.substring(0, 45) + '...';
            doc.text(
            discr,
            x + 2,
            currentY + 7,
            { align: 'left' }
            );
            x += colWidths[2];

            // UNIT.
            doc.text(
            (parseFloat(item.valor_unitario) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            x + colWidths[3] / 2,
            currentY + 7,
            { align: 'center' }
            );
            x += colWidths[3];

            // TOTAL
            const totalItem = parseFloat(item.total) || 0;
            totalGeral += totalItem;
            doc.text(
            totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            x + colWidths[4] / 2,
            currentY + 7,
            { align: 'center' }
            );

            currentY += 10;
        });

        // Completar linhas vazias para manter o layout
        const linhasRestantes = Math.max(0, 8 - dadosCompraAtual.itens.length);
        for (let i = 0; i < linhasRestantes; i++) {
            doc.setDrawColor(200, 200, 200);
            doc.rect(startX, currentY, pageWidth - 2 * margin, 10);

            // Linhas verticais das colunas nas linhas vazias
            let colX = startX;
            for (let j = 0; j < colWidths.length; j++) {
            if (j > 0) {
                doc.line(colX, currentY, colX, currentY + 10);
            }
            colX += colWidths[j];
            }
            // Linha da direita
            doc.line(startX + colWidths.reduce((a, b) => a + b, 0), currentY, startX + colWidths.reduce((a, b) => a + b, 0), currentY + 10);

            currentY += 10;
        }
        
        // ===== TOTAL FINAL =====
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;
        
        // Caixa do total
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL: R$', pageWidth - 55, currentY);
        
        // Desenhar retângulo para o total
        doc.setDrawColor(0, 0, 0);
        doc.rect(pageWidth - 60, currentY - 5, 45, 10);
        doc.text(totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 35, currentY, { align: 'center' });
        
        // ===== RODAPÉ =====
        currentY += 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Agradecemos a Preferência', margin, currentY);
        
        // Linha de assinaturas
        currentY += 25;
        doc.line(margin, currentY, margin + 80, currentY);
        doc.line(pageWidth - 80, currentY, pageWidth - margin, currentY);
        currentY += 5;
        doc.setFontSize(8);
        doc.text('Assinatura do Vendedor', margin + 10, currentY);
        doc.text('Assinatura do Cliente', pageWidth - 70, currentY);

        // Salvar PDF
        const nomeArquivo = `pedido-${String(dadosCompraAtual.compraId).padStart(4, '0')}-${dia}${mes}${ano}.pdf`;
        doc.save(nomeArquivo);

        Swal.fire({
            icon: 'success',
            title: 'PDF Gerado!',
            text: 'O PDF do pedido foi gerado.',
            confirmButtonColor: '#4a7c59'
        });

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao gerar PDF',
            text: 'Ocorreu um erro ao gerar o PDF do pedido.',
            confirmButtonColor: '#4a7c59'
        });
    }
}
