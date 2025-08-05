// ============================================
// SOMA - Sistema de Segurança
// ⚠️  CONFIDENCIAL - Módulo de Proteção
// ============================================

(function() {
    'use strict';

    // ========== CONFIGURAÇÃO DE SEGURANÇA ==========
    
    // Detectar ambiente
    function isDevEnvironment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' ||
               hostname.includes('192.168.') ||
               hostname.includes('file://') ||
               window.location.protocol === 'file:';
    }
    
    function isProductionEnvironment() {
        const hostname = window.location.hostname;
        
        // Lista de domínios de produção
        const productionDomains = [
            'soma-sistema.vercel.app',
            'soma-agro.com.br',
            'sistema-soma.com'
        ];
        
        return productionDomains.some(domain => hostname.includes(domain)) ||
               (window.location.protocol === 'https:' && !isDevEnvironment());
    }

    // Detectar dispositivo móvel
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768 && 'ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    // ========== INICIALIZAÇÃO SEGURA ==========
    
    const isMobile = isMobileDevice();
    const isDev = isDevEnvironment();
    const isProduction = isProductionEnvironment();

    // Logs condicionais (apenas em desenvolvimento)
    if (isDev) {
        console.log('🔒 SOMA Security System');
        console.log('📱 Mobile Device:', isMobile);
        console.log('🛠️ Development Mode:', isDev);
        console.log('🌍 Production Mode:', isProduction);
        console.log('🔓 DevTools protection:', isProduction ? 'ENABLED' : 'DISABLED');
    }
    console.log('🛠️ Development Environment:', isDev);

    // Se for desenvolvimento, apenas loggar e sair
    if (isDev) {
        console.log('⚠️ Proteções desabilitadas em ambiente de desenvolvimento');
        return;
    }

    // ========== PROTEÇÕES PARA MOBILE ==========
    
    if (isMobile) {
        console.log('📱 Aplicando proteções para mobile');
        aplicarProtecoesMobile();
        return;
    }

    // ========== PROTEÇÕES PARA DESKTOP ==========
    
    console.log('🖥️ Aplicando proteções para desktop');
    aplicarProtecoesDesktop();

    // ========== FUNÇÕES DE PROTEÇÃO MOBILE ==========
    
    function aplicarProtecoesMobile() {
        // 1. Desabilitar menu de contexto (long press)
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        }, { passive: false });

        // 2. Desabilitar seleção de texto
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        document.body.style.userSelect = 'none';

        // 3. Desabilitar copy/paste
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            return false;
        });

        document.addEventListener('paste', function(e) {
            e.preventDefault();
            return false;
        });

        // 4. Proteger contra gestos de desenvolvedor
        let touchStartTime = 0;
        document.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
            
            // Desabilitar multi-touch (zoom, inspect)
            if (e.touches.length > 1) {
                e.preventDefault();
                return false;
            }
        }, { passive: false });

        document.addEventListener('touchend', function(e) {
            const touchDuration = Date.now() - touchStartTime;
            
            // Desabilitar long press (mais de 800ms)
            if (touchDuration > 800) {
                e.preventDefault();
                return false;
            }
        }, { passive: false });

        // 5. Proteger contra pinch zoom
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
            return false;
        });

        document.addEventListener('gesturechange', function(e) {
            e.preventDefault();
            return false;
        });

        document.addEventListener('gestureend', function(e) {
            e.preventDefault();
            return false;
        });

        // 6. Limpar console periodicamente (menos agressivo)
        setInterval(function() {
            try {
                console.clear();
            } catch(e) {}
        }, 30000); // 30 segundos

        console.log('✅ Proteções mobile ativadas');
    }

    // ========== FUNÇÕES DE PROTEÇÃO DESKTOP ==========
    
    function aplicarProtecoesDesktop() {
        // 1. Desabilitar menu de contexto
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            mostrarAvisoSeguranca('context_menu');
            return false;
        });

        // 2. Desabilitar teclas de desenvolvedor
        document.addEventListener('keydown', function(e) {
            // F12 - Developer Tools
            if (e.keyCode === 123) {
                e.preventDefault();
                mostrarAvisoSeguranca('f12_key');
                return false;
            }
            
            // Ctrl+Shift+I - Developer Tools
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
                e.preventDefault();
                mostrarAvisoSeguranca('dev_tools');
                return false;
            }
            
            // Ctrl+Shift+J - Console
            if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
                e.preventDefault();
                mostrarAvisoSeguranca('console');
                return false;
            }
            
            // Ctrl+U - View Source
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                mostrarAvisoSeguranca('view_source');
                return false;
            }
            
            // Ctrl+Shift+C - Select Element
            if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
                e.preventDefault();
                mostrarAvisoSeguranca('inspect_element');
                return false;
            }
            
            // Ctrl+S - Save Page
            if (e.ctrlKey && e.keyCode === 83) {
                e.preventDefault();
                mostrarAvisoSeguranca('save_page');
                return false;
            }
        });

        // 3. Detectar DevTools (versão melhorada)
        let devtools = {
            open: false,
            lastCheck: Date.now()
        };

        function detectDevTools() {
            const now = Date.now();
            
            // Throttle para evitar checks muito frequentes
            if (now - devtools.lastCheck < 2000) return;
            devtools.lastCheck = now;

            try {
                const threshold = 160;
                const heightDiff = window.outerHeight - window.innerHeight;
                const widthDiff = window.outerWidth - window.innerWidth;
                
                // Verificar apenas em desktop real
                if (window.innerWidth > 1024 && window.innerHeight > 600) {
                    if (heightDiff > threshold || widthDiff > threshold) {
                        if (!devtools.open) {
                            devtools.open = true;
                            mostrarAvisoSeguranca('devtools_detected');
                            aplicarBlur();
                        }
                    } else {
                        if (devtools.open) {
                            devtools.open = false;
                            removerBlur();
                        }
                    }
                }
            } catch(e) {
                // Ignorar erros silenciosamente
            }
        }

        // Verificar a cada 3 segundos (menos agressivo)
        setInterval(detectDevTools, 3000);

        // 4. Desabilitar seleção de texto
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });

        // 5. Proteger contra copy/paste
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            return false;
        });

        document.addEventListener('paste', function(e) {
            e.preventDefault();
            return false;
        });

        // 6. Desabilitar seleção CSS
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        document.body.style.userSelect = 'none';

        // 7. Detectar debugger (menos agressivo)
        function detectDebugger() {
            try {
                const start = performance.now();
                debugger;
                const end = performance.now();
                
                if (end - start > 100) {
                    mostrarAvisoSeguranca('debugger_detected');
                    aplicarBlur();
                }
            } catch(e) {
                // Ignorar erros
            }
        }

        // Executar menos frequentemente
        setInterval(detectDebugger, 10000);

        // 8. Limpar console periodicamente
        setInterval(function() {
            try {
                console.clear();
            } catch(e) {}
        }, 15000);

        console.log('✅ Proteções desktop ativadas');
    }

    // ========== FUNÇÕES AUXILIARES ==========
    
    // Aplicar blur na tela
    function aplicarBlur() {
        if (document.getElementById('soma-security-blur')) return;
        
        const blurOverlay = document.createElement('div');
        blurOverlay.id = 'soma-security-blur';
        blurOverlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            backdrop-filter: blur(15px) !important;
            background: rgba(0,0,0,0.5) !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            user-select: none !important;
        `;
        document.body.appendChild(blurOverlay);
    }

    // Remover blur da tela
    function removerBlur() {
        const blurOverlay = document.getElementById('soma-security-blur');
        if (blurOverlay) {
            blurOverlay.remove();
        }
    }

    // Mostrar aviso de segurança
    function mostrarAvisoSeguranca(type = 'generic') {
        // Log da tentativa
        console.warn('🚨 Security Alert:', type, {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // Mostrar modal se SweetAlert estiver disponível
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: '🔒 Área Protegida',
                html: `
                    <div class="text-center">
                        <p><strong>Acesso ao código fonte não permitido!</strong></p>
                        <p class="text-muted">Esta área é protegida por medidas de segurança.</p>
                        <small class="text-muted">Tentativas de acesso são registradas.</small>
                    </div>
                `,
                confirmButtonText: 'Entendi',
                confirmButtonColor: '#4a7c59',
                allowOutsideClick: false,
                allowEscapeKey: false,
                timer: 5000,
                timerProgressBar: true
            });
        } else {
            alert('🔒 ÁREA PROTEGIDA: Acesso ao código fonte não permitido!');
        }
    }

    // ========== INICIALIZAÇÃO FINAL ==========
    
    // Aplicar proteções quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🛡️ SOMA Security System - Ativo');
        });
    } else {
        console.log('🛡️ SOMA Security System - Ativo');
    }

    // Heartbeat para monitorar se o script ainda está ativo
    setInterval(function() {
        // Script ainda ativo - pode adicionar telemetria aqui
    }, 60000);

})();
