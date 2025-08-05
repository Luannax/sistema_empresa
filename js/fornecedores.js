// Exporta todos os lançamentos de fornecedores em formato de relatório completo (tabela detalhada)
async function exportarFornecedores() {
  const { data, error } = await supabaseClient
    .from('fornecedores_pagamentos')
    .select('*, fornecedor:fornecedor_id (nome, cpf_cnpj)')
    .order('data_compra', { ascending: true });
  if (error) {
    Swal.fire('Erro', error.message || 'Não foi possível exportar.', 'error');
    return;
  }
  if (!data || data.length === 0) {
    Swal.fire('Atenção', 'Nenhum lançamento encontrado para exportar.', 'info');
    return;
  }

  // Monta tabela HTML para o relatório
  let html = `
    <h2 style="text-align:center;">Relatório Completo de Pagamentos de Fornecedores</h2>
    <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:12px;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th>Status</th>
          <th>Fornecedor</th>
          <th>CPF/CNPJ</th>
          <th>Descrição</th>
          <th>Valor</th>
          <th>Data Compra</th>
          <th>Forma Pgto</th>
          <th>Data Pgto</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(l => `
          <tr>
            <td>${l.status_pagamento === 'pago' ? 'Pago' : (l.status_pagamento === 'pendente' ? 'Pendente' : (l.status_pagamento || '-'))}</td>
            <td>${l.fornecedor ? l.fornecedor.nome : '-'}</td>
            <td>${l.fornecedor && l.fornecedor.cpf_cnpj ? l.fornecedor.cpf_cnpj : '-'}</td>
            <td>${l.descricao_compra || ''}</td>
            <td>R$ ${l.valor?.toFixed(2) || ''}</td>
            <td>${l.data_compra ? new Date(l.data_compra).toLocaleDateString() : ''}</td>
            <td>${l.forma_pagamento || ''}</td>
            <td>${l.data_pagamento ? new Date(l.data_pagamento).toLocaleDateString() : ''}</td>
            <td>${l.observacoes || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Abre em nova janela para impressão/exportação
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Relatório de Fornecedores</title></head><body>${html}</body></html>`);
  win.document.close();
  win.print();
}
// Carregar fornecedores no select
async function carregarFornecedores() {
  const { data, error } = await supabaseClient.from('fornecedores').select('*').order('nome');
  const select = document.getElementById('fornecedorSelect');
  select.innerHTML = '<option value="">Selecione...</option>';
  if (data) {
    data.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.nome} (${f.cpf_cnpj || ''})`;
      select.appendChild(opt);
    });
  }
}

