const socket = io();
const comandasRenderizar = document.getElementById("comandas");
const token = window.localStorage.getItem("token");


socket.on("connect", () => {
 
  fetch(`/titulo/${token}`) 
    .then((res) => res.json())
    .then((nomeEstabelecimento) => {
      socket.emit("joinRoom", nomeEstabelecimento);
      const titulo = document.getElementById("titulo");
      titulo.innerText = nomeEstabelecimento;
    })
    .catch((err) => console.error("Erro ao entrar na sala do socket:", err));
});

function pegarComandas() {
  if (!token) {
    alert("Token não encontrado, por favor, faça o login novamente.");
    window.location.href = "/";
    return;
  }
  fetch(`/VisualizarComandas/${token}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      for (const comanda of response) {
        // Criar uma string com todos os itens do pedido
        const pedidos = comanda.pedidos
          .map((pedido) => pedido.quantidade + " " + pedido.nomePedido)
          .join(", " + "<br>");
        // alert(JSON.stringify(comanda));
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
  fetch(`/RemoverComanda/${comandaId}/${token}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
      
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
  const pedidos = comanda.pedidos
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

var pedidoSalvo;
function AtualizarComanda(id) {
  const elementComanda = document.getElementById(id);
  fetch(`/comanda/${id}`, {
    
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((response) => {
    
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
        .join(""); 

      

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


function RemoverPedido(id) {
  const pedidoItem = document.getElementById(id);
  pedidoItem.remove();
  pedidoSalvo.forEach((pedido) => {
    if (pedido._id === id) {
      pedidoSalvo.splice(pedidoSalvo.indexOf(pedido), 1);
    }
  });
  
}


function enviarAtualizacao(id) {
  
  const numeroMesa = document
    .getElementById("numeroMesaAtualizar")
    .value.trim();

 
  const pedidos = pedidoSalvo;

  // Captura todos os inputs de pedido, observação e quantidade
  const inputsPedido = document.querySelectorAll(
    `#pedido${id} .pedidoComandaAtualizar`
  );
  const inputsObs = document.querySelectorAll(`#pedido${id} .obsDoPedido`);
  const inputsQuantidade = document.querySelectorAll(
    `#pedido${id} .quantidade`
  );

  
  inputsPedido.forEach((input, index) => {
    const pedido = input.value.trim();
    const obs = inputsObs[index].value.trim(); 
    const quantidade = inputsQuantidade[index].value.trim(); 

    
    if (pedido) {
      pedidos.push({
        nomePedido: pedido,
        obs: obs || null, 
        quantidade: quantidade || 1, 
      });
    }
  });

 
  const dadosAtualizados = {};

 
  if (numeroMesa) {
    dadosAtualizados.mesa = numeroMesa;
  }

  
  if (pedidos.length > 0) {
    dadosAtualizados.pedido = pedidos;
  }

  
  fetch(`/AtualizarComanda/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Adicionar token para autorização
    },
    body: JSON.stringify(dadosAtualizados),
  })
    .then((response) => {
      if (response.ok) {
      
      } else {
        console.error("Erro ao atualizar comanda");
      }
    })
    .catch((error) => {
      console.error("Erro ao atualizar comanda:", error);
    });
}

function AdicionarInput(id) {
  const elementComanda = document.getElementById("pedido" + id);

  
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

 
  elementComanda.appendChild(novoPedido);
  elementComanda.appendChild(novaObs);
  elementComanda.appendChild(novaQuantidade);
}
function AdicionarInput2(id) {
  const elementComanda = document.getElementById(id);

 
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
        quantidade: quantidade,
      });
    }
  });

  const dadosAtualizados = {
    mesa: numeroMesa,
    pedido: pedidos,
  };
  fetch(`/CriarComanda/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dadosAtualizados),
  })
    .then((response) => {
      if (response.ok) {
        alert("Comanda criada com sucesso!");
        const formCriar = document.getElementById("criarcomanda1");
        if (formCriar) {
          formCriar.remove();
        }
        
      } else {
        return response.json().then((err) => {
          alert(`Erro ao criar comanda: ${err.message}`);
          console.error("Erro ao criar comanda:", err.message);
        });
      }
    })
    .catch((error) => {
      console.error("Erro ao criar comanda:", error);
    });
}
socket.on("ComandaAtualizada", (comanda) => {
  
  const comandaAntiga = document.getElementById(comanda.id);
  if (comandaAntiga) {
    comandaAntiga.remove();
  }
  comandasRenderizar.innerHTML = "";
  pegarComandas();
  alert("comanda da mesa " + comanda.mesa + " atualizada");
});
const titulo = document.getElementById("titulo");
fetch(`/titulo`, {
  
  method: "GET",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  },
})
  .then((response) => response.json())
  .then((response) => {
    titulo.innerText = response;
  });
