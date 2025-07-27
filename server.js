import express from "express";
import db from "./src/config/db.js";
import comanda from "./src/models/comandaModel.js";
import cors from "cors";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import https from "https";
import { fileURLToPath } from "url";
import modeloLogar from "./src/models/userLogado.js";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";


const Secret = "jejf348j8qfj43fjrejf9g34fdjq93pjf9p349fjaqrifk034kfe";


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
  return { hashedPassword, salt };
  // return `${salt}:${hashedPassword}`;
}

// Função para verificar a senha de forma segura
function verifyPassword(password, hash, salt) {
  //const [salt, storedHash] = hash.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
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


io.on("connection", (socket) => {
  console.log("Um usuário se conectou:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} entrou na sala ${room}`);
  });
});
try {
  db.on("error", console.log.bind(console, "Erro de conexão"));
  db.once("open", () => {
    console.log("conexão com o banco feita com sucesso");
  });
} catch (err) {
  console.log(err);
}
var valorArecadado = 0;

app.get("/index/:token", verificarToken, async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/rotas1.html"));
});

app.get("/admin/iconelapis1.png", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconelapis1.png"));
});

app.get("/fundopousada.jpg", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/fundopousada.jpg"));
});

app.get("/adicionar.png", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/adicionar.png"));
});

app.get("/iconecancelar.png", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconecancelar.png"));
});

function verificarToken(req, res, next) {
  const token = req.params.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, Secret, async (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ message: "Token inválido ou expirado." });
    }
   
    const usuario = await modeloLogar.findOne({
      token: token,
    });
    if (!usuario) {
      return res.status(403).json({ message: "Token não é mais válido." });
    }
    // Adiciona os dados do usuário decodificados ao objeto req para uso posterior
    next();
  });
}

app.get("/admin/:token", verificarToken, async (req, res) => {
  // Removido o token da URL
  res.sendFile(path.join(__dirname, "./src/pagina/index.html"));
});

app.get("/style.css", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/style.css"));
});

app.get("/script.js", async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/script.js"));
});

app.get("/cardapio/:nomeEstabelecimento", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/pedidos.html"));
});

app.get("/iconecarinho.png", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconecarinho.png"));
});

app.get(
  "/alterar/:token/:nomeEstabelecimento",
  verificarToken,
  async (req, res) => {
    res.sendFile(path.join(__dirname, "./src/pagina/pedidos1.html"));
  }
);

app.get("/VisualizarComandas/:token", verificarToken, async (req, res) => {
  try {
    // O middleware `verificarToken` já nos deu `req.user`
    const estabelecimento = await modeloLogar.findOne({
      token: req.params.token,
    });
    if (!estabelecimento) {
      return res
        .status(404)
        .json({ message: "Estabelecimento não encontrado." });
    }

    res.status(200).json(estabelecimento.comandas);
  } catch (err) {
    res.status(500).json({
      message: "ocoreu um erro interno ao tentar visualizar as comandas",
      err,
    });
  }
});

