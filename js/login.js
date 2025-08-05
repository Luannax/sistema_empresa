// Sistema de Login para SOMA - Apenas banco de dados
document.addEventListener('DOMContentLoaded', function() {
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    
    if (isLoginPage) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                realizarLogin();
            });
        }
        
        console.log('🔐 Sistema de login carregado - pronto para uso');
    }
});

async function verificarSeJaEstaLogado() {
    // Aguardar AuthManager estar disponível
    let tentativas = 0;
    while (!window.AuthManager && tentativas < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        tentativas++;
    }
    
    try {
        if (!window.AuthManager) {
            console.log('AuthManager não disponível, continuando com login');
            return;
        }
        
        const usuario = await window.AuthManager.obterUsuarioAtual();
        
        if (usuario) {
            console.log('✅ Usuário já logado encontrado, redirecionando...');
            // Redirecionar baseado na prioridade do usuário
            if (usuario.prioridade === 'ADM') {
                window.location.href = 'pages/dashboard.html'; // Sem a barra inicial
            } else {
                window.location.href = 'pages/pedido.html'; // Sem a barra inicial
            }
        } else {
            console.log('💡 Nenhum usuário logado, permanecendo na tela de login');
        }
    } catch (error) {
        console.log('Nenhuma sessão ativa encontrada:', error);
        // NÃO redirecionar em caso de erro
    }
}

// ========== LOGIN ==========
async function realizarLogin() {
    const nomeUsuario = document.getElementById('username').value;
    const senha = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.loading-spinner');
    
    // Validação básica
    if (!nomeUsuario || !senha) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos obrigatórios',
            text: 'Por favor, preencha usuário e senha.',
            confirmButtonColor: '#4a7c59'
        });
        return;
    }
    
    // Mostrar loading
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {        
        // Usar AuthManager para buscar usuário
        const usuario = await window.AuthManager.buscarUsuarioPorCredenciais(nomeUsuario, senha);
        
        if (!usuario) {
            console.log('❌ Login inválido');
            // Login inválido
            Swal.fire({
                icon: 'error',
                title: 'Erro no login',
                text: 'Usuário ou senha incorretos, ou usuário inativo!',
                confirmButtonColor: '#dc3545'
            });
            
            // Restaurar botão
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
            
            // Limpar senha
            document.getElementById('password').value = '';
            return;
        }
        
        console.log('✅ Usuário encontrado:', usuario);
        
        // Login bem-sucedido - atualizar último login
        await window.AuthManager.atualizarUltimoLogin(usuario.id);
        
        // Tentar criar sessão com Supabase Auth se email existir
        if (usuario.email) {
            try {
                await supabaseClient.auth.signInWithPassword({
                    email: usuario.email,
                    password: senha
                });
                console.log('✅ Sessão Supabase Auth criada');
            } catch (authError) {
                console.log('Auth não configurado, continuando sem sessão auth:', authError);
            }
        }
        
        // Mostrar sucesso e redirecionar baseado no tipo de usuário
        Swal.fire({
            icon: 'success',
            title: 'Login realizado!',
            text: `Bem-vindo, ${usuario.nome}!`,
            timer: 1500,
            showConfirmButton: false,
            confirmButtonColor: '#4a7c59'
        }).then(() => {
            // Redirecionar baseado na prioridade do usuário
            if (usuario.prioridade === 'ADM') {
                window.location.href = 'pages/dashboard.html'; // Sem a barra inicial
            } else {
                window.location.href = 'pages/pedido.html'; // Sem a barra inicial
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao realizar login:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Erro no sistema',
            text: 'Não foi possível conectar ao banco de dados. Tente novamente.',
            confirmButtonColor: '#dc3545'
        });
        
        // Restaurar botão
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}