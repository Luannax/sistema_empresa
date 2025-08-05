// Dashboard Avançado com Estatísticas e Relatórios
let graficoVendasMensais;
let graficoProdutos;

document.addEventListener('DOMContentLoaded', async function() {    
    // Verificar se usuário está logado usando AuthManager
    let usuario;
    try {
        if (window.AuthManager && typeof window.AuthManager.verificarAutenticacao === 'function') {
            usuario = await window.AuthManager.verificarAutenticacao();
            console.log('👤 Usuario autenticado:', usuario);
        } else {
            console.log('AuthManager não disponível, usando usuário de teste');
            // Para desenvolvimento - simular usuário admin
            usuario = { nome: 'Admin', prioridade: 'ADM' };
        }
    } catch (error) {
        console.error('Erro na autenticação:', error);
        // Para desenvolvimento - simular usuário admin
        usuario = { nome: 'Admin', prioridade: 'ADM' };
    }
    
    if (!usuario) {
        console.log('Usuario não autenticado');
        return;
    }

    // Verificar se o usuário é administrador
    if (usuario.prioridade !== 'ADM') {
        console.log('Usuario não é admin - redirecionando');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Acesso Restrito',
                text: 'Apenas administradores podem acessar o dashboard.',
                confirmButtonColor: '#4a7c59'
            }).then(() => {
                window.location.href = '/pages/pedido.html';
            });
        } else {
            window.location.href = '/pages/pedido.html';
        }
        return;
    }
        
    // Mostrar nome do usuário
    const nomeUsuarioElement = document.getElementById('nomeUsuario');
    if (nomeUsuarioElement) {
        nomeUsuarioElement.innerHTML = `<i class="bi bi-person-circle"></i> ${usuario.nome}`;
    }
    
    // Mostrar link de usuários se existir
    const linkUsuarios = document.getElementById('linkUsuarios');
    if (linkUsuarios) {
        linkUsuarios.classList.remove('d-none');
    }
        
    // Carregar dashboard completo
    inicializarDashboard();
});

// Função de teste direto
async function testeConexaoDireta() {
    console.log('🧪 === TESTE DE CONEXÃO DIRETA ===');
    
    try {
        // Teste 1: Verificar se supabaseClient existe
        if (typeof supabaseClient === 'undefined') {
            console.error('❌ supabaseClient não está definido!');
            return;
        }
        
        console.log('✅ supabaseClient existe');
        
        // Teste 2: Tentar uma consulta simples
        const { data, error, count } = await supabaseClient
            .from('usuarios')
            .select('*', { count: 'exact' })
            .limit(1);
        
        if (error) {
            console.error('❌ Erro na consulta:', error);
        } else {
            console.log('✅ Consulta funcionou! Usuários:', count);
            console.log('📊 Dados:', data);
        }
        
        // Teste 3: Tentar buscar pedidos
        const { data: pedidos, error: errorPedidos, count: countPedidos } = await supabaseClient
            .from('pedidos')
            .select('*', { count: 'exact' })
            .limit(1);
        
        if (errorPedidos) {
            console.error('❌ Erro ao buscar pedidos:', errorPedidos);
        } else {
            console.log('✅ Pedidos encontrados:', countPedidos);
            console.log('📊 Dados pedidos:', pedidos);
        }
        
    } catch (error) {
        console.error('💥 Erro geral no teste:', error);
    }
    
    console.log('🔚 === FIM DO TESTE ===');
}

async function inicializarDashboard() {
    console.log('📊 Inicializando dashboard...');
    
    try {
        // Garantir que supabaseClient existe
        if (typeof supabaseClient === 'undefined') {
            console.error('❌ supabaseClient não definido!');
            return;
        }
        
        console.log('✅ supabaseClient encontrado, carregando dados...');
        
        // Carregar todos os dados
        await carregarEstatisticas();
        await carregarUltimosPedidos();
        await carregarGraficos();
        
        console.log('✅ Dashboard inicializado com sucesso');
        
    } catch (error) {
        console.error('💥 Erro ao inicializar dashboard:', error);
    }
}