app.post("/CriarComanda/:token", verificarToken, async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas o dia
    const hojeString = hoje.toDateString(); // Ex: "Sat Jul 26 2025"

    const estabelecimento = await modeloLogar.findOne({
      token: req.params.token,
    });

    if (!estabelecimento) {
      return res
        .status(404)
        .json({ message: "Estabelecimento não encontrado." });
    }

    const { mesa, pedido } = req.body;

    if (!mesa || !pedido || !Array.isArray(pedido) || pedido.length === 0) {
      return res
        .status(400)
        .json({ message: "Dados inválidos para criar comanda." });
    }

    const valorTotal = await calcularValorTotal(
      pedido,
      estabelecimento.nomeEstabelecimento
    );
    //
    if (valorTotal >= 1) {
      const novaComanda = {
        _id: new mongoose.Types.ObjectId(), // Garante um ID único para a comanda
        mesa: mesa,
        pedidos: pedido,
        valor: valorTotal,
      };

     
      let indexDia = -1;
      for (let i = 0; i < estabelecimento.valorArecadado.length; i++) {
       
        if (
          new Date(estabelecimento.valorArecadado[i].dia).toDateString() ===
          hojeString
        ) {
          indexDia = i;
          break;
        }
      }

      let updateOperation = {
        $push: { comandas: novaComanda }, // Sempre adiciona a nova comanda
      };

      if (indexDia !== -1) {
       
        updateOperation.$inc = {};
        updateOperation.$inc[`valorArecadado.${indexDia}.valor`] = valorTotal;
        updateOperation.$inc[`valorArecadado.${indexDia}.numeroComandas`] = 1;
        console.log("Registro existente atualizado para hoje.");
      } else {
       
        const novoRegistroDia = {
          valor: valorTotal,
          numeroComandas: 1,
          dia: hojeString, 
          _id: new mongoose.Types.ObjectId(), 
        };
        updateOperation.$push.valorArecadado = novoRegistroDia; 
        console.log("Novo registro criado para hoje.");
      }

   
      const documentoAtualizado = await modeloLogar.findOneAndUpdate(
        { token: req.params.token }, 
        updateOperation, 
        { new: true } 
      );

      if (!documentoAtualizado) {
        return res
          .status(500)
          .json({ message: "Erro ao atualizar o estabelecimento." });
      }

      console.log("Documento atualizado com sucesso!");
      io.to(estabelecimento.nomeEstabelecimento).emit(
        "NovaComanda",
        novaComanda
      );
      return res
        .status(201)
        .json({ message: "Comanda criada com sucesso!", comanda: novaComanda });
    } else {
      res.status(300).json({ message: "produto nao encontrado" });
    }
  } catch (err) {
    console.error("Erro ao criar comanda:", err); 
    res
      .status(500)
      .json({ message: "Erro ao criar comanda.", error: err.message });
  }
});


app.get("/comanda/:id", async (req, res) => {
  const id = req.params.id;
  const comanda = await procurarComandaporId(id);
  res.status(200).json(JSON.parse(comanda));
});

async function procurarComandaporId(id) {
  const comandaPeloId = await modeloLogar.findById(id);
  return JSON.stringify(comandaPeloId);
}

app.put("/AtualizarComanda/:id/:token", verificarToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { mesa, pedido } = req.body;

   
    const alteracoes = {};

  
    if (mesa !== undefined) {
      alteracoes.mesa = mesa;
    }

    /
    if (pedido !== undefined) {
      alteracoes.pedido = pedido;
      alteracoes.valor = await CalcularPreco(pedido);
    }

    
    const comandaAtualizada = await modeloLogar.findByIdAndUpdate(
      id,
      alteracoes,
      {
        new: true,
      }
    );

    res.json({ message: "comanda atualizada com sucesso", comandaAtualizada });
    io.to(comandaAtualizada.nomeEstabelecimento).emit(
      "ComandaAtualizada",
      comandaAtualizada
    );
  } catch (err) {
    res
      .status(500)
      .json({ message: "ocorreu um erro interno ao atualizar a comanda", err });
  }
});

