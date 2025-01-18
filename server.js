import express from "express";
import db from "./src/config/db.js";
import comanda from "./src/models/comandaModel.js";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import http from "http";
import { fileURLToPath } from "url";
import produto from "./src/preco/precomodel.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);
server.listen(8080, () => console.log("rodando na porta 8080"));
try {
  db.on("error", console.log.bind(console, "Erro de conexão"));
  db.once("open", () => {
    console.log("conexão com o banco feita com sucesso");
  });
} catch (err) {
  console.log(err);
}
app.use(express.json());
var valorArecadado = 0;
//
//acesar imagem do icone de lapis
app.get("/iconelapis1.png", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconelapis1.png"));
});
//
//acesar imagem do icone de lapis
app.get("/adicionar.png", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/adicionar.png"));
});
//
//acesar icone de cancelar
app.get("/iconecancelar.png", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconecancelar.png"));
});
//
//acesar pagina principal
app.get("/admin", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/index.html"));
});
//
//acesar a pagina para fazer pedidos
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/pedidos.html"));
});
//
//acesar o css da pagina
app.get("/style.css", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/style.css"));
});
//
//acesar o javascript da pagina
app.get("/script.js", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/script.js"));
});
//
//visializar todas as comandas
app.get("/VisualizarComandas", async (req, res) => {
  try {
    const comandas = await comanda.find();
    res.json(comandas);
  } catch (err) {
    res.status(500).json({
      message: "ocoreu um erro interno ao tentar visualizar as comandas",
      err,
    });
  }
});
//
//criar comanda
app.post("/CriarComanda", async (req, res) => {
  try {
    const mesaCliente = req.body.mesa;
    const pedidoCliente = req.body.pedido;
    const valorCliente = await CalcularPreco(pedidoCliente);
    const comandaCliente = {
      mesa: mesaCliente,
      pedido: pedidoCliente,
      valor: valorCliente,
    };
    const comandaCriada = await comanda.create(comandaCliente);
    res.status(201).json({ message: "comanda criada com suceso" });
    io.emit("NovaComanda", comandaCriada);
  } catch (err) {
    res
      .status(500)
      .json({ message: "ocoreu um erro interno ao criar a comanda", err });
  }
});
//
//procurarComandaporId
app.get("/comanda/:id", async (req, res) => {
  const id = req.params.id;
  const comanda = await procurarComandaporId(id);
  res.status(200).json(JSON.parse(comanda));
});
//
//funsao para procurar comanda pelo seu id
async function procurarComandaporId(id) {
  const comandaPeloId = await comanda.findById(id);
  return JSON.stringify(comandaPeloId);
}
//
//atualizar uma comanda
app.put("/AtualizarComanda/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { mesa, pedido } = req.body;

    // Objeto para armazenar as alterações
    const alteracoes = {};

    // Verifica se a mesa foi enviada e adiciona ao objeto de alterações
    if (mesa !== undefined) {
      alteracoes.mesa = mesa;
    }

    // Verifica se o pedido foi enviado e recalcula o valor
    if (pedido !== undefined) {
      alteracoes.pedido = pedido;
      alteracoes.valor = await CalcularPreco(pedido);
    }

    // Atualiza a comanda no banco de dados com as alterações
    const comandaAtualizada = await comanda.findByIdAndUpdate(id, alteracoes, {
      new: true,
    });

    res.json({ message: "comanda atualizada com sucesso", comandaAtualizada });
    io.emit("ComandaAtualizada", comandaAtualizada);
  } catch (err) {
    res
      .status(500)
      .json({ message: "ocorreu um erro interno ao atualizar a comanda", err });
  }
});
//
//deletar uma comanda
app.delete("/RemoverComanda/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await comanda.findByIdAndDelete(id);
    res.json({ message: "comanda removida com suceso" });
    io.emit("ComandaDeletada", id);
  } catch (err) {
    res
      .status(500)
      .json({ message: "ocoreu um erro interno ao deletar a comanda" });
  }
});
app.delete("/FinalizarComanda/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const procurarComanda = await comanda.findById(id);
    valorArecadado += procurarComanda.valor;
    await comanda.findByIdAndDelete(id);
    res.json({ message: "comanda removida com suceso" });
    io.emit("ComandaDeletada", id);
  } catch (err) {
    res
      .status(500)
      .json({ message: "ocoreu um erro interno ao deletar a comanda" });
  }
});
//
//ver o total arecadado
app.get("/ValorArecadado", (req, res) => {
  res.json({ valorArecadado });
});
//

//parte de produtos
//funsao de calcular preco
async function CalcularPreco(pedido) {
  try {
    let vTotal = 0;
    const produtos = await produto.find();
    pedido.forEach((item) => {
      const produtoEncontrado = produtos.find(
        (produto) => produto.nomeProduto === item.nomePedido
      );
      if (produtoEncontrado) {
        vTotal += produtoEncontrado.valor * item.quantidade;
      } else {
        console.warn(
          `Produto "${item.nomePedido}" não encontrado no banco de dados.`
        );
      }
    });

    return vTotal;
  } catch (err) {
    console.error("Erro ao calcular preço:", err);
    throw new Error("Ocorreu um erro interno ao calcular o preço.");
  }
}
//
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await produto.find();
    res.json(produtos);
  } catch (err) {
    res.send({ message: "erro no produto", err });
  }
});
