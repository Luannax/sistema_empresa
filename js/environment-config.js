// ============================================
// SOMA - Configuração de Ambiente
// ============================================

window.SOMA_CONFIG = {
    // Configuração de ambientes
    environments: {
        development: {
            domains: ['localhost', '127.0.0.1', '192.168.'],
            protocols: ['http:', 'file:'],
            devtools: true,
            console: true,
            debug: true
        },
        production: {
            domains: [
                'soma-sistema.vercel.app',
                'soma-agro.com.br',
                'sistema-soma.com'
            ],
            protocols: ['https:'],
            devtools: false,
            console: false,
            debug: false
        }
    },
    
    // Detectar ambiente atual
    getCurrentEnvironment: function() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Verificar se é desenvolvimento
        if (this.environments.development.domains.some(domain => 
            hostname.includes(domain)) || 
            this.environments.development.protocols.includes(protocol)) {
            return 'development';
        }
        
        // Verificar se é produção conhecida
        if (this.environments.production.domains.some(domain => 
            hostname.includes(domain))) {
            return 'production';
        }
        
        // Se usa HTTPS e não é desenvolvimento, considerar produção
        if (protocol === 'https:') {
            return 'production';
        }
        
        // Default para desenvolvimento
        return 'development';
    },
    
    // Obter configuração do ambiente atual
    getConfig: function() {
        const env = this.getCurrentEnvironment();
        return {
            environment: env,
            ...this.environments[env]
        };
    },
    
    // Verificar se está em produção
    isProduction: function() {
        return this.getCurrentEnvironment() === 'production';
    },
    
    // Verificar se está em desenvolvimento
    isDevelopment: function() {
        return this.getCurrentEnvironment() === 'development';
    }
};

// Log da configuração atual (apenas se console estiver habilitado)
const config = window.SOMA_CONFIG.getConfig();
if (config.console) {
    console.log('⚙️ SOMA Configuration:', config);
    console.log('🌍 Current Environment:', config.environment);
    console.log('🔧 DevTools Enabled:', config.devtools);
}

// Adicionar indicador visual do ambiente (apenas em desenvolvimento)
if (config.environment === 'development') {
    document.addEventListener('DOMContentLoaded', function() {
        const indicator = document.createElement('div');
        indicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 10px;
                z-index: 9999;
                font-family: 'Segoe UI', sans-serif;
                opacity: 0.3;
            ">
                🛠️ Homologação
            </div>
        `;
        document.body.appendChild(indicator);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (indicator.firstChild) {
                indicator.firstChild.style.opacity = '0.5';
            }
        }, 5000);
    });
} else {
    // Em produção, mostrar indicador discreto
    document.addEventListener('DOMContentLoaded', function() {
        const indicator = document.createElement('div');
        indicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 10px;
                z-index: 9999;
                font-family: 'Segoe UI', sans-serif;
                opacity: 0.3;
            ">
                🔒
            </div>
        `;
        document.body.appendChild(indicator);
    });
}
