// frontend/js/editar_os.js
// Lógica para a tela de Edição de Ordem de Serviço

let todosClientes = []; // Armazenar todos os clientes carregados
let clienteIdGlobal = null; // Variável global para armazenar o ID do cliente

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM carregado para editar_os.js");

    // Elementos do DOM
    const formEditarOS = document.getElementById("formEditarOS");
    const loadingMessage = document.getElementById("loadingMessage");
    const numeroOSInput = document.getElementById("numeroOS");
    const clienteSelect = document.getElementById("clienteSelect"); // Novo select de cliente
    const enderecoInput = document.getElementById("endereco");
    const cidadeInput = document.getElementById("cidade");
    const localSelect = document.getElementById("local");
    const agendamentoInicialInput = document.getElementById("agendamentoInicial");
    const agendamentoFinalInput = document.getElementById("agendamentoFinal");
    const prestadoresSelect = document.getElementById("prestadores");
    const responsavelSelect = document.getElementById("responsavel");
    const tipoServicoSelect = document.getElementById("tipoServico");
    const servicosTextarea = document.getElementById("servicos");
    const observacoesTextarea = document.getElementById("observacoes");
    const btnAlterar = document.getElementById("btnAlterar");

    // Obter ID da OS da URL
    const urlParams = new URLSearchParams(window.location.search);
    const ordemId = urlParams.get("id");

    if (!ordemId) {
        loadingMessage.textContent = "Erro: ID da Ordem de Serviço não encontrado na URL.";
        loadingMessage.style.color = "red";
        return;
    }

    console.log(`Editando OS com ID: ${ordemId}`);

    // Funções auxiliares para popular selects, agora no escopo do DOMContentLoaded
    const popularSelect = (selectElement, options, valueField = 'id', textField = 'name', selectedValue = null) => {
        selectElement.innerHTML = '<option value="">Selecione...</option>';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option[valueField];
            optionElement.textContent = option[textField];
            if (selectedValue && String(option[valueField]) === String(selectedValue)) {
                optionElement.selected = true;
            }
            selectElement.appendChild(optionElement);
        });
    };

    const popularMultiSelect = (selectElement, options, valueField = 'name', textField = 'name', selectedValues = []) => {
        selectElement.innerHTML = '';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option[valueField];
            optionElement.textContent = option[textField];
            if (selectedValues.includes(option[valueField])) {
                optionElement.selected = true;
            }
            selectElement.appendChild(optionElement);
        });
    };

    // Função para carregar dados da OS e preencher o formulário
    async function carregarDadosOS() {
        try {
            loadingMessage.textContent = "Carregando dados da O.S....";
            formEditarOS.style.display = "none"; // Esconde form enquanto carrega

            // 1. Buscar detalhes da OS
            const ordem = await getOrdemDetalhada(ordemId);

            if (!ordem) {
                throw new Error("Dados da ordem não encontrados.");
            }

            console.log("Dados da OS recebidos:", ordem);

            // Armazenar clienteId globalmente
            clienteIdGlobal = ordem.clienteId;
            console.log(`Cliente ID armazenado: ${clienteIdGlobal}`);

            // Preencher campos
            numeroOSInput.value = ordem.numeroOS || "-";
            enderecoInput.value = ordem.clienteEndereco || "-";
            cidadeInput.value = ordem.clienteCidade || "-";

            // Carregar e selecionar cliente
            try {
                todosClientes = await getClientes();
                popularSelect(clienteSelect, todosClientes, 'id', 'nome', ordem.clienteId);
            } catch (error) {
                console.error("Erro ao carregar clientes:", error);
                clienteSelect.innerHTML = '<option value="">Erro ao carregar clientes</option>';
            }

            // Popular outros selects
            popularSelect(localSelect, ordem.opcoes?.locais || [], 'id', 'nome', ordem.localId);
            popularMultiSelect(prestadoresSelect, ordem.opcoes?.equipes || [], 'name', 'name', ordem.prestadores || []);
            popularSelect(responsavelSelect, ordem.opcoes?.responsaveis || [], 'name', 'name', ordem.responsavel);
            popularSelect(tipoServicoSelect, ordem.opcoes?.tiposServico || [], 'name', 'name', ordem.tipoServico);

            agendamentoInicialInput.value = ordem.agendamentoInicial ? ordem.agendamentoInicial.split("T")[0] : "";
            agendamentoFinalInput.value = ordem.agendamentoFinal ? ordem.agendamentoFinal.split("T")[0] : "";
            servicosTextarea.value = ordem.servicos || "";
            observacoesTextarea.value = ordem.observacoes || "";

            loadingMessage.style.display = "none";
            formEditarOS.style.display = "block";
            btnAlterar.disabled = false;

        } catch (error) {
            console.error("Erro ao carregar dados da OS:", error);
            loadingMessage.textContent = `Erro ao carregar dados: ${error.message}. Tente recarregar a página.`;
            loadingMessage.style.color = "red";
            btnAlterar.disabled = true;
        }
    }

    // Função para lidar com o envio do formulário (Alterar)
    async function handleAlterarOS(event) {
        event.preventDefault();
        btnAlterar.disabled = true;
        btnAlterar.textContent = "Salvando...";

        try {
            // 1. Coletar dados do formulário (INCLUINDO NOME/ENDERECO/CIDADE)
            const selectedClienteOption = clienteSelect.options[clienteSelect.selectedIndex];
            const dadosParaAtualizar = {
                agendamentoInicial: agendamentoInicialInput.value,
                agendamentoFinal: agendamentoFinalInput.value,
                prestadores: Array.from(prestadoresSelect.selectedOptions).map(option => option.value),
                responsavel: responsavelSelect.value,
                tipoServico: tipoServicoSelect.value,
                servicos: servicosTextarea.value,
                observacoes: observacoesTextarea.value,
                // IDs e Nomes/Detalhes atualizados para o backend
                clienteId: clienteSelect.value, // Pega o ID do cliente do select
                localId: localSelect.value,
                clienteNome: selectedClienteOption ? selectedClienteOption.text : '', // Pega o nome do cliente do select
                endereco: enderecoInput.value, // O endereço é atualizado pelo listener
                cidade: cidadeInput.value // A cidade é atualizada pelo listener
            };

            console.log("Dados para atualizar (incluindo IDs para Firebase):", dadosParaAtualizar);

            // 2. Chamar serviço para atualizar a OS
            await atualizarOrdem(ordemId, dadosParaAtualizar);

            console.log("Ordem atualizada com sucesso!");
            // alert("Ordem de Serviço atualizada com sucesso!");
            window.location.href = "gerenciamento.html";

        } catch (error) {
            console.error("Erro ao atualizar OS:", error);
            // alert(`Erro ao atualizar Ordem de Serviço: ${error.message}`);
            btnAlterar.disabled = false;
            btnAlterar.textContent = "Alterar";
        }
    }

    // Adicionar listener para a mudança de cliente
    clienteSelect.addEventListener('change', async (e) => {
        const novoClienteId = e.target.value;
        if (!novoClienteId) {
            enderecoInput.value = '';
            cidadeInput.value = '';
            localSelect.innerHTML = '<option value="">Selecione um cliente</option>';
            return;
        }

        const clienteSelecionado = todosClientes.find(c => c.id === novoClienteId);
        if (clienteSelecionado) {
            clienteIdGlobal = novoClienteId; // Atualiza o ID global
            enderecoInput.value = clienteSelecionado.endereco || '';
            cidadeInput.value = clienteSelecionado.cidade || '';

            // Recarregar locais para o novo cliente
            localSelect.innerHTML = '<option value="">Carregando locais...</option>';
            try {
                const novosLocais = await getLocaisPorCliente(novoClienteId);
                popularSelect(localSelect, novosLocais, 'id', 'nome');
            } catch (error) {
                console.error('Erro ao buscar locais para o novo cliente:', error);
                localSelect.innerHTML = '<option value="">Erro ao carregar locais</option>';
            }
        }
    });

    // Adicionar listener ao botão Alterar
    btnAlterar.addEventListener("click", handleAlterarOS);

    // Carregar dados iniciais da OS
    await carregarDadosOS();

    console.log("editar_os.js inicializado.");
});

