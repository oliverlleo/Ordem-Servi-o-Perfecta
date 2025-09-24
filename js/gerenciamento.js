
// --- Lógica para o Multi-Select Minimalista para Gerenciamento ---
function inicializarMultiSelectGerenciamento() {
    const multiSelectContainer = document.getElementById('filtroStatusMultiGerenciamento');
    if (!multiSelectContainer) {
        console.error('Multi-select container #filtroStatusMultiGerenciamento not found.');
        return;
    }

    const selectedTextElement = multiSelectContainer.querySelector('.multi-select-selected-text');
    const optionsContainer = multiSelectContainer.querySelector('.multi-select-options');
    const options = optionsContainer.querySelectorAll('.multi-select-option');

    if (!selectedTextElement || !optionsContainer || options.length === 0) {
        console.error('Essential elements for multi-select #filtroStatusMultiGerenciamento are missing.');
        return;
    }

    function updateSelectedTextGerenciamento() {
        const selectedOptions = Array.from(optionsContainer.querySelectorAll('.multi-select-option.selected'))
                                    .filter(opt => opt.dataset.value !== '');
        const todosOption = optionsContainer.querySelector('.multi-select-option[data-value=""]');

        if (selectedOptions.length === 0 || (selectedOptions.length === 1 && selectedOptions[0].dataset.value === '')) {
            selectedTextElement.textContent = 'Todos';
            if(todosOption) {
                todosOption.classList.add('selected');
                todosOption.classList.remove('hide-todos');
            }
        } else {
            selectedTextElement.textContent = selectedOptions.map(opt => opt.textContent).join(', ');
            if(todosOption) {
                todosOption.classList.remove('selected');
                todosOption.classList.add('hide-todos');
            }
        }
    }

    selectedTextElement.addEventListener('click', (event) => {
        event.stopPropagation();
        multiSelectContainer.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', (event) => {
            event.stopPropagation();
            const value = option.dataset.value;
            const todosOption = optionsContainer.querySelector('.multi-select-option[data-value=""]');

            if (value === '') {
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            } else {
                if(todosOption) todosOption.classList.remove('selected');
                option.classList.toggle('selected');
            }

            const anySelected = Array.from(optionsContainer.querySelectorAll('.multi-select-option.selected'))
                                .some(opt => opt.dataset.value !== '');
            if (!anySelected && todosOption) {
                todosOption.classList.add('selected');
            }
            updateSelectedTextGerenciamento();
        });
    });

    document.addEventListener('click', () => {
        if (multiSelectContainer.classList.contains('open')) {
            multiSelectContainer.classList.remove('open');
        }
    });
    updateSelectedTextGerenciamento(); // Initialize text
}

function getSelectedStatusValuesGerenciamento() {
    const multiSelectContainer = document.getElementById('filtroStatusMultiGerenciamento');
    if (!multiSelectContainer) return [''];

    const selectedOptions = multiSelectContainer.querySelectorAll('.multi-select-option.selected');
    const values = Array.from(selectedOptions).map(opt => opt.dataset.value);

    if (values.includes('')) {
        return [''];
    }
    return values.length > 0 ? values : [''];
}

function resetMultiSelectStatusGerenciamento() {
    const multiSelectContainer = document.getElementById('filtroStatusMultiGerenciamento');
    if (!multiSelectContainer) return;

    const selectedTextElement = multiSelectContainer.querySelector('.multi-select-selected-text');
    const optionsContainer = multiSelectContainer.querySelector('.multi-select-options');
    const options = optionsContainer.querySelectorAll('.multi-select-option');
    const todosOption = optionsContainer.querySelector('.multi-select-option[data-value=""]');

    options.forEach(opt => {
        opt.classList.remove('selected');
        opt.classList.remove('hide-todos');
    });
    
    if (todosOption) {
        todosOption.classList.add('selected');
    }
    
    if (selectedTextElement) {
        selectedTextElement.textContent = 'Todos';
    }
}

