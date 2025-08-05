// Gerenciamento de Clientes - SOMA
let clienteAtual = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando página de clientes...');
    
    // Verificar autenticação
    try {
        let usuario;
        if (window.AuthManager && typeof window.AuthManager.verificarAutenticacao === 'function') {
            usuario = await window.AuthManager.verificarAutenticacao();
        } else {
            // Fallback para desenvolvimento
            usuario = { nome: 'Admin', prioridade: 'ADM' };
        }
        
        if (!usuario) {
            console.log('❌ Usuario não autenticado');
            return;
        }

        // Verificar se é administrador
        if (usuario.prioridade !== 'ADM') {
            Swal.fire({
                icon: 'warning',
                title: 'Acesso Restrito',
                text: 'Apenas administradores podem gerenciar clientes.',
                confirmButtonColor: '#4a7c59'
            }).then(() => {
                window.location.href = '/pages/pedido.html';
            });
            return;
        }
        
        console.log('✅ Usuario admin validado');
        
        // Carregar clientes
        await carregarClientes();
        
        // Configurar eventos
        configurarEventos();
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
});

function configurarEventos() {
    // Enter na busca
    document.getElementById('inputBusca').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarClientes();
        }
    });
    
    // Máscara inteligente para CPF/CNPJ
    const cpfCnpjInput = document.getElementById('clienteCpfCnpj');
    if (cpfCnpjInput) {
        cpfCnpjInput.addEventListener('input', function(e) {
            aplicarMascaraCpfCnpjCliente(e.target);
        });
        
        cpfCnpjInput.addEventListener('blur', function(e) {
            validarCpfCnpjCliente(e.target);
        });
    }
    
    // Máscara para celular
    const celularInput = document.getElementById('clienteCelular');
    if (celularInput) {
        celularInput.addEventListener('input', function(e) {
            aplicarMascaraCelularCliente(e.target);
        });
        
        celularInput.addEventListener('blur', function(e) {
            validarCelularCliente(e.target);
        });
    }
}

// Função para aplicar máscara de CPF/CNPJ com detecção automática
function aplicarMascaraCpfCnpjCliente(input) {
    // Remover todos os caracteres não numéricos
    let valor = input.value.replace(/\D/g, '');
    
    // Limitar a 14 dígitos (CNPJ)
    if (valor.length > 14) {
        valor = valor.substring(0, 14);
    }
    
    let valorFormatado = '';
    let tipo = '';
    
    if (valor.length <= 11) {
        // CPF: 000.000.000-00
        tipo = 'CPF';
        if (valor.length >= 1) valorFormatado = valor.substring(0, 3);
        if (valor.length >= 4) valorFormatado += '.' + valor.substring(3, 6);
        if (valor.length >= 7) valorFormatado += '.' + valor.substring(6, 9);
        if (valor.length >= 10) valorFormatado += '-' + valor.substring(9, 11);
    } else {
        // CNPJ: 00.000.000/0000-00
        tipo = 'CNPJ';
        if (valor.length >= 1) valorFormatado = valor.substring(0, 2);
        if (valor.length >= 3) valorFormatado += '.' + valor.substring(2, 5);
        if (valor.length >= 6) valorFormatado += '.' + valor.substring(5, 8);
        if (valor.length >= 9) valorFormatado += '/' + valor.substring(8, 12);
        if (valor.length >= 13) valorFormatado += '-' + valor.substring(12, 14);
    }
    
    // Atualizar valor do campo
    input.value = valorFormatado;
    
    // Adicionar ou atualizar indicador visual do tipo
    input.setAttribute('data-tipo', tipo);
    
    // Remover dica anterior se existir
    const dicaAnterior = input.parentElement.querySelector('.format-hint');
    if (dicaAnterior) {
        dicaAnterior.remove();
    }
    
    // Adicionar dica visual se há conteúdo
    if (valorFormatado.length > 0) {
        const dica = document.createElement('small');
        dica.className = 'form-text format-hint';
        dica.style.color = tipo === 'CPF' ? '#28a745' : '#007bff';
        dica.innerHTML = `<i class="bi bi-${tipo === 'CPF' ? 'person' : 'building'}"></i> ${tipo} detectado`;
        input.parentElement.appendChild(dica);
    }
}

