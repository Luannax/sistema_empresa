// Lógica do formulário de pedidos com múltiplos itens
let itensCarrinho = [];

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

        // Definir data atual
        const dataCadastro = document.getElementById('dataCadastro');
        if (dataCadastro) {
            const hoje = new Date();
            const dataFormatada = hoje.toISOString().split('T')[0];
            dataCadastro.value = dataFormatada;
        }

        const form = document.getElementById('form_cadastrar_pedido');
        const quantidadeInput = document.getElementById('quantidade');
        const valorUnitarioInput = document.getElementById('valorUnitario');
        const totalItemInput = document.getElementById('totalItem');

        // Adicionar eventos para cálculo automático
        quantidadeInput.addEventListener('input', calcularTotalItem);
        quantidadeInput.addEventListener('change', calcularTotalItem);
        quantidadeInput.addEventListener('blur', calcularTotalItem);
        quantidadeInput.addEventListener('keyup', calcularTotalItem);
        
        valorUnitarioInput.addEventListener('input', calcularTotalItem);
        valorUnitarioInput.addEventListener('change', calcularTotalItem);
        valorUnitarioInput.addEventListener('blur', formatarValorUnitario);
        valorUnitarioInput.addEventListener('keyup', calcularTotalItem);
        
        // Permitir apenas números, vírgula e ponto no valor unitário
        valorUnitarioInput.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            if (!/[0-9,.]/.test(char) && e.which !== 8 && e.which !== 0) {
                e.preventDefault();
            }
        });
        
        // Calcular uma vez no carregamento da página
        setTimeout(calcularTotalItem, 500);
        
        // Função global para testar o cálculo
        window.testarCalculo = function() {
            console.log('🧪 Testando cálculo manual...');
            
            const quantidadeInput = document.getElementById('quantidade');
            const valorUnitarioInput = document.getElementById('valorUnitario');
            const totalItemInput = document.getElementById('totalItem');
            
            // Definir valores de teste se os campos estiverem vazios
            if (!quantidadeInput.value) {
                quantidadeInput.value = '2';
            }
            if (!valorUnitarioInput.value) {
                valorUnitarioInput.value = '15.50';
            }
            
            // Forçar o cálculo
            calcularTotalItem();
            
            // Mostrar feedback
            Swal.fire({
                icon: 'info',
                title: 'Teste de Cálculo',
                html: `
                    <div class="text-start">
                        <p><strong>Quantidade:</strong> ${quantidadeInput.value}</p>
                        <p><strong>Valor Unitário:</strong> ${valorUnitarioInput.value}</p>
                        <p><strong>Total Calculado:</strong> ${totalItemInput.value}</p>
                    </div>
                `,
                confirmButtonColor: '#4a7c59'
            });
        };
        
        // Função global para testar remoção de itens
        window.testarRemocao = function() {
            console.log('🧪 Testando sistema de remoção...');
            
            if (itensCarrinho.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Carrinho vazio',
                    text: 'Adicione alguns itens ao carrinho para testar a remoção.',
                    confirmButtonColor: '#4a7c59'
                });
                return;
            }
            
            console.log('📦 Itens no carrinho:', itensCarrinho.length);
            console.log('🔍 Verificando botões de remoção...');
            
            const botoesRemover = document.querySelectorAll('button[onclick*="removerItem"]');
            console.log('🔘 Botões de remoção encontrados:', botoesRemover.length);
            
            botoesRemover.forEach((botao, index) => {
                console.log(`Botão ${index + 1}:`, {
                    type: botao.type,
                    onclick: botao.getAttribute('onclick'),
                    classes: botao.className
                });
            });
            
            Swal.fire({
                icon: 'info',
                title: 'Teste de Remoção',
                html: `
                    <div class="text-start">
                        <p><strong>Itens no carrinho:</strong> ${itensCarrinho.length}</p>
                        <p><strong>Botões encontrados:</strong> ${botoesRemover.length}</p>
                        <p class="mt-3">Agora clique em um botão de lixeira para testar!</p>
                    </div>
                `,
                confirmButtonColor: '#4a7c59'
            });
        };

    // Adicionar eventos para cálculo automático
    quantidadeInput.addEventListener('input', calcularTotalItem);
    quantidadeInput.addEventListener('change', calcularTotalItem);
    quantidadeInput.addEventListener('blur', calcularTotalItem);
    quantidadeInput.addEventListener('keyup', calcularTotalItem);
    
    valorUnitarioInput.addEventListener('input', calcularTotalItem);
    valorUnitarioInput.addEventListener('change', calcularTotalItem);
    valorUnitarioInput.addEventListener('blur', formatarValorUnitario);
    valorUnitarioInput.addEventListener('keyup', calcularTotalItem);
    
    // Permitir apenas números, vírgula e ponto no valor unitário
    valorUnitarioInput.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.which);
        if (!/[0-9,.]/.test(char) && e.which !== 8 && e.which !== 0) {
            e.preventDefault();
        }
    });
    
    // Calcular uma vez no carregamento da página
    setTimeout(calcularTotalItem, 500);

    // Submissão do formulário (finalizar pedido)
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar campos obrigatórios
        if (!validarCamposObrigatorios()) {
            return;
        }
        
        if (itensCarrinho.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Atenção!',
                text: 'Adicione pelo menos um item ao pedido antes de finalizar.',
                confirmButtonColor: '#4a7c59'
            });
            return;
        }
        
        await finalizarPedido();
    });

    // Máscaras
    const cpfCnpjInput = form.querySelector('input[placeholder="Digite o CPF ou CNPJ"]');
    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            } else {
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }

    const celularInput = form.querySelector('input[placeholder="Digite o celular"]');
    if (celularInput) {
        celularInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = value;
        });
    }

    // Máscara para valor unitário (permitir vírgula)
    if (valorUnitarioInput) {
        valorUnitarioInput.addEventListener('input', function(e) {
            let value = e.target.value;
            
            // Remover caracteres que não são números, vírgulas ou pontos
            value = value.replace(/[^\d,]/g, '');
            
            // Substituir múltiplas vírgulas por uma só
            value = value.replace(/,+/g, ',');
            
            // Garantir apenas uma vírgula
            const parts = value.split(',');
            if (parts.length > 2) {
                value = parts[0] + ',' + parts.slice(1).join('');
            }
            
            // Limitar a 2 casas decimais após a vírgula
            if (parts.length === 2 && parts[1].length > 2) {
                value = parts[0] + ',' + parts[1].substring(0, 2);
            }
            
            e.target.value = value;
        });
    }

    // Máscara para quantidade (permitir vírgula)
    if (quantidadeInput) {
        quantidadeInput.addEventListener('input', function(e) {
            let value = e.target.value;
            
            // Remover caracteres que não são números, vírgulas ou pontos
            value = value.replace(/[^\d,]/g, '');
            
            // Substituir múltiplas vírgulas por uma só
            value = value.replace(/,+/g, ',');
            
            // Garantir apenas uma vírgula
            const parts = value.split(',');
            if (parts.length > 2) {
                value = parts[0] + ',' + parts.slice(1).join('');
            }
            
            // Limitar a 2 casas decimais após a vírgula
            if (parts.length === 2 && parts[1].length > 2) {
                value = parts[0] + ',' + parts[1].substring(0, 2);
            }
            
            e.target.value = value;
        });
    }
});