app.delete("/RemoverComanda/:id/:token", verificarToken, async (req, res) => {
  try {
    const hoje = new Date(); // Obtenha a data atual
    hoje.setHours(0, 0, 0, 0); // Zere as horas para pegar o início do dia

   
    const hojeFormatado = hoje.toISOString().split("T")[0];

    const idComanda = req.params.id;

    const usuario = await modeloLogar.findOne({
      token: req.params.token,
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const comandaParaRemover = usuario.comandas.find(
      (comanda) => comanda._id.toString() === idComanda
    );

    if (!comandaParaRemover) {
      return res.status(404).json({ message: "Comanda não encontrada." });
    }

    const valorASubtrair = comandaParaRemover.valor;

    let indexDia = -1;
    for (let i = 0; i < usuario.valorArecadado.length; i++) {
    
      const diaArray = new Date(usuario.valorArecadado[i].dia)
        .toISOString()
        .split("T")[0];

      if (diaArray === hojeFormatado) {
        indexDia = i;
        break;
      }
    }

    const updateInc = {};
    if (indexDia !== -1) {
      updateInc[`valorArecadado.${indexDia}.valor`] = -valorASubtrair;
      updateInc[`valorArecadado.${indexDia}.numeroComandas`] = -1;
    } else {
      console.warn(
        "Comanda deletada de um dia que não existe no valorArecadado para o token:",
        req.params.token,
        "Dia de hoje:",
        hojeFormatado
      );
    
    }

    const comandaRemovida = await modeloLogar.findOneAndUpdate(
      {
        token: req.params.token,
      },
      {
        $pull: { comandas: { _id: idComanda } },
        $inc: updateInc,
      },
      { new: true }
    );

    if (comandaRemovida) {
      io.to(comandaRemovida.nomeEstabelecimento).emit(
        "ComandaDeletada",
        idComanda
      );
      res.json({ message: "Comanda removida com sucesso!" });
    } else {
      res
        .status(500)
        .json({ message: "Erro ao remover comanda ou token inválido." });
    }
  } catch (err) {
    console.error("Erro ao deletar a comanda:", err);
    res
      .status(500)
      .json({ message: "Ocorreu um erro interno ao deletar a comanda." });
  }
});
//
app.delete("/FinalizarComanda/:id/:token", async (req, res) => {
  try {
    const id = req.params.id;
    const procurarComanda = await modeloLogar.findById(id);
    valorArecadado += procurarComanda.valor;
    await modeloLogar.findByIdAndDelete(id);
    res.json({ message: "comanda finalizada com suceso" });
    if (procurarComanda) {
      io.to(procurarComanda.nomeEstabelecimento).emit("ComandaDeletada", id);
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "ocoreu um erro interno ao deletar a comanda" });
  }
});

app.get("/ValorArecadado", (req, res) => {
  res.json({ valorArecadado });
});
//
//
async function calcularValorTotal(pedidos, nomeEstabelecimento) {
  try {
    let valorTotal = 0;
    const estabelecimento = await modeloLogar.findOne({
      nomeEstabelecimento: nomeEstabelecimento,
    });

    if (!estabelecimento) {
      throw new Error(
        `Estabelecimento "${nomeEstabelecimento}" não encontrado.`
      );
    }

    for (const item of pedidos) {
      const produtoEncontrado = estabelecimento.produtos.find(
        (produto) =>
          produto.nomeProduto.toLowerCase() === item.nomePedido.toLowerCase()
      );

      if (produtoEncontrado) {
        valorTotal += produtoEncontrado.valor * item.quantidade;
      } else {
        console.warn(
          `Produto "${item.nomePedido}" não encontrado no cardápio do estabelecimento.`
        );
       
      }
    }

    return valorTotal;
  } catch (err) {
    console.error("Erro ao calcular valor total:", err);
    throw new Error("Erro ao calcular valor total do pedido.");
  }
}
//
app.get("/Produtos", verificarToken, async (req, res) => {
  const produtos = await modeloLogar.find({
    nomeUsuario: req.user.usuario,
  });
  console.log(produtos);
  res.json(produtos);
});
app.get("/buscar-produtos/:nomeEstabelecimento", async (req, res) => {
  try {
    const produto = await modeloLogar.find({
      nomeEstabelecimento: req.params.nomeEstabelecimento,
    });
    

    console.log(produto);
    res.send(produto[0].produtos);
  } catch (err) {
    console.log(err);
    res.send("deu erro");
  }
});
app.post("/produto/:nomeEstabelecimento", async (req, res) => {
  try {
    const { nomeEstabelecimento } = req.params;
    const { nomeProduto, ingredientes, valor, tipoProduto } = req.body;
    console.log(req.params.nomeEstabelecimento);
    if (!nomeProduto || valor === undefined || !tipoProduto) {
      return res
        .status(400)
        .json({ message: "Nome, valor e tipo do produto são obrigatórios." });
    }

 
    const produtoNovo = {
      _id: new mongoose.Types.ObjectId(), 
      nomeProduto: nomeProduto,
      ingredientes: ingredientes || [],
      valor: valor,
      tipoProduto: tipoProduto,
    };

    
    const resultado = await modeloLogar.updateOne(
      { nomeEstabelecimento: nomeEstabelecimento },
      { $push: { produtos: produtoNovo } }
    );

    if (resultado.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Estabelecimento não encontrado." });
    }

    if (resultado.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "Falha ao adicionar o produto ao estabelecimento." });
    }

    
    res.status(201).json({
      message: "Produto adicionado com sucesso.",
      produto: produtoNovo,
    });
  } catch (err) {
    console.error("Erro ao adicionar produto:", err);
    res
      .status(500)
      .json({ message: "Ocorreu um erro interno ao adicionar o produto." });
  }
});
app.put("/produto/:nomeEstabelecimento/:id", async (req, res) => {
  try {
    const { id, nomeEstabelecimento } = req.params;
    const { nomeProduto, ingredientes, valor, tipoProduto } = req.body;

    
    const camposParaAtualizar = {};
    if (nomeProduto !== undefined) {
      camposParaAtualizar["produtos.$.nomeProduto"] = nomeProduto;
    }
    if (ingredientes !== undefined) {
      camposParaAtualizar["produtos.$.ingredientes"] = ingredientes;
    }
    if (valor !== undefined) {
      camposParaAtualizar["produtos.$.valor"] = valor;
    }
    if (tipoProduto !== undefined) {
      camposParaAtualizar["produtos.$.tipoProduto"] = tipoProduto;
    }

   
    if (Object.keys(camposParaAtualizar).length === 0) {
      return res
        .status(400)
        .json({ message: "Nenhum campo para atualizar foi fornecido." });
    }

    const resultado = await modeloLogar.updateOne(
      {
        nomeEstabelecimento: nomeEstabelecimento,
        "produtos._id": id,
      },
      {
        $set: camposParaAtualizar,
      }
    );

    if (resultado.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Estabelecimento ou produto não encontrado." });
    }

    if (resultado.modifiedCount === 0) {
      return res
        .status(200)
        .json({ message: "Produto encontrado, mas nenhum dado foi alterado." });
    }

    
    res.json(resultado);
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res
      .status(500)
      .json({ message: "Ocorreu um erro interno ao atualizar o produto." });
  }
});
app.delete("/produto/:id", async (req, res) => {
  try {
    const { id } = req.params;

    
    const resultado = await modeloLogar.updateOne(
      { "produtos._id": id },
      { $pull: { produtos: { _id: id } } }
    );

    if (resultado.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Produto não encontrado em nenhum estabelecimento." });
    }

    
    if (resultado.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Produto encontrado, mas não pôde ser removido." });
    }

    res.status(200).json({ message: "Produto deletado com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar produto:", err);
    res
      .status(500)
      .json({ message: "Ocorreu um erro interno ao deletar o produto." });
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
      { expiresIn: "6h" } 
    );
    const senhaHasheada = hashPassword(senha);
    const novoUsuario = await modeloLogar.create({
      nomeUsuario: usuario,
      hashSenha: senhaHasheada.hashedPassword,
      sal: senhaHasheada.salt,
      nomeEstabelecimento: nomeEstabelecimento,
      token: token,
      ip: req.ip,
    });

    res.status(200).send({
      auth: true,
      token: token,
      nomeEstabelecimento: novoUsuario.nomeEstabelecimento,
    });
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

app.post("/", async (req, res) => {
  try {
    const senha = req.body.senha;
    const usuario = req.body.usuario;
    const estabelecimento = await modeloLogar.findOne({
      nomeUsuario: usuario,
    });
    const senhaVerdadeira = verifyPassword(
      senha,
      estabelecimento.hashSenha,
      estabelecimento.sal
    );
    const verificarToken = await jwt.verify(
      estabelecimento.token,
      Secret,
      async (err, decoded) => {
        if (err) {
          const gerarToken = await jwt.sign(
            {
              usuario: usuario,
              nomeEstabelecimento: estabelecimento.nomeEstabelecimento,
            },
            Secret,
            { expiresIn: "6h" }
          );
          const atualizarToken = await modeloLogar.findOneAndUpdate(
            { token: estabelecimento.token },
            { token: gerarToken },
            { new: true }
          );
          res.status(200).send({ auth: true, token: atualizarToken.token });
        } else {
          res.status(200).send({ auth: true, token: estabelecimento.token });
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});
app.get("/titulo/:token", verificarToken, async (req, res) => {
  const estabelecimento = await modeloLogar.findOne({
    token: req.params.token,
  });
  if (estabelecimento) {
    res.json(estabelecimento.nomeEstabelecimento);
  } else {
    res.status(403).json({
      message: "Token não encontrado ou inválido",
    });
  }
});
app.get("/dadosPainel/:token", verificarToken, async (req, res) => {
  const estabelecimento = await modeloLogar.findOne({
    token: req.params.token,
  });
  const comandas = estabelecimento.comandas.length;
  console.log(comandas);
  res.status(200).json();
});

