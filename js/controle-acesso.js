// Controle de acesso simplificado (sem loops)
(function() {
    'use strict';

    // Função principal que verifica se o usuário está logado
    async function verificarAcesso() {
        try {
            // Aguardar AuthManager estar disponível
            let tentativas = 0;
            while (!window.AuthManager && tentativas < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                tentativas++;
            }

            if (!window.AuthManager) {
                console.error('AuthManager não encontrado - redirecionando para login');
                window.location.href = '../index.html';
                return;
            }

            // Verificar se usuário está logado
            const usuario = await window.AuthManager.obterUsuarioAtual();
            
            if (!usuario) {
                console.log('Usuário não logado - redirecionando para login');
                window.location.href = '../index.html';
                return;
            }

            // Atualizar navbar com informações do usuário
            const userNameElement = document.getElementById('userName');
            const userTypeElement = document.getElementById('userType');
            
            if (userNameElement) {
                userNameElement.textContent = usuario.nome;
            }
            
            if (userTypeElement) {
                userTypeElement.textContent = usuario.prioridade === 'ADM' ? 'Administrador' : 'Vendedor';
            }

            // Verificar permissões específicas da página
            verificarPermissoesPagina(usuario);

        } catch (error) {
            console.error('Erro na verificação de acesso:', error);
            // Em caso de erro, redirecionar para login
            window.location.href = '../index.html';
        }
    }

    // Verificar permissões específicas baseadas na página atual
    function verificarPermissoesPagina(usuario) {
        const paginaAtual = window.location.pathname;
        
        // Páginas que requerem privilégios de administrador
        const paginasAdmin = ['dashboard.html', 'clientes.html', 'usuarios.html', 'fornecedores.html'];
        
        const precisaAdmin = paginasAdmin.some(pagina => paginaAtual.includes(pagina));
        
        if (precisaAdmin && usuario.prioridade !== 'ADM') {
            Swal.fire({
                icon: 'error',
                title: 'Acesso Negado',
                text: 'Você não tem permissão para acessar esta página.',
                confirmButtonColor: '#dc3545'
            }).then(() => {
                // Redirecionar vendedor para página de pedidos
                window.location.href = 'pedido.html';
            });
            return;
        }
    }

    // Função de logout
    window.realizarLogout = async function() {
        try {
            const confirmacao = await Swal.fire({
                icon: 'question',
                title: 'Sair do Sistema',
                text: 'Deseja realmente fazer logout?',
                showCancelButton: true,
                confirmButtonText: 'Sim, sair',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d'
            });

            if (confirmacao.isConfirmed) {
                if (window.AuthManager) {
                    await window.AuthManager.realizarLogout();
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Logout realizado!',
                    text: 'Até logo!',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '../index.html';
                });
            }
        } catch (error) {
            console.error('Erro no logout:', error);
            // Forçar redirecionamento mesmo com erro
            window.location.href = '../index.html';
        }
    };

    // Executar verificação quando a página carrega
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verificarAcesso);
    } else {
        verificarAcesso();
    }
})();
