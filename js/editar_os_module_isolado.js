/*************************************************************************
 * editar_os_module_isolado.js
 * Módulo isolado para a funcionalidade de Edição de Ordem de Serviço.
 *************************************************************************/

(function() {
    "use strict";

    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : 'https://us-central1-os---perfecta.cloudfunctions.net/api';

    const mostrarMensagemEditarIsolado = (mensagem, tipo = 'info') => {
        let mensagemElement = document.getElementById('isolated-mensagem-sistema');
        if (!mensagemElement) {
            mensagemElement = document.createElement('div');
            mensagemElement.id = 'isolated-mensagem-sistema';
            Object.assign(mensagemElement.style, {
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '10px 20px',
                backgroundColor: tipo === 'erro' ? '#f8d7da' : '#d4edda',
                color: tipo === 'erro' ? '#721c24' : '#155724',
                border: tipo === 'erro' ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
                borderRadius: '4px',
                zIndex: '10000',
                display: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            });
            document.body.appendChild(mensagemElement);
        }
        mensagemElement.className = `isolated-mensagem isolated-mensagem-${tipo}`;
        mensagemElement.textContent = mensagem;
        mensagemElement.style.display = 'block';
        setTimeout(() => {
            if (mensagemElement) {
                mensagemElement.style.display = 'none';
            }
        }, 5000);
    };

    // Função para CARREGAR os dados da OS
    async function getOrdemDetalhadaParaCarregamento(ordemId) {
        try {
            const response = await fetch(`${API_BASE_URL}/gerenciamento_isolado/ordens/${ordemId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Ordem não encontrada para este ID (carregamento original)");
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao buscar detalhes da ordem.' }));
                    throw new Error(errorData.message || `Erro ${response.status} ao buscar detalhes da ordem.`);
                }
            }
            return await response.json();
        } catch (error) {
            console.error('[Carregamento Original] Erro em getOrdemDetalhadaParaCarregamento:', error);
            mostrarMensagemEditarIsolado(error.message || 'Erro ao buscar detalhes da ordem.', 'erro');
            throw error;
        }
    }

    async function getClientesIsolado() {
        try {
            // CORREÇÃO: Removido o sufixo _isolado da rota, que não existe.
            const response = await fetch(`${API_BASE_URL}/clientes`);
            if (!response.ok) throw new Error('Erro ao buscar clientes');
            return await response.json();
        } catch (error) {
            console.error('[Edição Dedicada] Erro em getClientesIsolado:', error);
            mostrarMensagemEditarIsolado('Não foi possível carregar a lista de clientes.', 'erro');
            return [];
        }
    }

    async function getLocaisPorClienteIsolado(clienteId) {
        try {
            // CORREÇÃO: Removido o sufixo _isolado da rota, que não existe.
            const response = await fetch(`${API_BASE_URL}/locais/cliente/${clienteId}`);
            if (!response.ok) throw new Error('Erro ao buscar locais do cliente');
            return await response.json();
        } catch (error) {
            console.error('[Edição Dedicada] Erro em getLocaisPorClienteIsolado:', error);
            mostrarMensagemEditarIsolado('Não foi possível carregar os locais para o cliente selecionado.', 'erro');
            return [];
        }
    }

    // Função para ATUALIZAR/SALVAR os dados da OS
    async function atualizarOrdemPelaRotaDedicada(ordemId, dadosParaAtualizar) {
        try {
            const response = await fetch(`${API_BASE_URL}/edicao_os_dedicada/ordens/${ordemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosParaAtualizar)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao atualizar ordem.' }));
                throw new Error(errorData.message || `Erro ${response.status} ao atualizar ordem de serviço.`);
            }
            return await response.json();
        } catch (error) {
            console.error('[Edição Dedicada - Salvar] Erro em atualizarOrdemPelaRotaDedicada:', error);
            mostrarMensagemEditarIsolado(error.message || 'Erro ao atualizar ordem de serviço.', 'erro');
            throw error;
        }
    }
    
    let clienteIdGlobalEditarIsolado = null;
    let todosClientesIsolado = [];

    document.addEventListener("DOMContentLoaded", async () => {
        if (!document.getElementById("formEditarOS")) {
            return;
        }
        const formEditarOS = document.getElementById("formEditarOS");
        const loadingMessage = document.getElementById("loadingMessage");
        const numeroOSInput = document.getElementById("numeroOS");
        const clienteSelect = document.getElementById("clienteSelect");
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
        const statusSelect = document.getElementById("status");
        const urlParams = new URLSearchParams(window.location.search);
        const ordemId = urlParams.get("id");

        if (!ordemId) {
            if(loadingMessage) loadingMessage.textContent = "Erro: ID da Ordem de Serviço não encontrado na URL.";
            if(loadingMessage) loadingMessage.style.color = "red";
            return;
        }

        const popularSelect = (selectElement, options, valueField = 'id', textField = 'name', selectedValue = null) => {
            if (!selectElement) return;
            selectElement.innerHTML = '<option value="">Selecione...</option>';
            if (!options || !Array.isArray(options)) {
                options = []; 
            }
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
            if (!selectElement) return;
            selectElement.innerHTML = '';
            if (!options || !Array.isArray(options)) {
                options = [];
            }
            let effectiveSelectedValues = Array.isArray(selectedValues) ? selectedValues.map(String) : [String(selectedValues)];
            options.forEach(option => {
                const optionElement = document.createElement('option');
                const val = option[valueField];
                optionElement.value = val;
                optionElement.textContent = option[textField];
                if (effectiveSelectedValues.includes(String(val))) {
                    optionElement.selected = true;
                }
                selectElement.appendChild(optionElement);
            });
        };

        async function carregarDadosOriginaisDaOS() {
            try {
                if(loadingMessage) loadingMessage.textContent = "Carregando dados da O.S. ...";
                if(formEditarOS) formEditarOS.style.display = "none";
                const ordem = await getOrdemDetalhadaParaCarregamento(ordemId);
                if (!ordem) {
                    throw new Error("Dados da ordem não encontrados.");
                }
                clienteIdGlobalEditarIsolado = ordem.clienteId;
                
                if(numeroOSInput) numeroOSInput.value = ordem.numeroOS || "-";
                if(enderecoInput) enderecoInput.value = ordem.endereco || ordem.enderecoCompleto || ordem.enderecoOS || ordem.clienteEndereco || "-"; 
                if(cidadeInput) cidadeInput.value = ordem.cidade || ordem.cidadeOS || ordem.clienteCidade || "-";
                
                // Carregar clientes
                todosClientesIsolado = await getClientesIsolado();
                popularSelect(clienteSelect, todosClientesIsolado, 'id', 'nome', ordem.clienteId);

                const opcoes = ordem.opcoes || {};
                popularSelect(localSelect, opcoes.locais || [], 'id', 'nome', ordem.localId);
                popularMultiSelect(prestadoresSelect, opcoes.equipes || [], 'name', 'name', ordem.prestadores || []);
                popularSelect(responsavelSelect, opcoes.responsaveis || [], 'name', 'name', ordem.responsavel);
                popularSelect(tipoServicoSelect, opcoes.tiposServico || [], 'name', 'name', ordem.tipoServico);
                popularSelect(statusSelect, opcoes.statusOptions || [], 'name', 'name', ordem.status);
                
                if(agendamentoInicialInput) agendamentoInicialInput.value = ordem.agendamentoInicial ? ordem.agendamentoInicial.split("T")[0] : "";
                if(agendamentoFinalInput) agendamentoFinalInput.value = ordem.agendamentoFinal ? ordem.agendamentoFinal.split("T")[0] : "";
                if(servicosTextarea) servicosTextarea.value = ordem.servicosExecutados || ordem.servicos || "";
                if(observacoesTextarea) observacoesTextarea.value = ordem.observacoes || "";
                
                if(loadingMessage) loadingMessage.style.display = "none";
                if(formEditarOS) formEditarOS.style.display = "block";
                if(btnAlterar) btnAlterar.disabled = false;
            } catch (error) {
                console.error("[Carregamento Original] Erro ao carregar dados da OS:", error);
                if(loadingMessage) loadingMessage.textContent = `Erro ao carregar dados: ${error.message}. Tente recarregar a página.`;
                if(loadingMessage) loadingMessage.style.color = "red";
                if(btnAlterar) btnAlterar.disabled = true;
            }
        }
        
        clienteSelect.addEventListener('change', async (e) => {
            const novoClienteId = e.target.value;
            if (!novoClienteId) {
                enderecoInput.value = '';
                cidadeInput.value = '';
                localSelect.innerHTML = '<option value="">Selecione um cliente</option>';
                return;
            }
    
            const clienteSelecionado = todosClientesIsolado.find(c => c.id === novoClienteId);
            if (clienteSelecionado) {
                clienteIdGlobalEditarIsolado = novoClienteId;
                enderecoInput.value = clienteSelecionado.endereco || '';
                cidadeInput.value = clienteSelecionado.cidade || '';
    
                localSelect.innerHTML = '<option value="">Carregando locais...</option>';
                // CORREÇÃO FINAL: O ID do cliente para a API do Notion não deve conter hífens.
                const idSemHifens = novoClienteId.replace(/-/g, '');
                const novosLocais = await getLocaisPorClienteIsolado(idSemHifens);
                popularSelect(localSelect, novosLocais, 'id', 'nome');
            }
        });

        async function handleAlterarOSUsandoRotaDedicada(event) {
            event.preventDefault();
            if(btnAlterar) btnAlterar.disabled = true;
            if(btnAlterar) btnAlterar.textContent = "Salvando...";
            try {
                const dadosNotion = {
                    agendamentoInicial: agendamentoInicialInput ? agendamentoInicialInput.value : null,
                    agendamentoFinal: agendamentoFinalInput ? agendamentoFinalInput.value : null,
                    prestadores: prestadoresSelect ? Array.from(prestadoresSelect.selectedOptions).map(option => option.value) : [],
                    responsavel: responsavelSelect ? responsavelSelect.value : null,
                    tipoServico: tipoServicoSelect ? tipoServicoSelect.value : null,
                    servicos: servicosTextarea ? servicosTextarea.value : null,
                    observacoes: observacoesTextarea ? observacoesTextarea.value : null,
                    status: statusSelect ? statusSelect.value : null,
                };
                
                const selectedClienteOption = clienteSelect.options[clienteSelect.selectedIndex];
                const dadosFirebase = {
                    ...dadosNotion,
                    clienteId: clienteSelect.value,
                    localId: localSelect.value,
                    clienteNome: selectedClienteOption ? selectedClienteOption.text : '',
                    localNome: localSelect && localSelect.selectedIndex >= 0 && localSelect.options[localSelect.selectedIndex].text,
                    enderecoOS: enderecoInput ? enderecoInput.value : null,
                    cidadeOS: cidadeInput ? cidadeInput.value : null,
                    numeroOS: numeroOSInput ? numeroOSInput.value : null
                };
                const payloadCompleto = {
                    notionData: dadosNotion,
                    firebaseData: dadosFirebase
                };
                await atualizarOrdemPelaRotaDedicada(ordemId, payloadCompleto);
                mostrarMensagemEditarIsolado("Ordem de Serviço atualizada com sucesso! Redirecionando...", "info");
                setTimeout(() => {
                    window.location.replace("gerenciamento.html"); 
                }, 2000);
            } catch (error) {
                console.error("[Edição Dedicada - Salvar] Erro ao atualizar OS:", error);
                mostrarMensagemEditarIsolado(`Erro ao atualizar Ordem de Serviço: ${error.message}`, 'erro');
                if(btnAlterar) btnAlterar.disabled = false;
                if(btnAlterar) btnAlterar.textContent = "Alterar";
            }
        }

        if (btnAlterar) {
            btnAlterar.addEventListener("click", handleAlterarOSUsandoRotaDedicada);
        }
        
        const btnCancelar = document.getElementById("btnCancelar");
        if (btnCancelar) {
            btnCancelar.addEventListener("click", function() {
                window.location.replace("gerenciamento.html");
            });
        }
        
        if (formEditarOS) {
            carregarDadosOriginaisDaOS();
        }
    });
})();
