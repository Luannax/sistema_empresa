// Sistema de Backup Automático
class SistemaBackup {
    constructor() {
        this.intervaloBackup = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
        this.ultimoBackup = this.obterUltimoBackup();
        this.inicializar();
    }

    inicializar() {
        // Verificar se precisa fazer backup ao inicializar
        this.verificarBackupNecessario();
        
        // Configurar verificação periódica
        setInterval(() => {
            this.verificarBackupNecessario();
        }, 60 * 60 * 1000); // Verificar a cada hora
        
        // Listener para quando a página for fechada
        window.addEventListener('beforeunload', () => {
            this.verificarBackupNecessario();
        });
    }

    obterUltimoBackup() {
        const ultimoBackup = localStorage.getItem('ultimoBackup');
        return ultimoBackup ? new Date(ultimoBackup) : null;
    }

    salvarUltimoBackup() {
        localStorage.setItem('ultimoBackup', new Date().toISOString());
        this.ultimoBackup = new Date();
    }

    verificarBackupNecessario() {
        const agora = new Date();
        
        // Se nunca fez backup ou se passou do intervalo
        if (!this.ultimoBackup || (agora - this.ultimoBackup) >= this.intervaloBackup) {
            this.executarBackupAutomatico();
        }
    }

    async executarBackupAutomatico() {
        try {
            console.log('Iniciando backup automático...');
            
            // Obter dados do sistema
            const dadosBackup = await obterDadosCompletos();
            
            if (dadosBackup.success) {
                // Criar estrutura do backup
                const backup = {
                    versao: '1.0',
                    tipo: 'automatico',
                    data: new Date().toISOString(),
                    dados: dadosBackup.data,
                    metadados: {
                        totalClientes: dadosBackup.data.clientes.length,
                        totalPedidos: dadosBackup.data.pedidos.length,
                        usuario: obterUsuarioLogado()?.nome || 'Sistema'
                    }
                };

                // Salvar no IndexedDB (armazenamento local)
                await this.salvarBackupLocal(backup);
                
                // Atualizar última data de backup
                this.salvarUltimoBackup();
                
                console.log('Backup automático concluído com sucesso');
                
                // Notificar apenas admins
                const usuario = obterUsuarioLogado();
                if (usuario && usuario.tipo === 'admin') {
                    this.notificarBackupConcluido();
                }
                
            } else {
                console.error('Erro ao obter dados para backup automático');
            }
            
        } catch (error) {
            console.error('Erro no backup automático:', error);
        }
    }

    async salvarBackupLocal(backup) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SomaBackups', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['backups'], 'readwrite');
                const store = transaction.objectStore('backups');
                
                // Adicionar ID único ao backup
                backup.id = Date.now();
                
                const addRequest = store.add(backup);
                
                addRequest.onsuccess = () => {
                    // Manter apenas os últimos 10 backups
                    this.limparBackupsAntigos(db);
                    resolve();
                };
                
                addRequest.onerror = () => reject(addRequest.error);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('backups')) {
                    const store = db.createObjectStore('backups', { keyPath: 'id' });
                    store.createIndex('data', 'data', { unique: false });
                }
            };
        });
    }

    async limparBackupsAntigos(db) {
        try {
            const transaction = db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            const index = store.index('data');
            
            const request = index.openCursor(null, 'prev');
            let contador = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    contador++;
                    if (contador > 10) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
        } catch (error) {
            console.error('Erro ao limpar backups antigos:', error);
        }
    }

    notificarBackupConcluido() {
        // Criar notificação discreta no canto da tela
        const notificacao = document.createElement('div');
        notificacao.className = 'backup-notification';
        notificacao.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; max-width: 300px;">
                <i class="bi bi-shield-check me-2"></i>
                <strong>Backup automático concluído</strong><br>
                <small>${new Date().toLocaleString('pt-BR')}</small>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notificacao);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.remove();
            }
        }, 5000);
    }

    async obterBackupsLocais() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SomaBackups', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['backups'], 'readonly');
                const store = transaction.objectStore('backups');
                const index = store.index('data');
                
                const getRequest = index.getAll();
                
                getRequest.onsuccess = () => {
                    resolve(getRequest.result.sort((a, b) => new Date(b.data) - new Date(a.data)));
                };
                
                getRequest.onerror = () => reject(getRequest.error);
            };
        });
    }

    async baixarBackup(backupId) {
        try {
            const backups = await this.obterBackupsLocais();
            const backup = backups.find(b => b.id === backupId);
            
            if (!backup) {
                throw new Error('Backup não encontrado');
            }
            
            const dataStr = JSON.stringify(backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup-soma-${backup.data.split('T')[0]}-${backup.id}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Erro ao baixar backup:', error);
            throw error;
        }
    }

    async restaurarBackup(arquivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Validar estrutura do backup
                    if (!backup.dados || !backup.dados.clientes || !backup.dados.pedidos) {
                        throw new Error('Arquivo de backup inválido');
                    }
                    
                    // Aqui você implementaria a lógica de restauração
                    // Por questões de segurança, isso deve ser muito cuidadoso
                    console.log('Backup validado:', backup);
                    
                    resolve({
                        success: true,
                        dados: backup.dados,
                        metadados: backup.metadados
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsText(arquivo);
        });
    }

    // Método para backup manual (chamado pelo usuário)
    async executarBackupManual() {
        try {
            Swal.fire({
                title: 'Realizando Backup Manual...',
                text: 'Por favor, aguarde enquanto o backup é criado.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            const dadosBackup = await obterDadosCompletos();
            
            if (dadosBackup.success) {
                const backup = {
                    versao: '1.0',
                    tipo: 'manual',
                    data: new Date().toISOString(),
                    dados: dadosBackup.data,
                    metadados: {
                        totalClientes: dadosBackup.data.clientes.length,
                        totalPedidos: dadosBackup.data.pedidos.length,
                        usuario: obterUsuarioLogado()?.nome || 'Usuário'
                    }
                };
                
                // Salvar localmente
                await this.salvarBackupLocal(backup);
                
                // Criar arquivo para download
                const dataStr = JSON.stringify(backup, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `backup-soma-manual-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                // Atualizar última data de backup
                this.salvarUltimoBackup();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Backup Realizado!',
                    html: `
                        <p>O backup foi criado e baixado com sucesso.</p>
                        <small class="text-muted">
                            Clientes: ${backup.metadados.totalClientes}<br>
                            Pedidos: ${backup.metadados.totalPedidos}
                        </small>
                    `,
                    confirmButtonColor: '#4a7c59'
                });
                
                return { success: true, backup };
            } else {
                throw new Error('Erro ao obter dados para backup');
            }
            
        } catch (error) {
            console.error('Erro no backup manual:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro no Backup',
                text: 'Ocorreu um erro ao realizar o backup dos dados.',
                confirmButtonColor: '#4a7c59'
            });
            return { success: false, error: error.message };
        }
    }
}

// Inicializar sistema de backup automático
let sistemaBackup;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar apenas se usuário estiver logado
    const usuario = obterUsuarioLogado();
    if (usuario) {
        sistemaBackup = new SistemaBackup();
    }
});

// Função global para backup manual (usada no dashboard)
async function realizarBackup() {
    if (sistemaBackup) {
        return await sistemaBackup.executarBackupManual();
    } else {
        console.error('Sistema de backup não inicializado');
        return { success: false, error: 'Sistema não disponível' };
    }
}
