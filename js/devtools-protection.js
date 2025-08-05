// ============================================
// SOMA - Proteção contra DevTools
// ============================================

(function() {
    'use strict';
    
    // Detectar ambiente de produção
    function isProductionEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Considerar produção se:
        // 1. Tem domínio personalizado (ex: soma-sistema.vercel.app)
        // 2. Usa HTTPS
        // 3. Não é localhost nem IP local
        const isCustomDomain = !hostname.includes('localhost') && 
                              !hostname.includes('127.0.0.1') && 
                              !hostname.includes('192.168.') &&
                              !hostname.includes('file://') &&
                              hostname !== '';
        
        const isHTTPS = protocol === 'https:';
        
        // Lista de domínios de produção conhecidos
        const productionDomains = [
            'soma-sistema.vercel.app',
            'soma-agro.com.br',
            'sistema-soma.com'
            // Adicione outros domínios de produção aqui
        ];
        
        const isKnownProduction = productionDomains.some(domain => 
            hostname.includes(domain)
        );
        
        const isProduction = isKnownProduction || (isCustomDomain && isHTTPS);
        
        console.log('🌍 Detecção de Ambiente:', {
            hostname: hostname,
            protocol: protocol,
            isCustomDomain: isCustomDomain,
            isHTTPS: isHTTPS,
            isKnownProduction: isKnownProduction,
            isProduction: isProduction
        });
        
        return isProduction;
    }
    
    const isProduction = isProductionEnvironment();
    
    // Apenas aplicar proteções em produção
    if (!isProduction) {
        console.log('🛠️ Ambiente de desenvolvimento detectado. Proteções DevTools desabilitadas.');
        console.log('📱 DevTools liberado para responsividade e debugging.');
        return; // Não aplicar nenhuma proteção
    }
    
    console.log('🔒 Ambiente de produção detectado. Aplicando proteções de segurança.');
    
    // Detectar se DevTools está aberto
    let devtools = {
        open: false,
        orientation: null
    };
    
    // Método de detecção baseado em timing
    setInterval(function() {
        const before = Date.now();
        debugger; // Esta linha causa pause se DevTools estiver aberto
        const after = Date.now();
        
        if (after - before > 100) {
            devtools.open = true;
            handleDevToolsOpen();
        } else {
            devtools.open = false;
        }
    }, 1000);
    
    // Detectar através do console
    let element = document.createElement('div');
    Object.defineProperty(element, 'id', {
        get: function() {
            devtools.open = true;
            handleDevToolsOpen();
        }
    });
    
    setInterval(function() {
        console.clear();
        console.log(element);
    }, 2000);
    
    // Ação quando DevTools for detectado
    function handleDevToolsOpen() {
        // Limpar dados sensíveis
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirecionar para página de aviso
        window.location.href = '/';
        
        // Mostrar aviso
        document.body.innerHTML = `
            <div style="
                position: fixed; 
                top: 0; left: 0; 
                width: 100%; height: 100%; 
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d); 
                color: #fff; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                z-index: 999999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div style="text-align: center; max-width: 500px; padding: 40px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
                    <h1 style="color: #ff6b6b; margin-bottom: 20px;">ACESSO RESTRITO</h1>
                    <p style="font-size: 1.2rem; margin-bottom: 15px;">
                        Esta aplicação contém dados confidenciais de clientes.
                    </p>
                    <p style="margin-bottom: 30px;">
                        O acesso às ferramentas de desenvolvimento não é permitido por questões de segurança.
                    </p>
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 0.9rem; opacity: 0.8;">
                            <strong>SOMA AGRO SEMENTES</strong><br>
                            Sistema de Gestão Empresarial
                        </p>
                    </div>
                    <button onclick="window.location.reload()" style="
                        background: linear-gradient(135deg, #4a7c59, #6b8e6b);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        Recarregar Página
                    </button>
                </div>
            </div>
        `;
    }
    
    // Desabilitar contexto (botão direito)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Desabilitar teclas de debug
    document.addEventListener('keydown', function(e) {
        // F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U
        if (e.keyCode === 123 || 
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 67)) ||
            (e.ctrlKey && e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }
    });
    
    // Limpar console periodicamente
    setInterval(function() {
        console.clear();
    }, 3000);
    
    // Proteger contra inspecionar elemento
    window.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    window.devtools = devtools;
})();