// ========== FUNÇÕES GLOBAIS ==========

// Função auxiliar para converter valor brasileiro para número
function converterValorBrasileiroParaNumero(valor) {
    if (!valor) return 0;
    
    // Converter para string e remover espaços
    let valorLimpo = String(valor).trim();
    
    // Remover símbolos de moeda e espaços
    valorLimpo = valorLimpo.replace(/[R$\s]/g, '');
    
    // Se tem pontos e vírgulas, assume formato brasileiro (1.234,56)
    if (valorLimpo.includes('.') && valorLimpo.includes(',')) {
        // Remove pontos (separadores de milhares) e substitui vírgula por ponto
        valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
    } 
    // Se tem apenas vírgula, substitui por ponto
    else if (valorLimpo.includes(',') && !valorLimpo.includes('.')) {
        valorLimpo = valorLimpo.replace(',', '.');
    }
    
    const numero = parseFloat(valorLimpo) || 0;
    console.log(`💰 Conversão: "${valor}" → ${numero}`);
    return numero;
}

// Função para formatar número como moeda brasileira
function formatarMoedaBrasileira(valor) {
    if (isNaN(valor) || !isFinite(valor)) return 'R$ 0,00';
    
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Função para formatar valor unitário no campo (sem R$)
function formatarValorUnitario() {
    const valorUnitarioInput = document.getElementById('valorUnitario');
    if (!valorUnitarioInput) return;
    
    const valor = converterValorBrasileiroParaNumero(valorUnitarioInput.value);
    if (valor > 0) {
        // Formatar sem o símbolo R$
        const valorFormatado = valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        valorUnitarioInput.value = valorFormatado;
    }
}

// Função para calcular total do item (movida para escopo global)
function calcularTotalItem() {
    console.log('🧮 Calculando total do item...');
    
    const quantidadeInput = document.getElementById('quantidade');
    const valorUnitarioInput = document.getElementById('valorUnitario');
    const totalItemInput = document.getElementById('totalItem');
    
    if (!quantidadeInput || !valorUnitarioInput || !totalItemInput) {
        console.error('❌ Elementos não encontrados para cálculo');
        return 0;
    }
    
    // Obter valores dos campos usando a função de conversão
    const quantidade = converterValorBrasileiroParaNumero(quantidadeInput.value);
    const valorUnitario = converterValorBrasileiroParaNumero(valorUnitarioInput.value);
    
    console.log('📊 Valores convertidos:', {
        quantidadeRaw: quantidadeInput.value,
        valorUnitarioRaw: valorUnitarioInput.value,
        quantidade: quantidade,
        valorUnitario: valorUnitario
    });
    
    // Calcular total
    const total = quantidade * valorUnitario;
    
    console.log('🔢 Cálculo:', {
        quantidade: quantidade,
        valorUnitario: valorUnitario,
        total: total,
        totalValido: !isNaN(total) && isFinite(total)
    });
    
    // Formatar como moeda brasileira
    let totalFormatado = 'R$ 0,00';
    if (!isNaN(total) && isFinite(total) && total >= 0) {
        totalFormatado = formatarMoedaBrasileira(total);
    }
    
    // Atualizar campo com animação sutil
    totalItemInput.value = totalFormatado;
    totalItemInput.style.backgroundColor = total > 0 ? '#d4edda' : '#f8f9fa';
    totalItemInput.style.borderColor = total > 0 ? '#28a745' : '#ced4da';
    
    // Remover destaque após um tempo
    setTimeout(() => {
        totalItemInput.style.backgroundColor = '#f8f9fa';
        totalItemInput.style.borderColor = '#ced4da';
    }, 2000);
    
    console.log('💰 Total formatado exibido:', totalFormatado);
    
    // Atualizar totais gerais se necessário
    atualizarTotaisGerais();
    
    return total; // Retornar valor numérico para outras funções
}

// Função para atualizar totais gerais
function atualizarTotaisGerais() {
    const totalItens = document.getElementById('totalItens');
    const totalGeral = document.getElementById('totalGeral');
    if (totalItens && totalGeral && itensCarrinho.length > 0) {
        const total = itensCarrinho.reduce((acc, item) => acc + (item.total || 0), 0);
        const totalFormatado = formatarMoedaBrasileira(total).replace('R$ ', '');
        totalItens.textContent = itensCarrinho.length;
        totalGeral.textContent = totalFormatado;
    } else {
        // Se não há itens, garantir que ambos os totais fiquem zerados
        if (totalGeral) totalGeral.textContent = '0,00';
        if (totalItens) totalItens.textContent = '0';
    }
}

// ========== FUNÇÕES DO CARRINHO DE ITENS ==========

function adicionarItem() {
    console.log('📦 Adicionando item ao carrinho...');
    
    // Forçar recálculo antes de adicionar
    const totalCalculado = calcularTotalItem();
    
    const discriminacao = document.getElementById('discriminacao').value.trim();
    const quantidade = converterValorBrasileiroParaNumero(document.getElementById('quantidade').value);
    const unidade = document.getElementById('unidade').value.trim();
    const valorUnitario = converterValorBrasileiroParaNumero(document.getElementById('valorUnitario').value);
    
    // Usar o total calculado pela função
    const total = totalCalculado || (quantidade * valorUnitario);

    console.log('📊 Dados do item:', { 
        discriminacao, 
        quantidade, 
        unidade, 
        valorUnitario, 
        total,
        totalCalculado: totalCalculado
    });

    // Validações
    if (!discriminacao) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, preencha a discriminação do item.',
            confirmButtonColor: '#4a7c59'
        });
        document.getElementById('discriminacao').focus();
        return;
    }

    if (quantidade <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Quantidade inválida',
            text: 'A quantidade deve ser maior que zero.',
            confirmButtonColor: '#4a7c59'
        });
        document.getElementById('quantidade').focus();
        return;
    }

    if (valorUnitario <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Valor inválido',
            text: 'O valor unitário deve ser maior que zero.',
            confirmButtonColor: '#4a7c59'
        });
        document.getElementById('valorUnitario').focus();
        return;
    }

    const item = {
        id: Date.now(),
        discriminacao,
        quantidade,
        unidade,
        valorUnitario,
        total
    };

    // Sempre adicionar novo item ao carrinho
    itensCarrinho.push(item);
    
    console.log('Item adicionado ao carrinho. Total de itens:', itensCarrinho.length);
    console.log('Carrinho atual:', itensCarrinho);
    
    Swal.fire({
        icon: 'success',
        title: 'Item adicionado!',
        timer: 1500,
        showConfirmButton: false
    });

    atualizarTabelaItens();
    limparFormularioItem();
}