// Carregar lançamentos de fornecedores na tabela (padrão clientes)
async function carregarLancamentos() {
  const tbody = document.getElementById('tabelaPagamentosFornecedores');
  // Mostra loading imediatamente
  tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">
    <div class='spinner-border text-primary' role='status'></div>
    <p class='mt-2 text-muted'>Carregando lançamentos...</p>
  </td></tr>`;
  let data = null;
  let error = null;
  try {
    const res = await supabaseClient
      .from('fornecedores_pagamentos')
      .select('*, fornecedor:fornecedor_id (nome, cpf_cnpj)')
      .order('data_compra', { ascending: true });

    data = res.data;
    error = res.error;
  } catch (e) {
    error = e;
  }
  // Limpa o loading
  tbody.innerHTML = '';
  if (error) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-danger text-center">Erro ao buscar lançamentos: ${error.message || error}</td></tr>`;
    document.getElementById('totalClientes').textContent = '0';
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">Nenhum lançamento encontrado.</td></tr>';
    document.getElementById('totalClientes').textContent = '0';
    return;
  }
  tbody.innerHTML = data.map(l => {
    let badgeStatus = l.status_pagamento === 'pago' ? 'bg-success' : (l.status_pagamento === 'pendente' ? 'bg-warning text-dark' : 'bg-secondary');
    let statusLabel = l.status_pagamento === 'pago' ? 'Pago' : (l.status_pagamento === 'pendente' ? 'Pendente' : l.status_pagamento || '-');
    return `
      <tr>
        <td style="font-size: 0.95em;">
          <span class="badge ${badgeStatus}">${statusLabel}</span>
        </td>
        <td class="d-none d-md-table-cell">
          <div class="d-flex align-items-center">
            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2 d-none d-sm-flex" style="width: 26px; height: 26px; font-size: 12px; color: white;">
              ${l.fornecedor && l.fornecedor.nome ? l.fornecedor.nome.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div class="fw-bold" style="font-size: 0.98em;">${l.fornecedor ? l.fornecedor.nome : '-'}</div>
              ${l.fornecedor && l.fornecedor.cpf_cnpj ? `<small class="text-muted d-none d-md-inline" style="font-size: 0.85em;">${l.fornecedor.cpf_cnpj}</small>` : ''}
            </div>
          </div>
        </td>
        <td style="font-size: 0.95em;">${l.descricao_compra || ''}</td>
        <td style="font-size: 0.95em;">R$ ${l.valor?.toFixed(2) || ''}</td>
        <td class="d-none d-md-table-cell" style="font-size: 0.95em;">${l.data_compra ? new Date(l.data_compra).toLocaleDateString() : ''}</td>
        <td class="d-none d-md-table-cell" style="font-size: 0.95em;">${l.forma_pagamento || ''}</td>
        <td class="d-none d-lg-table-cell" style="font-size: 0.95em;">${l.data_pagamento ? new Date(l.data_pagamento).toLocaleDateString() : ''}</td>
        <td style="width: 60px; min-width: 48px; max-width: 70px; text-align: center;">
          <div class="btn-group btn-group-sm d-none" role="group">
            <button class="btn btn-outline-primary" style="padding: 0.10rem 0.25rem;" title="Visualizar" disabled>
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-secondary" style="padding: 0.10rem 0.25rem;" title="Editar" disabled>
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" style="padding: 0.10rem 0.25rem;" title="Excluir" disabled>
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <div class="dropdown d-inline">
            <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Opções" style="padding: 0.10rem 0.4rem;">
              <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" onclick="visualizarLancamento(${l.id})"><i class="bi bi-eye me-2"></i>Visualizar</a></li>
              <li><a class="dropdown-item" href="#" onclick="editarLancamento(${l.id})"><i class="bi bi-pencil me-2"></i>Editar</a></li>
              <li><a class="dropdown-item text-danger" href="#" onclick="excluirLancamento(${l.id})"><i class="bi bi-trash me-2"></i>Excluir</a></li>
            </ul>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  document.getElementById('totalClientes').textContent = data.length;
}

// Função para visualizar lançamento
async function visualizarLancamento(id) {
  const { data, error } = await supabaseClient
    .from('fornecedores_pagamentos')
    .select('*, fornecedor:fornecedor_id (nome, cpf_cnpj)')
    .eq('id', id)
    .single();
  if (error || !data) {
    Swal.fire('Erro', 'Não foi possível carregar o lançamento.', 'error');
    return;
  }
  let statusColor = data.status_pagamento === 'pago' ? 'success' : (data.status_pagamento === 'pendente' ? 'warning text-dark' : 'secondary');
  let statusLabel = data.status_pagamento === 'pago' ? 'Pago' : (data.status_pagamento === 'pendente' ? 'Pendente' : data.status_pagamento || '-');
  let html = `
    <div class="card border-0 shadow-sm mb-0">
      <div class="card-body pb-2">
        <div class="d-flex align-items-center mb-3">
          <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 44px; height: 44px; font-size: 1.3em; color: white;">
            <i class="bi bi-truck"></i>
          </div>
          <div>
            <div class="fw-bold" style="font-size: 1.1em;">${data.fornecedor ? data.fornecedor.nome : '-'}</div>
            ${data.fornecedor && data.fornecedor.cpf_cnpj ? `<small class="text-muted">${data.fornecedor.cpf_cnpj}</small>` : ''}
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-12 col-md-6">
            <span class="text-muted"><i class="bi bi-card-text me-1"></i>Descrição:</span><br>
            <span class="fw-semibold">${data.descricao_compra || '-'}</span>
          </div>
          <div class="col-6 col-md-3">
            <span class="text-muted"><i class="bi bi-cash-coin me-1"></i>Valor:</span><br>
            <span class="fw-semibold text-success">R$ ${data.valor?.toFixed(2) || '-'}</span>
          </div>
          <div class="col-6 col-md-3">
            <span class="text-muted"><i class="bi bi-calendar me-1"></i>Compra:</span><br>
            <span>${data.data_compra ? new Date(data.data_compra).toLocaleDateString() : '-'}</span>
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6 col-md-4">
            <span class="text-muted"><i class="bi bi-credit-card me-1"></i>Forma Pgto:</span><br>
            <span>${data.forma_pagamento || '-'}</span>
          </div>
          <div class="col-6 col-md-4">
            <span class="text-muted"><i class="bi bi-calendar-check me-1"></i>Data Pgto:</span><br>
            <span>${data.data_pagamento ? new Date(data.data_pagamento).toLocaleDateString() : '-'}</span>
          </div>
          <div class="col-12 col-md-4">
            <span class="text-muted"><i class="bi bi-flag me-1"></i>Status:</span><br>
            <span class="badge bg-${statusColor} px-3 py-1">${statusLabel}</span>
          </div>
        </div>
        <div class="mb-2">
          <span class="text-muted"><i class="bi bi-chat-left-text me-1"></i>Observações:</span><br>
          <span>${data.observacoes || '-'}</span>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalLancamentoBody').innerHTML = html;
  document.getElementById('btnEditarLancamento').style.display = 'none';
  new bootstrap.Modal(document.getElementById('modalLancamento')).show();
}

// Função para editar lançamento (abre modal com formulário)
async function editarLancamento(id) {
  const { data, error } = await supabaseClient
    .from('fornecedores_pagamentos')
    .select('*, fornecedor:fornecedor_id (nome, cpf_cnpj)')
    .eq('id', id)
    .single();
  if (error || !data) {
    Swal.fire('Erro', 'Não foi possível carregar o lançamento.', 'error');
    return;
  }
  let html = `
    <form id='formEditarLancamento' class="needs-validation" novalidate>
      <input type='hidden' name='id' value='${data.id}'>
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label fw-semibold"><i class="bi bi-truck me-1"></i>Fornecedor</label>
          <input type="text" class="form-control-plaintext ps-0 fw-bold" value="${data.fornecedor ? data.fornecedor.nome : ''}" disabled>
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-control" name="descricao_compra" value="${data.descricao_compra || ''}" required>
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label">Valor</label>
          <input type="number" step="0.01" min="0" class="form-control" name="valor" value="${data.valor || ''}" required>
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label">Data Compra</label>
          <input type="date" class="form-control" name="data_compra" value="${data.data_compra ? data.data_compra.split('T')[0] : ''}" required>
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Forma Pgto</label>
          <select class="form-select" id="forma_pagamento" name="forma_pagamento" required>
            <option value="">Selecione...</option>
            <option value="boleto" ${data.forma_pagamento==='boleto'?'selected':''}>Boleto</option>
            <option value="pix" ${data.forma_pagamento==='pix'?'selected':''}>Pix</option>
            <option value="transferencia" ${data.forma_pagamento==='transferencia'?'selected':''}>Transferência Bancária</option>
            <option value="dinheiro" ${data.forma_pagamento==='dinheiro'?'selected':''}>Dinheiro</option>
            <option value="cartaoDebito" ${data.forma_pagamento==='cartaoDebito'?'selected':''}>Cartão de Débito</option>
            <option value="cartaoCredito" ${data.forma_pagamento==='cartaoCredito'?'selected':''}>Cartão de Crédito</option>
            <option value="outro" ${data.forma_pagamento==='outro'?'selected':''}>Outro</option>
          </select>
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Status</label>
          <select class="form-select" name="status_pagamento" required>
            <option value="pendente" ${data.status_pagamento==='pendente'?'selected':''}>Pendente</option>
            <option value="pago" ${data.status_pagamento==='pago'?'selected':''}>Pago</option>
          </select>
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Data Pgto</label>
          <input type="date" class="form-control" name="data_pagamento" value="${data.data_pagamento ? data.data_pagamento.split('T')[0] : ''}">
        </div>
        <div class="col-12">
          <label class="form-label">Observações</label>
          <input type="text" class="form-control" name="observacoes" value="${data.observacoes || ''}">
        </div>
      </div>
      <div class="text-end mt-4">
        <button type="submit" class="btn btn-success px-4"><i class="bi bi-save me-1"></i>Salvar</button>
      </div>
    </form>
  `;
  document.getElementById('modalLancamentoBody').innerHTML = html;
  document.getElementById('btnEditarLancamento').style.display = 'none';
  new bootstrap.Modal(document.getElementById('modalLancamento')).show();
  document.getElementById('formEditarLancamento').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const update = {
      descricao_compra: form.descricao_compra.value,
      valor: parseFloat(form.valor.value),
      data_compra: form.data_compra.value,
      data_pagamento: form.data_pagamento.value || null,
      status_pagamento: form.status_pagamento.value,
      forma_pagamento: form.forma_pagamento.value,
      observacoes: form.observacoes.value
    };
    const { error } = await supabaseClient
      .from('fornecedores_pagamentos')
      .update(update)
      .eq('id', id);
    if (!error) {
      Swal.fire('Sucesso', 'Lançamento atualizado!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modalLancamento')).hide();
      carregarLancamentos();
    } else {
      Swal.fire('Erro', error.message || 'Não foi possível atualizar.', 'error');
    }
  };
}

