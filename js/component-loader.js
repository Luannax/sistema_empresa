// Sistema de Carregamento de Componentes - SOMA
(function() {
    'use strict';

    // ========== CONFIGURAÇÕES ==========
    
    const COMPONENTES_PATH = '/components/';
    
    // ========== FUNÇÕES PRINCIPAIS ==========

    /**
     * Carregar um componente HTML e inserir em um elemento
     * @param {string} componenteName - Nome do arquivo do componente (sem extensão)
     * @param {string} targetSelector - Seletor CSS do elemento onde inserir
     * @param {function} callback - Função para executar após carregar (opcional)
     */
    async function carregarComponente(componenteName, targetSelector, callback) {
        try {
            // Cache busting SUPER agressivo para forçar recarga
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 15);
            const cacheBuster = Math.random().toString(36).substring(2, 8);
            const response = await fetch(`${COMPONENTES_PATH}${componenteName}.html?v=${timestamp}&r=${randomId}&cb=${cacheBuster}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar componente ${componenteName}: ${response.status}`);
            }
            
            const html = await response.text();
            const targetElement = document.querySelector(targetSelector);
            
            if (!targetElement) {
                throw new Error(`Elemento alvo não encontrado: ${targetSelector}`);
            }
            
            // Inserir o HTML
            targetElement.innerHTML = html;
            
            // Executar scripts inline do componente
            const scripts = targetElement.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.head.appendChild(newScript);
                script.remove(); // Remover o script original
            });
            
            // Executar callback se fornecido
            if (callback && typeof callback === 'function') {
                await callback();
            }
            
            console.log(`✅ Componente ${componenteName} carregado com sucesso`);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar componente ${componenteName}:`, error);
            
            // Fallback: mostrar erro no elemento
            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                targetElement.innerHTML = `
                    <div class="alert alert-warning" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Erro ao carregar componente: ${componenteName}
                    </div>
                `;
            }
        }
    }

    /**
     * Carregar navbar padrão do sistema
     * @param {string} targetSelector - Onde inserir o navbar (padrão: 'body')
     */
    async function carregarNavbar(targetSelector = 'body') {
        await carregarComponente('navbar', targetSelector, async () => {
            // Aguardar um pouco para garantir que os scripts foram executados
            setTimeout(async () => {
                if (window.navbarFunctions && window.navbarFunctions.configurarNavbar) {
                    await window.navbarFunctions.configurarNavbar();
                }
            }, 100);
        });
    }

    /**
     * Carregar múltiplos componentes em paralelo
     * @param {Array} componentes - Array de objetos {nome, target, callback}
     */
    async function carregarComponentes(componentes) {
        const promises = componentes.map(comp => 
            carregarComponente(comp.nome, comp.target, comp.callback)
        );
        
        await Promise.all(promises);
    }

    /**
     * Inicializar componentes automaticamente baseado em atributos data
     */
    function inicializarComponentesAutomaticos() {
        // Buscar elementos com data-component
        const elementos = document.querySelectorAll('[data-component]');
        
        elementos.forEach(async elemento => {
            const componenteName = elemento.getAttribute('data-component');
            const targetSelector = `#${elemento.id}` || elemento.tagName.toLowerCase();
            
            await carregarComponente(componenteName, targetSelector);
        });
    }

    // ========== EXPOSIÇÃO GLOBAL ==========
    
    window.ComponentLoader = {
        carregarComponente,
        carregarNavbar,
        carregarComponentes,
        inicializarComponentesAutomaticos
    };

    // ========== AUTO-INICIALIZAÇÃO ==========
    
    // Aguardar DOM e scripts carregarem
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔄 DOM carregado - aguardando scripts...');
            setTimeout(inicializarComponentesAutomaticos, 300);
        });
    } else {
        console.log('🔄 DOM já pronto - aguardando scripts...');
        setTimeout(inicializarComponentesAutomaticos, 300);
    }

    console.log('🔧 ComponentLoader inicializado');

})();