// frontend/js/gerenciamento.js
// Lógica para a tela de Gerenciamento de Ordens de Serviço

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM carregado para gerenciamento.js");

    // Elementos do DOM
    const corpoTabelaOrdens = document.getElementById("corpoTabelaOrdens");
    const filtroNumOS = document.getElementById("filtroNumOS");
    const filtroCliente = document.getElementById("filtroCliente");
    const filtroLocal = document.getElementById("filtroLocal");
    // const filtroStatus = document.getElementById("filtroStatus"); // Removido, substituído por multi-select
    const filtroAgInicial = document.getElementById("filtroAgInicial");
    const filtroAgFinal = document.getElementById("filtroAgFinal");
    const filtroResponsavel = document.getElementById("filtroResponsavel");
    const filtroPrestador = document.getElementById("filtroPrestador");
    const btnAplicarFiltros = document.getElementById("btnAplicarFiltros");
    const btnLimparFiltros = document.getElementById("btnLimparFiltros");

    // Inicializar o novo multi-select
    inicializarMultiSelectGerenciamento();

    // Estado inicial
    corpoTabelaOrdens.innerHTML = '<tr><td colspan="9" style="text-align: center;">Carregando ordens...</td></tr>';

    // Carregamento inicial
    await carregarOrdensGerenciamento(); // Renomeado para clareza e para evitar conflito se houver outra função carregarOrdens

    console.log("gerenciamento.js inicializado.");
});

async function carregarOrdensGerenciamento(filtros = {}) {
    console.log("Carregando ordens com filtros:", filtros);
    const corpoTabelaOrdens = document.getElementById("corpoTabelaOrdens");
    corpoTabelaOrdens.innerHTML = '<tr><td colspan="9" style="text-align: center;">Carregando ordens...</td></tr>';
    try {
        let ordens;
        // Se não houver filtros, busca todas as OS. Se houver, usa a busca com filtro.
        if (Object.keys(filtros).length === 0) {
            ordens = await getOrdens(); // Função que busca todas as ordens
        } else {
            ordens = await getOrdensGerenciamento(filtros); // Função que busca com filtros
        }
        console.log("Ordens recebidas:", ordens);
        renderizarTabelaGerenciamento(ordens); // Renomeado para clareza
    } catch (error) {
        console.error("Erro ao carregar ordens:", error);
        corpoTabelaOrdens.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Erro ao carregar ordens. Tente novamente.</td></tr>';
    }
}

