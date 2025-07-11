import express from "express";
import db from "./src/config/db.js";
import comanda from "./src/models/comandaModel.js";
import cors from "cors";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import https from "https";
import { fileURLToPath } from "url";
import modeloLogar from "./src/models/userLogado.js";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";

// Em um ambiente de produção, a chave secreta NUNCA deve ser hardcoded.
// Use variáveis de ambiente. Ex: process.env.JWT_SECRET
const Secret = "seu-segredo-super-secreto-e-longo";

//import { Socket } from "dgram";
import produto from "./src/models/precomodel1.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
const DADOS_CRIPTOGRAFAR = {
  algoritmo: "aes256",
  segredo: "chaves",
  tipo: "hex",
};

// Função para criar o hash da senha com salt
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hashedPassword = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashedPassword}`;
}

// Função para verificar a senha de forma segura
function verifyPassword(password, hash) {
  const [salt, storedHash] = hash.split(":");
  const hashBuffer = Buffer.from(storedHash, "hex");
  const derivedKey = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, derivedKey);
}

const server = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, "src", "cert", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "src", "cert", "server.crt")),
  },
  app
);
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
var valorArecadado = 0;
//
//acesar imagem do icone de lapis
app.get("/admin/iconelapis1.png", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconelapis1.png"));
});
//
//acesar imagem do icone de lapis
app.get("/fundopousada.jpg", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/fundopousada.jpg"));
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
//cria funsao de verificar token
async function verificarToken(req, res, next) {
  const buscarToken = await modeloLogar.find({ token: req.params.token });
  if (buscarToken) {
    jwt.verify(req.params.token, Secret, (err, decoded) => {
      if (err) {
        return res.send("token invalido");
      } else {
        next();
      }
    });
  } else {
    res.status(403).json({
      message: "acesso negado",
    });
  }
}
//
//acesar pagina principal (agora protegida)
app.get("/admin/:token", verificarToken, async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/index.html"));
});
//
//acesar a pagina para fazer pedidos
app.get("/cardapio", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/pedidos.html"));
});
//
//acesar a pagina para fazer pedidos
app.get("/iconecarinho.png", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconecarinho.png"));
});
//
//acesar pagina ´para alterar produtos
app.get("/alterar", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/pedidos1.html"));
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
  const mesaCliente = req.body.mesa;
  const pedidoCliente = req.body.pedido;
  const valorCliente = await CalcularPreco(pedidoCliente);
  if (valorCliente != 0) {
    const comandaCliente = {
      mesa: mesaCliente,
      pedido: pedidoCliente,
      valor: valorCliente,
    };
    const comandaCriada = await comanda.create(comandaCliente);
    res.status(201).json({ message: "comanda criada com suceso" });
    io.emit("NovaComanda", comandaCriada);
  } else {
    res.status(500).send({ message: 0 });
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
        (produto) =>
          produto.nomeProduto.toLowerCase() === item.nomePedido.toLowerCase()
      );
      if (produtoEncontrado) {
        vTotal += produtoEncontrado.valor * item.quantidade;
      } else {
        vTotal = 0;
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
app.get("/Produtos", async (req, res) => {
  const produtos = await produto.find();
  res.json(produtos);
});
app.get("/produto/:id", async (req, res) => {
  const produto1 = await produto.findById(req.params.id);
  res.json(produto1);
});
app.post("/produto", async (req, res) => {
  console.log(req.body);
  try {
    const nomeProduto = req.body.nomeProduto;
    const ingredientes = req.body.ingredientes;
    const valor = req.body.valor;
    const tipoProduto = req.body.tipoProduto;
    const produtoNovo = {
      nomeProduto: nomeProduto,
      ingredientes: ingredientes,
      valor: valor,
      tipoProduto: tipoProduto,
    };
    const novoProduto = await produto.create(produtoNovo);
    console.log(novoProduto);
    res.status(201).send(novoProduto);
  } catch (err) {
    res.status(500).send("deu erro ao criar produto");
  }
});
app.put("/produto/:id", async (req, res) => {
  const id = req.params.id;
  /*const novoProduto = {
    nomeProduto: req.body.nome.toLowerCase() || null,
    ingredientes: req.body.ingredientes || null,
    valor: req.body.valor || null,
  };
  */
  console.log(req.body);
  const novo = await produto.findByIdAndUpdate(id, req.body, { new: true });
  res.json(novo);
});
app.delete("/produto/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deletar = await produto.findByIdAndDelete(id);
    res.status(200).json("deletado com sucesso");
  } catch (err) {
    res.status(500).send("não foi possivel deletar");
  }
});
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname + "/src/pagina/login.html"));
});
//
app.post("/cadastro", async (req, res) => {
  const { usuario, senha, nomeEstabelecimento } = req.body;
  try {
    const token = await jwt.sign(
      { usuario: usuario, nomeEstabelecimento: nomeEstabelecimento },
      Secret,
      { expiresIn: "1h" } // Token expira em 1 hora
    );
    const senhaHasheada = hashPassword(senha);
    const novoUsuario = await modeloLogar.create({
      nomeUsuario: usuario,
      hashSenha: senhaHasheada,
      nomeEstabelecimento: nomeEstabelecimento,
      token: token,
      ip: req.ip,
    });

    res.status(200).send({ auth: true, token: token });
  } catch (err) {
    console.error("Erro no cadastro:", err);
    res.status(500).json({ message: "Erro interno ao cadastrar usuário." });
  }
});

app.get("/deletar/estabelecimento", async (req, res) => {
  await modeloLogar.deleteMany();
  res.send("tudo deletado");
});
app.get("/deletar/estabelecimento/:id", async (req, res) => {
  await modeloLogar.findByIdAndDelete(req.params.id);
  res.send("deletado com sucesso");
});
app.get("/estabelecimento/:id", async (req, res) => {
  const estabelecimento = await modeloLogar.findById(req.params.id);
  res.json(estabelecimento);
});
app.get("/estabelecimentos", async (req, res) => {
  const estabelecimento = await modeloLogar.find();
  res.json(estabelecimento);
});
// Rota de Login
app.post("/", async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res
      .status(400)
      .json({ message: "Usuário e senha são obrigatórios." });
  }

  try {
    const usuarioEncontrado = await modeloLogar.findOne({
      nomeUsuario: usuario,
    });

    if (!usuarioEncontrado) {
      // Resposta genérica para não informar se o usuário existe ou não
      return res.status(401).json({ message: "Usuário ou senha inválidos." });
    }

    const senhaValida = verifyPassword(senha, usuarioEncontrado.hashSenha);

    if (!senhaValida) {
      return res.status(401).json({ message: "Usuário ou senha inválidos." });
    }
    // Gerar o token JWT
    res.status(200).json({ auth: true, token: usuarioEncontrado.token });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});
app.get("/titulo/:token", async (req, res) => {
  const titulo = await modeloLogar.find({ token: req.params.token });
  if (titulo) {
    res.json(titulo[0].nomeEstabelecimento);
  } else {
    res.status(403).json({
      message: "acesso negado",
    });
  }
});
