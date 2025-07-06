const socket = io();
const comandasRenderizar = document.getElementById("comandas");
function pegarComandas() {
  fetch("/VisualizarComandas", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      for (const comanda of response) {
        // Criar uma string com todos os itens do pedido
        const pedidos = comanda.pedido
          .map((pedido) => pedido.quantidade + " " + pedido.nomePedido)
          .join(", " + "<br>");

        comandasRenderizar.innerHTML += `
          <div id="${comanda._id}" class="comandas">
            <h2><b>${comanda.mesa}</b></h2>
            <li>${pedidos}</li>
            <div class="icone-container">
           <img src="./iconelapis1.png" class="iconelapis" width="40%" height="auto" onclick="AtualizarComanda('${
             comanda._id
           }')">
            </div>
            <div class="botoes">
            <button class="botaoremover" onclick="removerComanda('${
              comanda._id
            }')">Remover</button>
            <button class="botaofinalizar" onclick="FinalizarComanda('${
              comanda._id
            }')">Finalizar</button> <div class="valorcomanda">${
          comanda.valor + ",00"
        }</div>
             
            </div>
          </div>
        `;
      }
    });
}
function removerComanda(comandaId) {
  fetch(`/RemoverComanda/${comandaId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        // Se a remoção for bem-sucedida, remove a comanda da interface
        const comandaElement = document.getElementById(comandaId);
        if (comandaElement) {
          comandaElement.remove();
        }
      } else {
        console.error("Erro ao remover comanda");
      }
    })
    .catch((error) => {
      console.error("Erro ao remover comanda:", error);
    });
}
function FinalizarComanda(comandaId) {
  fetch(`/FinalizarComanda/${comandaId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        // Se a remoção for bem-sucedida, remove a comanda da interface
        const comandaElement = document.getElementById(comandaId);
        if (comandaElement) {
          comandaElement.remove();
        }
      } else {
        console.error("Erro ao remover comanda");
      }
    })
    .catch((error) => {
      console.error("Erro ao remover comanda:", error);
    });
}
socket.on("NovaComanda", (comanda) => {
  // Criar uma string com todos os itens do pedido
  const pedidos = comanda.pedido
    .map((pedido) => pedido.quantidade + " " + pedido.nomePedido)
    .join(", " + "<br>");

  comandasRenderizar.innerHTML += `
 <div id="${comanda._id}" class="comandas">
   <h2><b>${comanda.mesa}</b></h2>
   <li>${pedidos}</li>
   <div class="icone-container">
  <img src="./iconelapis1.png" class="iconelapis" width="40%" height="auto" onclick="AtualizarComanda('${
    comanda._id
  }')">
   </div>
   <div class="botoes">
   <button class="botaoremover" onclick="removerComanda('${
     comanda._id
   }')">Remover</button>
   <button class="botaofinalizar" onclick="FinalizarComanda('${
     comanda._id
   }')">Finalizar</button> <div class="valorcomanda">${
    comanda.valor + ",00"
  }</div>
    
   </div>
 </div>
`;
});
socket.on("ComandaDeletada", (id) => {
  const comandaElement = document.getElementById(id);
  if (comandaElement) {
    comandaElement.remove();
  }
});
//funsao de atualizar comanda
var pedidoSalvo;
function AtualizarComanda(id) {
  const elementComanda = document.getElementById(id);
  fetch(`/comanda/${id}`)
    .then((response) => response.json())
    .then((response) => {
      // Renderiza cada pedido em um card separado
      pedidoSalvo = response.pedido;
      const pedidos = response.pedido
        .map(
          (pedido) => `
          <div id="${pedido._id}" class="pedido-anterior">
            <p class="nome-pedido-alterar"><b>Pedido:</b> ${
              pedido.nomePedido
            }</p>
            <p class="obs-pedido-alterar"><b>Observação:</b> ${
              pedido.obs || "Nenhuma"
            }</p>
            <p class="quantidade-alterar"><b>Quantidade:</b> ${
              pedido.quantidade
            }</p>
            <button class="botaoremover" onclick="RemoverPedido('${
              pedido._id
            }')">Remover</button>
          </div>
          `
        )
        .join(""); // Junta todos os cards de pedidos em uma única string

      // Atualiza o conteúdo da comanda com os pedidos renderizados

      elementComanda.innerHTML = `
       
       
          <h2><b>Mesa: ${response.mesa}</b></h2>  <input type="text" id="numeroMesaAtualizar" placeholder="Digite o novo número da mesa (opcional)"><br>
           <!-- Renderiza os pedidos anteriores -->
        <h3>Pedidos Anteriores:</h3>
          ${pedidos}
         <br>
          <!-- Campos para atualizar a comanda -->
          <!--<input type="text" id="numeroMesaAtualizar" placeholder="Digite o novo número da mesa (opcional)">-->
          <div id="pedido${response._id}">
            <input type="text" class="pedidoComandaAtualizar" placeholder="Digite o novo pedido (opcional)">
            <input type="text" class="obsDoPedido" placeholder="Digite as observações do pedido">
            <input type="number" class="quantidade" placeholder="Digite a quantidade">
          </div>
          <button id="botaoAdicionarInput" onclick="AdicionarInput('${id}')">Adicionar mais um pedido</button>
          <button onclick="enviarAtualizacao('${id}')">Atualizar</button>
       
      `;
    })
    .catch((error) => {
      console.error("Erro ao buscar comanda:", error);
    });
}
//
//funsao de remover pedido
function RemoverPedido(id) {
  const pedidoItem = document.getElementById(id);
  pedidoItem.remove();
  pedidoSalvo.forEach((pedido) => {
    if (pedido._id === id) {
      pedidoSalvo.splice(pedidoSalvo.indexOf(pedido), 1);
    }
  });
  // alert(JSON.stringify(pedidoSalvo));
}
//
//funsao de enviar atualizasao de comanda
function enviarAtualizacao(id) {
  // Captura o valor do input da mesa (se preenchido)
  const numeroMesa = document
    .getElementById("numeroMesaAtualizar")
    .value.trim();

  // Array para armazenar os pedidos
  const pedidos = pedidoSalvo;

  // Captura todos os inputs de pedido, observação e quantidade
  const inputsPedido = document.querySelectorAll(
    `#pedido${id} .pedidoComandaAtualizar`
  );
  const inputsObs = document.querySelectorAll(`#pedido${id} .obsDoPedido`);
  const inputsQuantidade = document.querySelectorAll(
    `#pedido${id} .quantidade`
  );

  // Itera sobre os inputs de pedido
  inputsPedido.forEach((input, index) => {
    const pedido = input.value.trim(); // Remove espaços em branco
    const obs = inputsObs[index].value.trim(); // Remove espaços em branco
    const quantidade = inputsQuantidade[index].value.trim(); // Remove espaços em branco

    // Adiciona o pedido ao array apenas se o nome do pedido for preenchido
    if (pedido) {
      pedidos.push({
        nomePedido: pedido,
        obs: obs || null, // Se a observação estiver vazia, define como null
        quantidade: quantidade || 1, // Se a quantidade estiver vazia, define como 1 (ou outro valor padrão)
      });
    }
  });

  // Objeto de atualização
  const dadosAtualizados = {};

  // Adiciona a mesa ao objeto de atualização apenas se foi preenchida
  if (numeroMesa) {
    dadosAtualizados.mesa = numeroMesa;
  }

  // Adiciona os pedidos ao objeto de atualização apenas se houver pedidos
  if (pedidos.length > 0) {
    dadosAtualizados.pedido = pedidos;
  }

  // Envia a requisição para o servidor
  fetch(`/AtualizarComanda/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dadosAtualizados),
  })
    .then((response) => {
      if (response.ok) {
        // alert("Comanda atualizada com sucesso!");
        // Recarrega as comandas após a atualização
        // comandasRenderizar.innerHTML = "";
        // pegarComandas();
      } else {
        console.error("Erro ao atualizar comanda");
      }
    })
    .catch((error) => {
      console.error("Erro ao atualizar comanda:", error);
    });
}
//
//
function AdicionarInput(id) {
  const elementComanda = document.getElementById("pedido" + id);

  // Cria novos inputs para pedido, observação e quantidade
  const novoPedido = document.createElement("input");
  novoPedido.type = "text";
  novoPedido.className = "pedidoComandaAtualizar";
  novoPedido.placeholder = "Digite o novo pedido(opcional)";

  const novaObs = document.createElement("input");
  novaObs.type = "text";
  novaObs.className = "obsDoPedido";
  novaObs.placeholder = "Digite as observações do pedido";

  const novaQuantidade = document.createElement("input");
  novaQuantidade.type = "number";
  novaQuantidade.className = "quantidade";
  novaQuantidade.placeholder = "Digite a quantidade";

  // Adiciona os novos inputs à div de pedidos
  elementComanda.appendChild(novoPedido);
  elementComanda.appendChild(novaObs);
  elementComanda.appendChild(novaQuantidade);
}
function AdicionarInput2(id) {
  const elementComanda = document.getElementById(id);

  // Cria novos inputs para pedido, observação e quantidade
  const novoPedido = document.createElement("input");
  novoPedido.type = "text";
  novoPedido.className = "pedidoComandaCriar";
  novoPedido.placeholder = "Digite o novo pedido(opcional)";

  const novaObs = document.createElement("input");
  novaObs.type = "text";
  novaObs.className = "obsDoPedido";
  novaObs.placeholder = "Digite as observações do pedido";

  const novaQuantidade = document.createElement("input");
  novaQuantidade.type = "number";
  novaQuantidade.className = "quantidade";
  novaQuantidade.placeholder = "Digite a quantidade";

  // Adiciona os novos inputs à div de pedidos
  elementComanda.appendChild(novoPedido);
  elementComanda.appendChild(novaObs);
  elementComanda.appendChild(novaQuantidade);
}
function adicionarComanda() {
  comandasRenderizar.innerHTML += `
   <div id="criarcomanda1" class="comandas">
  
      <input type="text" id="numeroMesaCriar" placeholder="Digite o novo numero da mesa">
      <div id="inputcriar">
        <input type="text"id="pedidoComandaCriar" class="pedidoComandaCriar" placeholder="Digite o novo pedido(opcional)">
        <input type="text"id="obsDoPedido" class="obsDoPedido" placeholder="Digite as observações do pedido">
        <input type="number"id="quantidade" class="quantidade" placeholder="Digite a quantidade">
      </div>
      <button id="botaoAdicionarInput" onclick="AdicionarInput2('inputcriar')">Adicionar mais um pedido</button>
      <button onclick="criarComanda()">Criar comanda</button>
    </div>`;
}
function criarComanda() {
  const numeroMesa = document.getElementById("numeroMesaCriar").value;
  const pedidos = [];
  const inputsPedido = document.querySelectorAll(
    `#inputcriar .pedidoComandaCriar`
  );
  const inputsObs = document.querySelectorAll(`#inputcriar .obsDoPedido`);
  const inputsQuantidade = document.querySelectorAll(`#inputcriar .quantidade`);

  inputsPedido.forEach((input, index) => {
    const pedido = input.value;
    const obs = inputsObs[index].value;
    const quantidade = inputsQuantidade[index].value;

    if (pedido) {
      pedidos.push({
        nomePedido: pedido,
        obs: obs,
        quantidade: quantidade,
      });
    }
  });

  const dadosAtualizados = {
    mesa: numeroMesa,
    pedido: pedidos,
  };
  fetch(`/CriarComanda`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dadosAtualizados),
  })
    .then((response) => {
      if (response.ok) {
        alert("Comanda criada com sucesso!");
        document.getElementById("criarcomanda1").remove();
        comandasRenderizar.removeChild();

        pegarComandas(); // Recarrega as comandas após a atualização
      }
      if ((response.status = 500)) {
        document.getElementById("criarcomanda1").remove();
        alert(
          "nao foi possivel criar a comanda porque o produto não foi encontrado"
        );
      }
    })
    .catch((error) => {
      console.error("Erro ao criar comanda:", error);
    });
}
socket.on("ComandaAtualizada", (comanda) => {
  // Remove a comanda antiga da interface
  const comandaAntiga = document.getElementById(comanda.id);
  if (comandaAntiga) {
    comandaAntiga.remove();
  }
  comandasRenderizar.innerHTML = "";
  pegarComandas();
  alert("comanda da mesa " + comanda.mesa + " atualizada");
});
const titulo = document.getElementById("titulo");
const token = window.localStorage.getItem("token");
fetch(`/titulo/${token}`, {
  method: "GET",
  headers: {
    Accept: "application/json",
  },
})
  .then((response) => response.json())
  .then((response) => {
    titulo.innerText = response;
  });