// Função para validar CPF/CNPJ
function validarCpfCnpjCliente(input) {
    const valor = input.value.replace(/\D/g, '');
    const tipo = input.getAttribute('data-tipo');
    
    if (valor.length === 0) return; // Campo vazio é válido
    
    let valido = false;
    
    if (tipo === 'CPF' && valor.length === 11) {
        valido = validarCPF(valor);
    } else if (tipo === 'CNPJ' && valor.length === 14) {
        valido = validarCNPJ(valor);
    }
    
    // Aplicar feedback visual
    if (valor.length > 0) {
        if (valido) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
        }
    } else {
        input.classList.remove('is-valid', 'is-invalid');
    }
}

// Função para aplicar máscara de celular
function aplicarMascaraCelularCliente(input) {
    // Remover todos os caracteres não numéricos
    let valor = input.value.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    
    let valorFormatado = '';
    
    if (valor.length >= 1) {
        valorFormatado = '(' + valor.substring(0, 2);
    }
    if (valor.length >= 3) {
        valorFormatado += ') ' + valor.substring(2, valor.length === 11 ? 7 : 6);
    }
    if (valor.length >= (valor.length === 11 ? 8 : 7)) {
        valorFormatado += '-' + valor.substring(valor.length === 11 ? 7 : 6);
    }
    
    input.value = valorFormatado;
    
    // Remover dica anterior se existir
    const dicaAnterior = input.parentElement.querySelector('.format-hint');
    if (dicaAnterior) {
        dicaAnterior.remove();
    }
    
    // Adicionar dica visual se há conteúdo
    if (valorFormatado.length > 0) {
        const dica = document.createElement('small');
        dica.className = 'form-text format-hint text-info';
        dica.innerHTML = `<i class="bi bi-phone"></i> ${valor.length === 11 ? 'Celular' : 'Telefone fixo'} (${valor.length}/11 dígitos)`;
        input.parentElement.appendChild(dica);
    }
}

// Função para validar celular
function validarCelularCliente(input) {
    const valor = input.value.replace(/\D/g, '');
    
    if (valor.length === 0) return; // Campo vazio é válido
    
    // Validar se tem pelo menos 10 dígitos (telefone fixo) ou 11 (celular)
    const valido = valor.length >= 10 && valor.length <= 11;
    
    // Aplicar feedback visual
    if (valor.length > 0) {
        if (valido) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
        }
    } else {
        input.classList.remove('is-valid', 'is-invalid');
    }
}

// Função para validar CPF
function validarCPF(cpf) {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
}

// Função para validar CNPJ
function validarCNPJ(cnpj) {
    if (cnpj.length !== 14) return false;
    
    // Eliminar CNPJs inválidos conhecidos
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validar primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    // Validar segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado === parseInt(digitos.charAt(1));
}

// Funções para obter valores limpos (sem máscara)
function obterCpfCnpjLimpoCliente() {
    const input = document.getElementById('clienteCpfCnpj');
    return input ? input.value.replace(/\D/g, '') : '';
}

function obterCelularLimpoCliente() {
    const input = document.getElementById('clienteCelular');
    return input ? input.value.replace(/\D/g, '') : '';
}