async function carregarEstatisticas() {
    console.log('� Carregando estatísticas...');
    
    try {
        // 1. Total de pedidos
        const { count: totalPedidos, error: errorPedidos } = await supabaseClient
            .from('pedidos')
            .select('*', { count: 'exact', head: true });
        
        if (errorPedidos) {
            console.error('❌ Erro pedidos:', errorPedidos.message);
            document.getElementById('totalPedidos').textContent = 'Erro';
        } else {
            console.log('✅ Total pedidos:', totalPedidos || 0);
            document.getElementById('totalPedidos').textContent = totalPedidos || 0;
        }
        
        // 2. Total de clientes
        const { count: totalClientes, error: errorClientes } = await supabaseClient
            .from('clientes')
            .select('*', { count: 'exact', head: true });
        
        if (errorClientes) {
            console.error('❌ Erro clientes:', errorClientes.message);
            document.getElementById('clientesAtivos').textContent = 'Erro';
        } else {
            console.log('✅ Total clientes:', totalClientes || 0);
            document.getElementById('clientesAtivos').textContent = totalClientes || 0;
        }
        
        // 3. Faturamento total
        const { data: dadosFaturamento, error: errorFaturamento } = await supabaseClient
            .from('pedidos')
            .select('total');
        
        if (errorFaturamento) {
            console.error('❌ Erro faturamento:', errorFaturamento.message);
            document.getElementById('faturamentoTotal').textContent = 'Erro';
        } else {
            const faturamento = dadosFaturamento?.reduce((acc, p) => acc + (p.total || 0), 0) || 0;
            console.log('✅ Faturamento calculado: R$', faturamento.toFixed(2));
            document.getElementById('faturamentoTotal').textContent = formatarMoeda(faturamento);
        }
        
        // 4. Vendas do mês
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        
        const { count: vendasMes, error: errorVendasMes } = await supabaseClient
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .gte('data_pedido', inicioMes.toISOString());
        
        if (errorVendasMes) {
            console.error('❌ Erro vendas mês:', errorVendasMes.message);
            document.getElementById('vendasMes').textContent = 'Erro';
        } else {
            console.log('✅ Vendas do mês:', vendasMes || 0);
            document.getElementById('vendasMes').textContent = vendasMes || 0;
        }
        
        // Animação nos números
        animarNumeros();
        
    } catch (error) {
        console.error('💥 Erro ao carregar estatísticas:', error);
        document.getElementById('totalPedidos').textContent = 'Erro';
        document.getElementById('faturamentoTotal').textContent = 'Erro';
        document.getElementById('clientesAtivos').textContent = 'Erro';
        document.getElementById('vendasMes').textContent = 'Erro';
    }
}

async function carregarGraficos() {
    try {
        const dadosGraficos = await obterDadosGraficos();
        
        if (dadosGraficos.success) {
            criarGraficoVendas(dadosGraficos.vendas);
            criarGraficoProdutos(dadosGraficos.produtos);
        }
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
        // Criar gráficos com dados de exemplo
        criarGraficoVendas([]);
        criarGraficoProdutos([]);
    }
}