function limparFormularioItem() {
    document.getElementById('discriminacao').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('unidade').value = '';
    document.getElementById('valorUnitario').value = '';
    document.getElementById('totalItem').value = '';
}

// Função para limpar todo o formulário após finalizar pedido
function limparFormularioCompleto() {
    // Limpar dados do cliente
    const form = document.getElementById('form_cadastrar_pedido');
    form.querySelector('input[placeholder="Digite o nome"]').value = '';
    form.querySelector('input[placeholder="Digite o CPF ou CNPJ"]').value = '';
    form.querySelector('input[placeholder="Digite o celular"]').value = '';
    form.querySelector('input[placeholder="Digite o endereço"]').value = '';
    form.querySelector('input[placeholder="Digite a inscrição estadual"]').value = '';
    
    // Resetar selects de estado e cidade
    document.getElementById('selectEstado').value = '';
    document.getElementById('selectCidade').innerHTML = '<option value="">Primeiro selecione o estado</option>';
    document.getElementById('selectCidade').disabled = true;
    
    // Limpar formulário de item
    limparFormularioItem();
    
    // Limpar carrinho
    itensCarrinho = [];
    atualizarTabelaItens();
    
    Swal.fire({
        icon: 'info',
        title: 'Formulário limpo!',
        text: 'Agora você pode adicionar um novo pedido.',
        timer: 2000,
        showConfirmButton: false
    });
}

