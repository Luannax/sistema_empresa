//aqui vai ser funções globais porq exemplo validaçõa de celular, cpf, cnpj, etc
// e outras funções que podem ser usadas em qualquer lugar do sistema

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // Verifica se tem 11 dígitos e não é repetido
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let primeiroDigito = (soma * 10) % 11;
    if (primeiroDigito === 10) primeiroDigito = 0;
    if (primeiroDigito !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    let segundoDigito = (soma * 10) % 11;
    if (segundoDigito === 10) segundoDigito = 0;
    return segundoDigito === parseInt(cpf[10]);
}

function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false; // Verifica se tem 14 dígitos e não é repetido
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    return true;
}

//funcao que deixar digitar cpf e cnpj e formata tipo 00000.000-00 ou 00.000.000/0000-00
function formatarDocumento(input) {
    input.addEventListener('input', function() {
        let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (value.length <= 11) {
            // Formata como CPF
            input.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        else {
            // Formata como CNPJ
            input.value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
    });
}

// Função para validar e formatar telefone
function formatarTelefone(input) {
    input.addEventListener('input', function() {
        let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (value.length <= 10) {
            // Formata como telefone fixo
            input.value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        else {
            // Formata como telefone celular
            input.value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
    });
}