// Função para excluir lançamento
async function excluirLancamento(id) {
  const confirm = await Swal.fire({
    title: '<div class="mb-2"><i class="bi bi-exclamation-triangle-fill text-danger" style="font-size:3em;"></i></div><div class="mt-2">Excluir lançamento?</div>',
    html: '<div class="text-muted mb-2">Esta ação não pode ser desfeita!</div>',
    icon: undefined,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-trash"></i> Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    focusCancel: true,
    customClass: {
      popup: 'p-3',
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary ms-2'
    },
    buttonsStyling: false
  });
  if (!confirm.isConfirmed) return;
  const { error } = await supabaseClient
    .from('fornecedores_pagamentos')
    .delete()
    .eq('id', id);
  if (!error) {
    Swal.fire({
      title: '<i class="bi bi-check-circle-fill text-success" style="font-size:2em;"></i>',
      html: '<div class="fw-bold">Lançamento removido.</div>',
      icon: undefined,
      timer: 1500,
      showConfirmButton: false
    });
    carregarLancamentos();
    bootstrap.Modal.getInstance(document.getElementById('modalLancamento'))?.hide();
  } else {
    Swal.fire('Erro', error.message || 'Não foi possível excluir.', 'error');
  }
}

// Cadastrar novo fornecedor
document.addEventListener('DOMContentLoaded', function() {
  const formFornecedor = document.getElementById('formFornecedor');
  if (formFornecedor) {
    formFornecedor.addEventListener('submit', async function(e) {
      e.preventDefault();
      const fornecedor = {
        nome: formFornecedor.nome.value,
        cpf_cnpj: formFornecedor.cpf_cnpj.value,
        celular: formFornecedor.celular.value,
        endereco: formFornecedor.endereco.value
      };
      const res = await criarFornecedor(fornecedor);
      if (res.success) {
        Swal.fire('Sucesso', 'Fornecedor cadastrado!', 'success');
        formFornecedor.reset();
        carregarFornecedoresSelect();
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFornecedor'));
        modal.hide();
      } else {
        Swal.fire('Erro', res.error || 'Não foi possível cadastrar o fornecedor.', 'error');
      }
    });
  }
});

// Cadastrar lançamento de pagamento
document.addEventListener('DOMContentLoaded', function() {
  const formPagamento = document.getElementById('formPagamentoFornecedor');
  if (formPagamento) {
    formPagamento.addEventListener('submit', async function(e) {
      e.preventDefault();
      const lancamento = {
        fornecedor_id: formPagamento.fornecedor_id.value,
        descricao_compra: formPagamento.descricao_compra.value,
        valor: parseFloat(formPagamento.valor.value),
        data_compra: formPagamento.data_compra.value,
        data_pagamento: formPagamento.data_pagamento.value || null,
        status_pagamento: formPagamento.status_pagamento.value,
        forma_pagamento: formPagamento.forma_pagamento.value,
        observacoes: formPagamento.observacoes.value
      };
      const res = await criarPagamentoFornecedor(lancamento);
      if (res.success) {
        Swal.fire('Sucesso', 'Lançamento cadastrado!', 'success');
        formPagamento.reset();
        carregarLancamentos();
      } else {
        Swal.fire('Erro', res.error || 'Não foi possível cadastrar o lançamento.', 'error');
      }
    });
  }
});