function atualizarTabelaItens() {
    console.log('atualizarTabelaItens() chamada. Itens no carrinho:', itensCarrinho.length);
    
    const cardItens = document.getElementById('cardItens');
    const tabelaItens = document.getElementById('tabelaItens');
    const totalItens = document.getElementById('totalItens');
    const totalGeral = document.getElementById('totalGeral');

    console.log('Elementos encontrados:', {
        cardItens: !!cardItens,
        tabelaItens: !!tabelaItens,
        totalItens: !!totalItens,
        totalGeral: !!totalGeral
    });

    if (itensCarrinho.length === 0) {
        if (cardItens) cardItens.style.display = 'none';
        return;
    }

    // Mostrar card de itens
    if (cardItens) {
        cardItens.style.display = 'block';
        console.log('Card de itens exibido');
    }

    // Atualizar contadores
    if (totalItens) {
        totalItens.textContent = itensCarrinho.length;
        console.log('Total de itens atualizado:', itensCarrinho.length);
    }
    
    const valorTotal = itensCarrinho.reduce((acc, item) => acc + item.total, 0);
    if (totalGeral) {
        totalGeral.textContent = formatarMoedaBrasileira(valorTotal).replace('R$ ', '');
        console.log('Total geral atualizado:', valorTotal);
    }

    // Renderizar tabela
    if (tabelaItens) {
        const htmlTabela = itensCarrinho.map((item, index) => `
            <tr>
                <td>${item.discriminacao}</td>
                <td class="text-center d-none d-sm-table-cell">${item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-center d-none d-sm-table-cell">${item.unidade}</td>
                <td class="text-center d-none d-sm-table-cell">${formatarMoedaBrasileira(item.valorUnitario)}</td>
                <td class="text-center"><strong>${formatarMoedaBrasileira(item.total)}</strong></td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="event.preventDefault(); event.stopPropagation(); removerItem(${index}, event);" title="Remover">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tabelaItens.innerHTML = htmlTabela;
        console.log('Tabela de itens renderizada com', itensCarrinho.length, 'itens');
    }
}

function removerItem(index, event) {
    // Prevenir propagação do evento para evitar submit do formulário
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    
    console.log('🗑️ Removendo item do índice:', index);
    
    // Verificar se o índice é válido
    if (index < 0 || index >= itensCarrinho.length) {
        console.error('❌ Índice inválido:', index, 'Carrinho tem', itensCarrinho.length, 'itens');
        return false;
    }
    
    const item = itensCarrinho[index];
    
    Swal.fire({
        title: 'Confirmar remoção',
        html: `
            <p>Deseja realmente remover este item?</p>
            <div class="text-start mt-3">
                <strong>Item:</strong> ${item.discriminacao}<br>
                <strong>Quantidade:</strong> ${item.quantidade} ${item.unidade}<br>
                <strong>Total:</strong> ${formatarMoedaBrasileira(item.total)}
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Remover item do carrinho (apenas do array)
            itensCarrinho.splice(index, 1);
            console.log('📋 Item removido do carrinho. Carrinho agora tem', itensCarrinho.length, 'itens');
            
            // Atualizar tabela de itens
            atualizarTabelaItens();
            
            Swal.fire({
                icon: 'success',
                title: 'Item removido!',
                text: 'Item removido do carrinho.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
    
    return false; // Garantir que não propague
}

async function finalizarPedido() {
    const form = document.getElementById('form_cadastrar_pedido');
    const btnFinalizar = document.querySelector('button[type="submit"]');
    const textoOriginal = btnFinalizar.innerHTML;
    
    // Mostrar loading
    btnFinalizar.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Finalizando...';
    btnFinalizar.disabled = true;

    try {
        const usuario = await window.AuthManager.obterUsuarioAtual();
        
        const dadosCliente = {
            nome: form.querySelector('input[placeholder="Digite o nome"]').value.trim(),
            cpf_cnpj: form.querySelector('input[placeholder="Digite o CPF ou CNPJ"]').value.trim(),
            cidade: document.getElementById('selectCidade').options[document.getElementById('selectCidade').selectedIndex]?.text || '',
            endereco: form.querySelector('input[placeholder="Digite o endereço"]').value.trim(),
            celular: form.querySelector('input[placeholder="Digite o celular"]').value.trim(),
            estado: document.getElementById('selectEstado').value || '', // Usar o VALUE (sigla) em vez do TEXT (nome completo)
            data_cadastro: document.getElementById('dataCadastro').value,
            inscricao_estadual: form.querySelector('input[placeholder="Digite a inscrição estadual"]').value.trim()
        };

        let clienteId;
        if (dadosCliente.cpf_cnpj) {
            const clienteExistente = await buscarClientePorCpf(dadosCliente.cpf_cnpj);
            
            if (clienteExistente.success && clienteExistente.data) {
                clienteId = clienteExistente.data.id;
            } else {
                const novoCliente = await criarCliente(dadosCliente);
                if (!novoCliente.success) {
                    throw new Error('Erro ao salvar cliente: ' + novoCliente.error);
                }
                clienteId = novoCliente.data.id;
            }
        } else {
            throw new Error('CPF/CNPJ é obrigatório');
        }

        const totalGeral = itensCarrinho.reduce((acc, item) => acc + item.total, 0);
        
        for (const item of itensCarrinho) {
            const dadosPedido = {
                cliente_id: clienteId,
                vendedor_id: usuario.id,  // ID do vendedor
                vendedor: usuario.nome,   // Nome do vendedor (para compatibilidade)
                discriminacao: item.discriminacao,
                quantidade: item.quantidade,
                unidade: item.unidade,
                valor_unitario: item.valorUnitario,
                total: item.total,
                data_pedido: new Date().toISOString() // Incluir data e hora completas
            };

            console.log('💾 Salvando pedido com dados:', dadosPedido);

            const novoPedido = await criarPedido(dadosPedido);
            if (!novoPedido.success) {
                throw new Error('Erro ao salvar item: ' + novoPedido.error);
            }
        }

        Swal.fire({
            icon: 'success',
            title: 'Pedido finalizado!',
            html: `
                <p><strong>${itensCarrinho.length}</strong> itens foram salvos</p>
                <p>Total: <strong>R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                <p>Cliente: <strong>${dadosCliente.nome}</strong></p>
                <p class="text-muted mt-2">Você pode adicionar mais pedidos ou ir para relatórios.</p>
            `,
            confirmButtonColor: '#4a7c59',
            showCancelButton: true,
            confirmButtonText: 'Ver Relatórios',
            cancelButtonText: 'Novo Pedido',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                // Se escolher ver relatórios, redirecionar
                window.location.href = '/pages/relatorio.html';
            } else {
                // Se escolher novo pedido, limpar formulário
                limparFormularioCompleto();
            }
        });

    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Ocorreu um erro ao finalizar o pedido. Tente novamente.',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        btnFinalizar.innerHTML = textoOriginal;
        btnFinalizar.disabled = false;
    }
}

// ========== FUNÇÕES AUXILIARES ==========

// Validar campos obrigatórios
function validarCamposObrigatorios() {
    const form = document.getElementById('form_cadastrar_pedido');
    const nome = form.querySelector('input[placeholder="Digite o nome"]').value.trim();
    const cpfCnpj = form.querySelector('input[placeholder="Digite o CPF ou CNPJ"]').value.trim();
    const celular = form.querySelector('input[placeholder="Digite o celular"]').value.trim();
    const endereco = form.querySelector('input[placeholder="Digite o endereço"]').value.trim();

    if (!nome) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, preencha o nome do cliente.',
            confirmButtonColor: '#4a7c59'
        });
        form.querySelector('input[placeholder="Digite o nome"]').focus();
        return false;
    }

    if (!cpfCnpj) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, preencha o CPF/CNPJ do cliente.',
            confirmButtonColor: '#4a7c59'
        });
        form.querySelector('input[placeholder="Digite o CPF ou CNPJ"]').focus();
        return false;
    }

    if (!celular) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, preencha o celular do cliente.',
            confirmButtonColor: '#4a7c59'
        });
        form.querySelector('input[placeholder="Digite o celular"]').focus();
        return false;
    }

    if (!endereco) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, preencha o endereço do cliente.',
            confirmButtonColor: '#4a7c59'
        });
        form.querySelector('input[placeholder="Digite o endereço"]').focus();
        return false;
    }

    return true;
}