function renderizarTabelaGerenciamento(ordens) {
    const corpoTabelaOrdens = document.getElementById("corpoTabelaOrdens");
    corpoTabelaOrdens.innerHTML = ""; 

    if (!ordens || ordens.length === 0) {
        corpoTabelaOrdens.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhuma ordem de serviço encontrada.</td></tr>';
        return;
    }
    
    // Ordenar as ordens por número de OS em ordem decrescente (mais recentes no topo)
    // Sem alterar a lógica de obtenção dos dados, apenas a exibição
    const ordensOrdenadas = [...ordens].sort((a, b) => {
        // Converter para números para comparação numérica correta
        const numA = parseInt(a.numeroOS) || 0;
        const numB = parseInt(b.numeroOS) || 0;
        return numB - numA; // Ordem decrescente (maior para menor)
    });

    ordensOrdenadas.forEach(ordem => {
        const tr = document.createElement("tr");
        const agInicialFormatado = ordem.agendamentoInicial ? new Date(ordem.agendamentoInicial).toLocaleDateString("pt-BR") : "-";
        const agFinalFormatado = ordem.agendamentoFinal ? new Date(ordem.agendamentoFinal).toLocaleDateString("pt-BR") : "-";
        const podeEditar = ordem.status === "Não iniciada";
        const podeReabrir = ordem.status === "Concluído" || ordem.status === "Gerou Pendências";

        tr.innerHTML = `
            <td>${ordem.numeroOS || "-"}</td>
            <td>${ordem.cliente || "-"}</td>
            <td>${ordem.local || "-"}</td>
            <td>${ordem.status || "-"}</td>
            <td>${agInicialFormatado}</td>
            <td>${agFinalFormatado}</td>
            <td>${ordem.responsavel || "-"}</td>
            <td>${Array.isArray(ordem.prestadores) ? ordem.prestadores.join(", ") : (ordem.prestadores || "-")}</td>
            <td class="acoes">
                <button class="btn-visualizar" data-id="${ordem.id}">Visualizar</button>
                <button class="btn-editar" data-id="${ordem.id}" ${!podeEditar ? 'disabled' : ''}>Editar</button>
                <button class="btn-reabrir" data-id="${ordem.id}" data-num="${ordem.numeroOS || ''}" ${!podeReabrir ? 'disabled' : ''}>Reabrir</button>
            </td>
        `;

        const btnVisualizar = tr.querySelector(".btn-visualizar");
        if (btnVisualizar) {
            btnVisualizar.addEventListener("click", () => {
                window.location.href = `visualizar_os.html?id=${ordem.id}`;
            });
        }

        const btnEditar = tr.querySelector(".btn-editar");
        if (btnEditar) {
            btnEditar.addEventListener("click", () => {
                if (podeEditar) {
                    window.location.href = `editar_os_isolado.html?id=${ordem.id}`;
                }
            });
        }

        const btnReabrir = tr.querySelector(".btn-reabrir");
        if (btnReabrir) {
            btnReabrir.addEventListener("click", () => {
                if (podeReabrir) {
                    window.location.href = `reabrir_os_v2.html?id=${ordem.id}&num=${ordem.numeroOS || ''}`;
                }
            });
        }
        corpoTabelaOrdens.appendChild(tr);
    });
}

// Adicionar listeners para botões de filtro
const btnAplicarFiltros = document.getElementById("btnAplicarFiltros");
if (btnAplicarFiltros) {
    btnAplicarFiltros.addEventListener("click", () => {
        const statusSelecionados = getSelectedStatusValuesGerenciamento();
        
        // Mapeamento correto dos campos do frontend para os nomes esperados pelo backend/Notion
        const filtros = {
            // Mapear para o campo correto no Notion (O.S. -> unique_id)
            "O.S.": document.getElementById("filtroNumOS").value.trim(),
            
            // Mapear para o campo correto no Notion (Cliente -> relation)
            Cliente: document.getElementById("filtroCliente").value.trim(),
            
            // Mapear para o campo correto no Notion (LOCAL -> relation)
            LOCAL: document.getElementById("filtroLocal").value.trim(),
            
            // Mapear para o campo correto no Notion (Status -> status)
            Status: (statusSelecionados.length === 1 && statusSelecionados[0] === "") ? null : statusSelecionados.join(","),
            
            // Mapear para os campos corretos no Notion (datas)
            "Agendamento Inicial": document.getElementById("filtroAgInicial").value,
            "Agendamento Final": document.getElementById("filtroAgFinal").value,
            
            // Mapear para os campos corretos no Notion
            Responsável: document.getElementById("filtroResponsavel").value.trim(),
            Equipe: document.getElementById("filtroPrestador").value.trim(),
        };
        
        // Remover campos vazios
        Object.keys(filtros).forEach(key => {
            if (filtros[key] === "" || filtros[key] === null) {
                delete filtros[key];
            }
        });
        
        console.log("Aplicando filtros mapeados:", filtros);
        carregarOrdensGerenciamento(filtros);
    });
}

const btnLimparFiltros = document.getElementById("btnLimparFiltros");
if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener("click", () => {
        document.getElementById("filtroNumOS").value = "";
        document.getElementById("filtroCliente").value = "";
        document.getElementById("filtroLocal").value = "";
        resetMultiSelectStatusGerenciamento(); // Reseta o novo multi-select
        document.getElementById("filtroAgInicial").value = "";
        document.getElementById("filtroAgFinal").value = "";
        document.getElementById("filtroResponsavel").value = "";
        document.getElementById("filtroPrestador").value = "";
        carregarOrdensGerenciamento({});
    });
}