function criarGraficoVendas(dados) {
    const ctx = document.getElementById('graficoVendas').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (graficoVendasMensais) {
        graficoVendasMensais.destroy();
    }
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Dados de exemplo se não houver dados reais
    const vendas = dados.length > 0 ? dados : [
        12000, 15000, 18000, 22000, 25000, 28000,
        30000, 27000, 24000, 26000, 29000, 32000
    ];
    
    graficoVendasMensais = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Vendas (R$)',
                data: vendas,
                borderColor: '#4a7c59',
                backgroundColor: 'rgba(74, 124, 89, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoProdutos(dados) {
    const ctx = document.getElementById('graficoProdutos').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (graficoProdutos) {
        graficoProdutos.destroy();
    }
    
    // Dados de exemplo se não houver dados reais
    const produtos = dados.length > 0 ? dados : [
        { nome: 'Sementes de Capim', vendas: 45 },
        { nome: 'Fertilizantes', vendas: 30 },
        { nome: 'Defensivos', vendas: 15 },
        { nome: 'Outros', vendas: 10 }
    ];
    
    graficoProdutos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: produtos.map(p => p.nome),
            datasets: [{
                data: produtos.map(p => p.vendas),
                backgroundColor: [
                    '#4a7c59',
                    '#6b8e6b',
                    '#28a745',
                    '#20c997'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function carregarUltimosPedidos() {
    console.log('� Carregando últimos pedidos...');
    
    try {
        const { data: pedidos, error: errorUltimosPedidos } = await supabaseClient
            .from('pedidos')
            .select('id, data_pedido, total, vendedor, cliente_id')
            .order('data_pedido', { ascending: false })
            .limit(10);
        
        const tbody = document.getElementById('ultimosPedidos');
        
        if (errorUltimosPedidos) {
            console.error('❌ Erro últimos pedidos:', errorUltimosPedidos.message);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Erro ao carregar pedidos</td></tr>';
            return;
        }
        
        if (pedidos && pedidos.length > 0) {
            console.log('✅ Pedidos encontrados:', pedidos.length);
            
            // Buscar nomes dos clientes
            const clientesIds = [...new Set(pedidos.map(p => p.cliente_id).filter(id => id))];
            let clientesMap = {};
            
            if (clientesIds.length > 0) {
                const { data: clientes } = await supabaseClient
                    .from('clientes')
                    .select('id, nome')
                    .in('id', clientesIds);
                
                clientesMap = clientes?.reduce((acc, c) => ({ ...acc, [c.id]: c.nome }), {}) || {};
                console.log('👥 Clientes carregados:', Object.keys(clientesMap).length);
            }
            
            const html = pedidos.map(p => `
                <tr>
                    <td>${clientesMap[p.cliente_id] || 'Cliente não encontrado'}</td>
                    <td>${formatarData(p.data_pedido)}</td>
                    <td>${formatarMoeda(p.total || 0)}</td>
                    <td class="d-none d-sm-table-cell"><span class="badge bg-success">Concluída</span></td>
                </tr>
            `).join('');
            
            tbody.innerHTML = html;
        } else {
            console.log('ℹ️ Nenhum pedido encontrado');
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum pedido encontrado</td></tr>';
        }
        
    } catch (error) {
        console.error('💥 Erro ao carregar últimos pedidos:', error);
        document.getElementById('ultimosPedidos').innerHTML = 
            `<tr><td colspan="4" class="text-center text-muted">Erro: ${error.message}</td></tr>`;
    }
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
            const dataURL = canvas.toDataURL('/img/logosoma.png');
            resolve(dataURL);
        };
        img.onerror = function() {
            reject(new Error('Não foi possível carregar a imagem'));
        };
        img.src = src;
    });
}

// Função para gerar relatório PDF
async function gerarRelatorioPDF() {
    try {
        Swal.fire({
            title: 'Gerando Relatório Dashboard...',
            text: 'Por favor, aguarde enquanto o relatório é gerado.',
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
        
        // ===== CABEÇALHO CORPORATIVO =====
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
        
        // Texto do cabeçalho (ajustado para dar espaço à logo)
        currentY += 8;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('EMPRESA Y', margin + 28, currentY);
        currentY += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('EMPRESA Y LTDA', margin + 28, currentY);
        currentY += 5;
        doc.text('Rod MT Y N° Y-S Y. Y Cep:00.000.000 Arenápolis MT Fone: 00000-0000', margin + 28, currentY);
        
        // ===== TÍTULO DO RELATÓRIO =====
        currentY += 20;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('RELATÓRIO DASHBOARD - ESTATÍSTICAS GERAIS', pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Data e hora atual
        const agora = new Date();
        const dataHora = agora.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Gerado em: ${dataHora}`, pageWidth / 2, currentY, { align: 'center' });
        
        // ===== ESTATÍSTICAS PRINCIPAIS =====
        currentY += 20;
        
        // Linha separadora
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ESTATÍSTICAS PRINCIPAIS', margin, currentY);
        currentY += 15;
        
        // Obter estatísticas
        const stats = await obterEstatisticas();
        
        if (stats.success) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            // Criar caixas para as estatísticas
            const boxWidth = (pageWidth - 2 * margin - 10) / 2;
            const boxHeight = 20;
            
            // Total de Pedidos
            doc.setFillColor(74, 124, 89, 0.1);
            doc.rect(margin, currentY, boxWidth, boxHeight, 'F');
            doc.setDrawColor(74, 124, 89);
            doc.rect(margin, currentY, boxWidth, boxHeight);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL DE PEDIDOS', margin + 5, currentY + 8);
            doc.setFontSize(16);
            doc.text((stats.data.totalPedidos || 0).toString(), margin + 5, currentY + 16);
            
            // Faturamento Total
            doc.setFillColor(40, 167, 69, 0.1);
            doc.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight, 'F');
            doc.setDrawColor(40, 167, 69);
            doc.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('FATURAMENTO TOTAL', margin + boxWidth + 15, currentY + 8);
            doc.setFontSize(14);
            doc.text(formatarMoeda(stats.data.faturamentoTotal || 0), margin + boxWidth + 15, currentY + 16);
            
            currentY += 30;
            
            // Clientes Ativos
            doc.setFillColor(23, 162, 184, 0.1);
            doc.rect(margin, currentY, boxWidth, boxHeight, 'F');
            doc.setDrawColor(23, 162, 184);
            doc.rect(margin, currentY, boxWidth, boxHeight);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('CLIENTES ATIVOS', margin + 5, currentY + 8);
            doc.setFontSize(16);
            doc.text((stats.data.clientesAtivos || 0).toString(), margin + 5, currentY + 16);
            
            // Vendas Este Mês
            doc.setFillColor(255, 193, 7, 0.1);
            doc.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight, 'F');
            doc.setDrawColor(255, 193, 7);
            doc.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('VENDAS ESTE MÊS', margin + boxWidth + 15, currentY + 8);
            doc.setFontSize(16);
            doc.text((stats.data.vendasMes || 0).toString(), margin + boxWidth + 15, currentY + 16);
        }
        
        // ===== ÚLTIMOS PEDIDOS =====
        currentY += 40;
        
        // Linha separadora
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ÚLTIMOS PEDIDOS', margin, currentY);
        currentY += 15;
        
        // Cabeçalho da tabela
        doc.setFillColor(74, 124, 89);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        doc.text('CLIENTE', margin + 5, currentY + 5);
        doc.text('DATA', margin + 70, currentY + 5);
        doc.text('VALOR', margin + 110, currentY + 5);
        doc.text('STATUS', margin + 150, currentY + 5);
        
        currentY += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Dados dos pedidos
        const pedidos = await obterUltimosPedidos();
        if (pedidos.success && pedidos.data.length > 0) {
            pedidos.data.slice(0, 15).forEach((pedido, index) => {
                // Verificar se precisa de nova página
                if (currentY > pageHeight - 30) {
                    doc.addPage();
                    currentY = margin;
                }
                
                // Linha alternada de fundo
                if (index % 2 === 0) {
                    doc.setFillColor(248, 249, 250);
                    doc.rect(margin, currentY - 3, pageWidth - 2 * margin, 8, 'F');
                }
                
                doc.setFontSize(8);
                doc.text(pedido.cliente.substring(0, 25), margin + 5, currentY + 2);
                doc.text(formatarData(pedido.data), margin + 70, currentY + 2);
                doc.text(formatarMoeda(pedido.valor), margin + 110, currentY + 2);
                
                // Status colorido
                const statusColor = obterCorStatus(pedido.status);
                doc.setFillColor(statusColor.r, statusColor.g, statusColor.b, 0.2);
                doc.rect(margin + 148, currentY - 2, 30, 6, 'F');
                doc.setDrawColor(statusColor.r, statusColor.g, statusColor.b);
                doc.rect(margin + 148, currentY - 2, 30, 6);
                doc.text(pedido.status, margin + 152, currentY + 2);
                
                currentY += 8;
            });
        } else {
            doc.setFontSize(10);
            doc.text('Nenhum pedido encontrado', margin + 5, currentY + 5);
        }
        
        // ===== RODAPÉ =====
        currentY = pageHeight - 20;
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('EMPRESA Y - Sistema de Gestão Comercial', margin, currentY);
        doc.text(`Página 1 de 1 - Gerado em ${dataHora}`, pageWidth - margin, currentY, { align: 'right' });
        
        // Salvar PDF
        const nomeArquivo = `dashboard-empresaY-${agora.toISOString().split('T')[0]}.pdf`;
        doc.save(nomeArquivo);
        
        Swal.fire({
            icon: 'success',
            title: 'Relatório Dashboard Gerado!',
            text: 'O relatório foi gerado e baixado com sucesso.',
            confirmButtonColor: '#4a7c59'
        });
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao gerar relatório',
            text: 'Ocorreu um erro ao gerar o relatório PDF.',
            confirmButtonColor: '#4a7c59'
        });
    }
}

// Função para realizar backup
async function realizarBackup() {
    try {
        const resultado = await Swal.fire({
            title: 'Realizar Backup?',
            text: 'Deseja realizar o backup dos dados do sistema?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4a7c59',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Sim, fazer backup',
            cancelButtonText: 'Cancelar'
        });
        
        if (resultado.isConfirmed) {
            Swal.fire({
                title: 'Realizando Backup...',
                text: 'Por favor, aguarde enquanto o backup é criado.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Obter todos os dados
            const dadosBackup = await obterDadosCompletos();
            
            if (dadosBackup.success) {
                // Criar arquivo JSON com os dados
                const backup = {
                    versao: '1.0',
                    data: new Date().toISOString(),
                    dados: dadosBackup.data
                };
                
                const dataStr = JSON.stringify(backup, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                
                // Criar link para download
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `backup-empresa-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Backup Realizado!',
                    text: 'O backup foi criado e baixado com sucesso.',
                    confirmButtonColor: '#4a7c59'
                });
            } else {
                throw new Error('Erro ao obter dados para backup');
            }
        }
        
    } catch (error) {
        console.error('Erro ao realizar backup:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro no Backup',
            text: 'Ocorreu um erro ao realizar o backup dos dados.',
            confirmButtonColor: '#4a7c59'
        });
    }
}

// Funções auxiliares
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function obterClasseStatus(status) {
    switch (status) {
        case 'Entregue': return 'bg-success';
        case 'Pendente': return 'bg-warning';
        case 'Cancelado': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function obterCorStatus(status) {
    switch (status) {
        case 'Entregue': return { r: 40, g: 167, b: 69 };   // Verde
        case 'Pendente': return { r: 255, g: 193, b: 7 };   // Amarelo
        case 'Cancelado': return { r: 220, g: 53, b: 69 };  // Vermelho
        default: return { r: 108, g: 117, b: 125 };         // Cinza
    }
}

function animarNumeros() {
    const elementos = ['totalPedidos', 'clientesAtivos', 'vendasMes'];
    
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        const valor = parseInt(elemento.textContent);
        
        if (valor > 0) {
            let contador = 0;
            const incremento = valor / 50;
            
            const timer = setInterval(() => {
                contador += incremento;
                if (contador >= valor) {
                    elemento.textContent = valor;
                    clearInterval(timer);
                } else {
                    elemento.textContent = Math.floor(contador);
                }
            }, 20);
        }
    });
}

function mostrarLoading() {
    // Implementar loading se necessário
}

function ocultarLoading() {
    // Implementar loading se necessário
}