// Carregar cidades baseado no estado selecionado usando API do IBGE
async function carregarCidades() {
    const selectEstado = document.getElementById('selectEstado');
    const selectCidade = document.getElementById('selectCidade');
    const estadoSelecionado = selectEstado.value;

    // Limpar cidades e mostrar loading
    selectCidade.innerHTML = '<option value="">Carregando cidades...</option>';
    selectCidade.disabled = true;
    
    if (!estadoSelecionado) {
        selectCidade.innerHTML = '<option value="">Primeiro selecione o estado</option>';
        return;
    }

    try {
        // Fazer requisição para API do IBGE
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar cidades');
        }
        
        const municipios = await response.json();
        
        // Limpar select e adicionar opção padrão
        selectCidade.innerHTML = '<option value="">Selecione a cidade</option>';
        
        // Ordenar cidades alfabeticamente e adicionar ao select
        municipios
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .forEach(municipio => {
                const option = document.createElement('option');
                option.value = municipio.nome;
                option.textContent = municipio.nome;
                selectCidade.appendChild(option);
            });
        
        // Habilitar select
        selectCidade.disabled = false;
        
    } catch (error) {
        console.error('Erro ao carregar cidades:', error);
        selectCidade.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        
        // Mostrar alerta amigável
        Swal.fire({
            icon: 'warning',
            title: 'Aviso',
            text: 'Não foi possível carregar as cidades. Você pode digitar manualmente se necessário.',
            confirmButtonColor: '#4a7c59',
            timer: 3000,
            showConfirmButton: false
        });
        
        // Permitir que o usuário digite manualmente após erro
        setTimeout(() => {
            selectCidade.innerHTML = '<option value="">Digite ou selecione a cidade</option>';
            selectCidade.disabled = false;
        }, 3000);
    }
}