async function carregarClientes() {
    console.log('📋 Carregando clientes...');
    
    try {
        const tbody = document.getElementById('tabelaClientes');
        const totalElement = document.getElementById('totalClientes');
        
        // Mostrar loading
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2 text-muted">Carregando clientes...</p>
                </td>
            </tr>
        `;
        
        // Buscar clientes no banco
        const { data: clientes, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle fs-1"></i>
                        <p class="mt-2">Erro ao carregar clientes: ${error.message}</p>
                        <button class="btn btn-primary btn-sm" onclick="carregarClientes()">Tentar Novamente</button>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (clientes && clientes.length > 0) {
            console.log('✅ Clientes carregados:', clientes.length);

            tbody.innerHTML = clientes.map(cliente => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2 d-none d-sm-flex" 
                                 style="width: 26px; height: 26px; font-size: 12px; color: white;">
                                ${cliente.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-bold" style="font-size: 0.98em;">${cliente.nome}</div>
                                ${cliente.email ? `<small class="text-muted d-none d-md-inline" style="font-size: 0.85em;">${cliente.email}</small>` : ''}
                            </div>
                        </div>
                    </td>
                    <td style="font-size: 0.95em;">
                        <code class="bg-light px-1 py-0 rounded">${formatarCpfCnpjParaExibicao(cliente.cpf_cnpj)}</code>
                    </td>
                    <td class="d-none d-sm-table-cell" style="font-size: 0.95em;">${formatarCelularParaExibicao(cliente.celular)}</td>
                    <td class="d-none d-sm-table-cell" style="font-size: 0.95em;">${cliente.cidade}/${cliente.estado}</td>
                    <td class="d-none d-lg-table-cell" style="font-size: 0.95em;">
                        <span class="badge ${cliente.status === 'ativo' ? 'bg-success' : 'bg-secondary'}">
                            ${cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="d-none d-lg-table-cell" style="font-size: 0.90em;">
                        <small class="text-muted">
                            ${new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                        </small>
                    </td>
                    <td style="width: 60px; min-width: 48px; max-width: 70px; text-align: center;">
                        <!-- Opções para sm+ -->
                        <div class="btn-group btn-group-sm d-none d-sm-inline-flex" role="group">
                            <button class="btn btn-outline-primary" style="padding: 0.10rem 0.25rem;" onclick="visualizarCliente(${cliente.id})" 
                                    title="Visualizar">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" style="padding: 0.10rem 0.25rem;" onclick="editarCliente(${cliente.id})" 
                                    title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" style="padding: 0.10rem 0.25rem;" onclick="excluirCliente(${cliente.id})" 
                                    title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <!-- tela xs -->
                        <div class="dropdown d-inline d-sm-none">
                            <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Opções" style="padding: 0.10rem 0.4rem;">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <a class="dropdown-item" href="#" onclick="visualizarCliente(${cliente.id})">
                                        <i class="bi bi-eye me-2"></i>Visualizar
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#" onclick="editarCliente(${cliente.id})">
                                        <i class="bi bi-pencil me-2"></i>Editar
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item text-danger" href="#" onclick="excluirCliente(${cliente.id})">
                                        <i class="bi bi-trash me-2"></i>Excluir
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `).join('');

            totalElement.textContent = clientes.length;
        } else {
            console.log('ℹ️ Nenhum cliente encontrado');
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <div class="text-muted">
                            <i class="bi bi-person-x fs-1"></i>
                            <p class="mt-3">Nenhum cliente cadastrado</p>
                            <button class="btn btn-primary" onclick="abrirModalCliente()">
                                <i class="bi bi-person-plus me-2"></i>Cadastrar Primeiro Cliente
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            totalElement.textContent = '0';
        }
        
    } catch (error) {
        console.error('💥 Erro ao carregar clientes:', error);
        document.getElementById('tabelaClientes').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle fs-1"></i>
                    <p class="mt-2">Erro inesperado: ${error.message}</p>
                </td>
            </tr>
        `;
    }
}

async function buscarClientes() {
    console.log('🔍 Buscando clientes...');
    
    const busca = document.getElementById('inputBusca').value.trim();
    const status = document.getElementById('filtroStatus').value;
    
    try {
        const tbody = document.getElementById('tabelaClientes');
        
        // Mostrar loading
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Buscando...</p>
                </td>
            </tr>
        `;
        
        // Construir query
        let query = supabaseClient.from('clientes').select('*');
        
        // Filtro de busca por texto
        if (busca) {
            query = query.or(`nome.ilike.%${busca}%,cpf_cnpj.ilike.%${busca}%,email.ilike.%${busca}%`);
        }
        
        // Filtro de status
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data: clientes, error } = await query.order('nome', { ascending: true });
        
        if (error) {
            console.error('❌ Erro na busca:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">Erro na busca: ${error.message}</td>
                </tr>
            `;
            return;
        }
        
        // Atualizar tabela com resultados (usar mesmo código do carregarClientes)
        if (clientes && clientes.length > 0) {
            tbody.innerHTML = clientes.map(cliente => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style="width: 32px; height: 32px; font-size: 14px; color: white;">
                                ${cliente.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-bold">${cliente.nome}</div>
                                ${cliente.email ? `<small class="text-muted d-none d-md-inline">${cliente.email}</small>` : ''}
                            </div>
                        </div>
                    </td>
                    <td><code class="bg-light px-2 py-1 rounded">${formatarCpfCnpjParaExibicao(cliente.cpf_cnpj)}</code></td>
                    <td class="d-none d-md-inline">${formatarCelularParaExibicao(cliente.celular)}</td>
                    <td class="d-none d-md-inline">${cliente.cidade}/${cliente.estado}</td>
                    <td class="d-none d-md-inline">
                        <span class="badge ${cliente.status === 'ativo' ? 'bg-success' : 'bg-secondary'}">
                            ${cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="d-none d-md-inline">
                        <small class="text-muted">
                            ${new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                        </small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-primary" onclick="visualizarCliente(${cliente.id})" title="Visualizar">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="editarCliente(${cliente.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="excluirCliente(${cliente.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('totalClientes').textContent = clientes.length;
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="text-muted">
                            <i class="bi bi-search fs-1"></i>
                            <p class="mt-3">Nenhum cliente encontrado com os filtros aplicados</p>
                            <button class="btn btn-outline-primary btn-sm" onclick="limparFiltros()">
                                Limpar Filtros
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('totalClientes').textContent = '0';
        }
        
    } catch (error) {
        console.error('💥 Erro na busca:', error);
    }
}

function limparFiltros() {
    document.getElementById('inputBusca').value = '';
    document.getElementById('filtroStatus').value = '';
    carregarClientes();
}

function abrirModalCliente(cliente = null) {
    console.log('📝 Abrindo modal cliente:', cliente ? 'edição' : 'novo');
    
    const modal = document.getElementById('modalCliente');
    const titulo = document.getElementById('tituloModal');
    const form = document.getElementById('formCliente');
    
    // Limpar formulário
    form.reset();
    form.classList.remove('was-validated');
    document.querySelectorAll('.is-invalid, .is-valid').forEach(el => el.classList.remove('is-invalid', 'is-valid'));
    
    // Remover dicas de formatação anteriores
    document.querySelectorAll('.format-hint').forEach(el => el.remove());
    
    if (cliente) {
        // Modo edição
        titulo.innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Cliente';
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('clienteNome').value = cliente.nome || '';
        
        // Aplicar CPF/CNPJ com máscara
        const cpfCnpjInput = document.getElementById('clienteCpfCnpj');
        cpfCnpjInput.value = cliente.cpf_cnpj || '';
        if (cliente.cpf_cnpj) {
            // Aplicar máscara ao valor carregado
            setTimeout(() => aplicarMascaraCpfCnpjCliente(cpfCnpjInput), 100);
        }
        
        // Aplicar celular com máscara
        const celularInput = document.getElementById('clienteCelular');
        celularInput.value = cliente.celular || '';
        if (cliente.celular) {
            // Aplicar máscara ao valor carregado
            setTimeout(() => aplicarMascaraCelularCliente(celularInput), 100);
        }
        
        document.getElementById('clienteEmail').value = cliente.email || '';
        document.getElementById('clienteEndereco').value = cliente.endereco || '';
        document.getElementById('clienteEstado').value = cliente.estado || '';
        document.getElementById('clienteStatus').value = cliente.status || 'ativo';
        document.getElementById('clienteInscricaoEstadual').value = cliente.inscricao_estadual || '';
        document.getElementById('clienteObservacoes').value = cliente.observacoes || '';
        
        // Carregar cidades e depois selecionar a cidade do cliente
        if (cliente.estado) {
            carregarCidadesCliente().then(() => {
                document.getElementById('clienteCidade').value = cliente.cidade || '';
            });
        }
        
        clienteAtual = cliente;
    } else {
        // Modo novo
        titulo.innerHTML = '<i class="bi bi-person-plus me-2"></i>Novo Cliente';
        document.getElementById('clienteId').value = '';
        document.getElementById('clienteStatus').value = 'ativo';
        
        // Resetar selects de cidade
        document.getElementById('clienteCidade').innerHTML = '<option value="">Primeiro selecione o estado</option>';
        document.getElementById('clienteCidade').disabled = true;
        
        clienteAtual = null;
    }
    
    new bootstrap.Modal(modal).show();
}

async function salvarCliente() {
    console.log('💾 Salvando cliente...');
    
    const form = document.getElementById('formCliente');
    
    // Validar formulário
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    // Validar CPF/CNPJ e celular usando as novas funções
    const cpfCnpjInput = document.getElementById('clienteCpfCnpj');
    const celularInput = document.getElementById('clienteCelular');
    
    validarCpfCnpjCliente(cpfCnpjInput);
    validarCelularCliente(celularInput);
    
    // Verificar se há campos inválidos
    if (cpfCnpjInput.classList.contains('is-invalid') || celularInput.classList.contains('is-invalid')) {
        Swal.fire({
            icon: 'warning',
            title: 'Dados inválidos',
            text: 'Por favor, corrija os campos destacados em vermelho.',
            confirmButtonColor: '#4a7c59'
        });
        return;
    }
    
    // Coletar dados usando valores limpos para CPF/CNPJ e celular
    const dadosCliente = {
        nome: document.getElementById('clienteNome').value.trim(),
        cpf_cnpj: obterCpfCnpjLimpoCliente(), // Usar valor limpo (sem máscara)
        celular: obterCelularLimpoCliente(), // Usar valor limpo (sem máscara)
        email: document.getElementById('clienteEmail').value.trim() || null,
        endereco: document.getElementById('clienteEndereco').value.trim(),
        cidade: document.getElementById('clienteCidade').value.trim(),
        estado: document.getElementById('clienteEstado').value,
        status: document.getElementById('clienteStatus').value,
        inscricao_estadual: document.getElementById('clienteInscricaoEstadual').value.trim() || null,
        observacoes: document.getElementById('clienteObservacoes').value.trim() || null
    };
    
    console.log('📋 Dados do cliente (valores limpos):', dadosCliente);
    
    try {
        const clienteId = document.getElementById('clienteId').value;
        let resultado;
        
        if (clienteId) {
            // Atualizar cliente existente
            console.log('🔄 Atualizando cliente ID:', clienteId);
            resultado = await atualizarCliente(clienteId, dadosCliente);
        } else {
            // Criar novo cliente
            console.log('➕ Criando novo cliente');
            resultado = await criarCliente(dadosCliente);
        }
        
        if (resultado.success) {
            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
            
            // Mostrar sucesso
            Swal.fire({
                icon: 'success',
                title: clienteId ? 'Cliente Atualizado!' : 'Cliente Cadastrado!',
                text: clienteId ? 'As alterações foram salvas com sucesso.' : 'O cliente foi cadastrado com sucesso.',
                confirmButtonColor: '#4a7c59',
                timer: 2000
            });
            
            // Recarregar lista
            await carregarClientes();
            
        } else {
            throw new Error(resultado.error || 'Erro desconhecido');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao Salvar',
            text: error.message || 'Ocorreu um erro ao salvar o cliente.',
            confirmButtonColor: '#dc3545'
        });
    }
}

async function visualizarCliente(id) {
    console.log('👁️ Visualizando cliente ID:', id);
    
    try {
        // Buscar dados do cliente
        const { data: cliente, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !cliente) {
            throw new Error('Cliente não encontrado');
        }
        
        // Montar HTML dos detalhes
        const detalhesHtml = `
            <div class="row">
                <div class="col-md-8">
                    <h4 class="text-primary">${cliente.nome}</h4>
                </div>
                <div class="col-md-4">
                    <span class="badge ${cliente.status === 'ativo' ? 'bg-success' : 'bg-secondary'} fs-6">
                        ${cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>
            
            <hr>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong><i class="bi bi-card-text me-2"></i>CPF/CNPJ:</strong><br>
                    <code class="bg-light px-2 py-1 rounded">${cliente.cpf_cnpj}</code>
                </div>
                <div class="col-md-6">
                    <strong><i class="bi bi-telephone me-2"></i>Telefone:</strong><br>
                    <a href="tel:${cliente.celular}" class="text-decoration-none">${cliente.celular}</a>
                </div>
            </div>
            
            ${cliente.email ? `
            <div class="row mb-3">
                <div class="col-12">
                    <strong><i class="bi bi-envelope me-2"></i>E-mail:</strong><br>
                    <a href="mailto:${cliente.email}" class="text-decoration-none">${cliente.email}</a>
                </div>
            </div>
            ` : ''}
            
            <div class="row mb-3">
                <div class="col-12">
                    <strong><i class="bi bi-geo-alt me-2"></i>Endereço:</strong><br>
                    ${cliente.endereco}<br>
                    <small class="text-muted">${cliente.cidade}/${cliente.estado}</small>
                </div>
            </div>
            
            ${cliente.inscricao_estadual ? `
            <div class="row mb-3">
                <div class="col-12">
                    <strong><i class="bi bi-building me-2"></i>Inscrição Estadual:</strong><br>
                    <code class="bg-light px-2 py-1 rounded">${cliente.inscricao_estadual}</code>
                </div>
            </div>
            ` : ''}
            
            ${cliente.observacoes ? `
            <div class="row mb-3">
                <div class="col-12">
                    <strong><i class="bi bi-chat-left-text me-2"></i>Observações:</strong><br>
                    <div class="bg-light p-3 rounded">${cliente.observacoes}</div>
                </div>
            </div>
            ` : ''}
            
            <div class="row">
                <div class="col-12">
                    <small class="text-muted">
                        <i class="bi bi-calendar me-1"></i>
                        Cadastrado em: ${new Date(cliente.data_cadastro).toLocaleString('pt-BR')}
                    </small>
                </div>
            </div>
        `;
        
        document.getElementById('detalhesCliente').innerHTML = detalhesHtml;
        clienteAtual = cliente;
        
        new bootstrap.Modal(document.getElementById('modalVisualizarCliente')).show();
        
    } catch (error) {
        console.error('❌ Erro ao visualizar cliente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar os dados do cliente.',
            confirmButtonColor: '#dc3545'
        });
    }
}

async function editarCliente(id) {
    console.log('✏️ Editando cliente ID:', id);
    
    try {
        // Buscar dados do cliente
        const { data: cliente, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !cliente) {
            throw new Error('Cliente não encontrado');
        }
        
        // Abrir modal em modo edição
        abrirModalCliente(cliente);
        
    } catch (error) {
        console.error('❌ Erro ao buscar cliente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar os dados do cliente.',
            confirmButtonColor: '#dc3545'
        });
    }
}

function editarClienteAtual() {
    if (clienteAtual) {
        // Fechar modal de visualização
        bootstrap.Modal.getInstance(document.getElementById('modalVisualizarCliente')).hide();
        
        // Abrir modal de edição
        setTimeout(() => {
            abrirModalCliente(clienteAtual);
        }, 300);
    }
}

async function excluirCliente(id) {
    console.log('🗑️ Excluindo cliente ID:', id);
    
    try {
        // Buscar nome do cliente para confirmação
        const { data: cliente, error: errorBusca } = await supabaseClient
            .from('clientes')
            .select('nome')
            .eq('id', id)
            .single();
        
        if (errorBusca || !cliente) {
            throw new Error('Cliente não encontrado');
        }
        
        // Confirmar exclusão
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Confirmar Exclusão',
            html: `Deseja realmente excluir o cliente:<br><strong>${cliente.nome}</strong>?<br><br><small class="text-muted">Esta ação não pode ser desfeita.</small>`,
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d'
        });
        
        if (!result.isConfirmed) {
            return;
        }
        
        // Excluir cliente
        const { error: errorExclusao } = await supabaseClient
            .from('clientes')
            .delete()
            .eq('id', id);
        
        if (errorExclusao) {
            throw new Error(errorExclusao.message);
        }
        
        // Mostrar sucesso
        Swal.fire({
            icon: 'success',
            title: 'Cliente Excluído!',
            text: 'O cliente foi removido com sucesso.',
            confirmButtonColor: '#4a7c59',
            timer: 2000
        });
        
        // Recarregar lista
        await carregarClientes();
        
    } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao Excluir',
            text: error.message || 'Ocorreu um erro ao excluir o cliente.',
            confirmButtonColor: '#dc3545'
        });
    }
}

async function exportarClientes() {
    console.log('📥 Exportando clientes em PDF...');
    try {
        // Buscar todos os clientes
        const { data: clientes, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        if (!clientes || clientes.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Nenhum Cliente',
                text: 'Não há clientes para exportar.',
                confirmButtonColor: '#4a7c59'
            });
            return;
        }

        // Montar dados para o PDF (apenas colunas visíveis na tela LG+)
        const cabecalho = [
            'Nome', 'CPF/CNPJ', 'Telefone', 'Cidade/Estado', 'Status', 'Cadastro'
        ];
        const linhas = clientes.map(cliente => [
            cliente.nome,
            cliente.cpf_cnpj,
            cliente.celular,
            `${cliente.cidade}/${cliente.estado}`,
            cliente.status === 'ativo' ? 'Ativo' : 'Inativo',
            new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')
        ]);

        // Gerar PDF com jsPDF e autoTable
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Lista de Clientes', 14, 14);
        doc.autoTable({
            head: [cabecalho],
            body: linhas,
            startY: 20,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [74, 124, 89] },
            margin: { left: 10, right: 10 }
        });
        doc.save(`clientes-soma-${new Date().toISOString().split('T')[0]}.pdf`);

        Swal.fire({
            icon: 'success',
            title: 'Exportação PDF Concluída!',
            text: `${clientes.length} clientes exportados em PDF com sucesso.`,
            confirmButtonColor: '#4a7c59',
            timer: 2000
        });
    } catch (error) {
        console.error('❌ Erro ao exportar PDF:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro na Exportação',
            text: error.message || 'Ocorreu um erro ao exportar os clientes.',
            confirmButtonColor: '#dc3545'
        });
    }
}

// Carregar cidades baseado no estado selecionado usando API do IBGE
async function carregarCidadesCliente() {
    const selectEstado = document.getElementById('clienteEstado');
    const selectCidade = document.getElementById('clienteCidade');
    const estadoSelecionado = selectEstado.value;

    console.log('Carregando cidades para estado:', estadoSelecionado);

    // Limpar cidades e mostrar loading
    selectCidade.innerHTML = '<option value="">Carregando cidades...</option>';
    selectCidade.disabled = true;
    selectCidade.classList.add('select-loading');
    
    if (!estadoSelecionado) {
        selectCidade.innerHTML = '<option value="">Primeiro selecione o estado</option>';
        selectCidade.classList.remove('select-loading');
        return;
    }

    try {
        console.log('Fazendo requisição para API do IBGE...');
        
        // Fazer requisição para API do IBGE
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const municipios = await response.json();
        console.log(`Recebidas ${municipios.length} cidades`);
        
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
        
        // Habilitar select e remover loading
        selectCidade.disabled = false;
        selectCidade.classList.remove('select-loading');
        console.log('Cidades carregadas com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar cidades:', error);
        selectCidade.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        selectCidade.classList.remove('select-loading');
        
        // Mostrar toast de erro
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Erro ao carregar cidades',
            text: 'Verifique sua conexão com a internet',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Função para formatar CPF/CNPJ para exibição
function formatarCpfCnpjParaExibicao(cpfCnpj) {
    if (!cpfCnpj) return '';
    
    const valor = cpfCnpj.replace(/\D/g, '');
    
    if (valor.length === 11) {
        // CPF: 000.000.000-00
        return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (valor.length === 14) {
        // CNPJ: 00.000.000/0000-00
        return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cpfCnpj; // Retorna o valor original se não conseguir formatar
}

// Função para formatar celular para exibição
function formatarCelularParaExibicao(celular) {
    if (!celular) return '';
    
    const valor = celular.replace(/\D/g, '');
    
    if (valor.length === 11) {
        // Celular: (00) 00000-0000
        return valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (valor.length === 10) {
        // Telefone fixo: (00) 0000-0000
        return valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return celular; // Retorna o valor original se não conseguir formatar
}

// Função de teste para as máscaras de clientes
window.testarMascarasClientes = function() {
    console.log('🎭 Testando máscaras de clientes...');
    
    const cpfInput = document.getElementById('clienteCpfCnpj');
    const celularInput = document.getElementById('clienteCelular');
    
    if (!cpfInput || !celularInput) {
        Swal.fire({
            icon: 'warning',
            title: 'Modal não aberto',
            text: 'Abra o modal de cadastro/edição de cliente primeiro.',
            confirmButtonColor: '#4a7c59'
        });
        return;
    }
    
    console.log('🧪 Testando CPF...');
    cpfInput.value = '12345678901';
    aplicarMascaraCpfCnpjCliente(cpfInput);
    console.log('CPF formatado:', cpfInput.value);
    
    setTimeout(() => {
        console.log('🧪 Testando CNPJ...');
        cpfInput.value = '12345678000195';
        aplicarMascaraCpfCnpjCliente(cpfInput);
        console.log('CNPJ formatado:', cpfInput.value);
        
        setTimeout(() => {
            console.log('🧪 Testando celular...');
            celularInput.value = '11987654321';
            aplicarMascaraCelularCliente(celularInput);
            console.log('Celular formatado:', celularInput.value);
            
            Swal.fire({
                icon: 'success',
                title: 'Teste de Máscaras Concluído!',
                html: `
                    <div class="text-start">
                        <p><strong>CPF:</strong> ${cpfInput.value}</p>
                        <p><strong>Celular:</strong> ${celularInput.value}</p>
                        <p class="mt-3 text-muted">Verifique o console para mais detalhes.</p>
                    </div>
                `,
                confirmButtonColor: '#4a7c59'
            });
        }, 1000);
    }, 1000);
};

// Função de demonstração das funcionalidades das máscaras
window.demonstrarMascaras = function() {
    console.log('🎬 Demonstração das máscaras de clientes');
    
    // Primeiro abrir o modal
    abrirModalCliente();
    
    // Aguardar um pouco e então executar os testes
    setTimeout(() => {
        testarMascarasClientes();
    }, 500);
};
