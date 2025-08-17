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
import multer from "multer";

// Em um ambiente de produção, a chave secreta NUNCA deve ser hardcoded.
// Use variáveis de ambiente. Ex: process.env.JWT_SECRET
const Secret = "seu-segredo-super-secreto-e-longo";
const uploadDir = "./src/uploads";
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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Apenas imagens são permitidas (JPEG, JPG, PNG, GIF)");
  },
}).single("image");
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

// Lógica de Salas do Socket.IO
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
//
//acesar pagina principal depois de logado
app.get("/index/:token", verificarToken, async (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/rotas1.html"));
});
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
    // Opcional, mas recomendado: Verificar se o usuário/token ainda existe no banco
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
//
//acesar pagina principal (agora protegida)
app.get("/admin/:token", verificarToken, async (req, res) => {
  // Removido o token da URL
  res.sendFile(path.join(__dirname, "./src/pagina/index.html"));
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
//acesar a pagina para fazer pedidos
app.get("/cardapio/:nomeEstabelecimento", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/pagina/pedidos.html"));
});
//
//acesar a pagina para fazer pedidos
app.get("/iconecarinho.png", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/imagens/iconecarinho.png"));
});
//
//acesar pagina ´para alterar produtos
app.get(
  "/alterar/:token/:nomeEstabelecimento",
  verificarToken,
  async (req, res) => {
    res.sendFile(path.join(__dirname, "./src/pagina/pedidos1.html"));
  }
);
//
//visializar todas as comandas
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
//
//criar comanda
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

      // Encontra o índice do registro de hoje no array 'valorArecadado'
      let indexDia = -1;
      for (let i = 0; i < estabelecimento.valorArecadado.length; i++) {
        // É crucial que 'estabelecimento.valorArecadado[i].dia' seja uma string que 'new Date()'
        // consiga parsear e que 'toDateString()' produza o mesmo formato de 'hojeString'.
        // Se você puder salvar 'dia' como um tipo Date nativo no MongoDB, a comparação seria mais simples.
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
        // Se o registro para hoje existe, incrementa os valores
        updateOperation.$inc = {};
        updateOperation.$inc[`valorArecadado.${indexDia}.valor`] = valorTotal;
        updateOperation.$inc[`valorArecadado.${indexDia}.numeroComandas`] = 1;
        console.log("Registro existente atualizado para hoje.");
      } else {
        // Se o registro para hoje não existe, adiciona um novo
        const novoRegistroDia = {
          valor: valorTotal,
          numeroComandas: 1,
          dia: hojeString, // Salva a data como string para consistência com seus dados existentes
          _id: new mongoose.Types.ObjectId(), // ID único para o subdocumento
        };
        updateOperation.$push.valorArecadado = novoRegistroDia; // Adiciona o novo registro de dia
        console.log("Novo registro criado para hoje.");
      }

      // Executa a operação de atualização no banco de dados
      const documentoAtualizado = await modeloLogar.findOneAndUpdate(
        { token: req.params.token }, // Encontra o documento pelo token
        updateOperation, // Aplica as operações de push e/ou inc
        { new: true } // Retorna o documento atualizado
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
      const comandas = [];
      const valorTotalPorDia = [];
      for (const totalComanda of estabelecimento.valorArecadado) {
        comandas.push(totalComanda.numeroComandas);
        valorTotalPorDia.push(totalComanda.valor);
      }
      while (
        (comandas.length < 7 && valorTotalPorDia.length < 7) ||
        comandas.length < 7 ||
        valorTotalPorDia.length < 7
      ) {
        comandas.unshift(0);
        valorTotalPorDia.unshift(0);
      }

      socket.emit("novosDados", (valorTotalPorDia, comandas));
      return res
        .status(201)
        .json({ message: "Comanda criada com sucesso!", comanda: novaComanda });
    } else {
      res.status(300).json({ message: "produto nao encontrado" });
    }
  } catch (err) {
    console.error("Erro ao criar comanda:", err); // Use console.error para erros
    res
      .status(500)
      .json({ message: "Erro ao criar comanda.", error: err.message });
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
  const comandaPeloId = await modeloLogar.findById(id);
  return JSON.stringify(comandaPeloId);
}
//
//atualizar uma comanda
app.put("/AtualizarComanda/:id/:token", verificarToken, async (req, res) => {
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
//
//deletar uma comanda
app.delete("/RemoverComanda/:id/:token", verificarToken, async (req, res) => {
  try {
    const hoje = new Date(); // Obtenha a data atual
    hoje.setHours(0, 0, 0, 0); // Zere as horas para pegar o início do dia

    // Formate a data de hoje para 'YYYY-MM-DD'
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
      // Obtenha a data do array e formate para 'YYYY-MM-DD'
      // É importante que o campo 'dia' no banco de dados seja sempre uma string que 'new Date()' consiga parsear
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
      // Considere se você quer adicionar um novo registro ou simplesmente não decrementar
      // caso o dia não seja encontrado. Para este cenário, ele simplesmente não fará o $inc.
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
//
//ver o total arecadado
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
        // Decide como lidar com produtos não encontrados. Pode ser um erro ou um valor padrão.
        // Para este exemplo, vamos considerar o valor como 0.
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
    //res.sendFile(path.join(__dirname, "/src/pagina/pedidos.html"));

    //console.log(produto);
    res.json({
      produtos: produto[0].produtos,
      nomeImagem: produto[0].imagemLogo,
    });
  } catch (err) {
    console.log(err);
    res.send("deu erro");
  }
});
app.post("/produto/:nomeEstabelecimento", async (req, res) => {
  try {
    const nomeEstabelecimento = req.params.nomeEstabelecimento;
    const { nomeProduto, ingredientes, valor, tipoProduto } = req.body;
    console.log(req.body);
    /*if (!nomeProduto || valor === undefined || !tipoProduto) {
      return res
        .status(400)
        .json({ message: "Nome, valor e tipo do produto são obrigatórios." });
    }
*/
    // 1. Criamos o objeto do produto, gerando o _id manualmente
    const produtoNovo = {
      _id: new mongoose.Types.ObjectId(), // Corrigido de 'id' para '_id'
      nomeProduto: nomeProduto,
      ingredientes: ingredientes || [],
      valor: valor,
      tipoProduto: tipoProduto,
    };

    // 2. Usamos $push para adicionar o objeto completo ao array
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

    // 3. Retornamos o objeto do produto recém-criado na resposta
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

    // Constrói o objeto de atualização dinamicamente com os campos fornecidos.
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

    // Verifica se há algo para atualizar.
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

    //res.json({ message: "Produto atualizado com sucesso." });
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

    // Encontra qualquer estabelecimento que contenha o produto com o ID fornecido
    // e remove esse produto do array 'produtos'.
    const resultado = await modeloLogar.updateOne(
      { "produtos._id": id },
      { $pull: { produtos: { _id: id } } }
    );

    if (resultado.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Produto não encontrado em nenhum estabelecimento." });
    }

    // Este caso é menos provável de acontecer com $pull se o match foi encontrado,
    // mas é bom manter por segurança.
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
  res.sendFile(path.join(__dirname + "/src/pagina/login1.html"));
});
//
app.get("/cadastro", async (req, res) => {
  res.sendFile(path.join(__dirname + "/src/pagina/cadastro.html"));
});
//
app.post("/cadastro", async (req, res) => {
  const { usuario, senha, nomeEstabelecimento, email } = req.body;
  try {
    const token = await jwt.sign(
      { usuario: usuario, nomeEstabelecimento: nomeEstabelecimento },
      Secret,
      { expiresIn: "6h" } // Token expira em 1 hora
    );
    console.log(senha);
    const senhaHasheada = hashPassword(senha);
    const novoUsuario = await modeloLogar.create({
      nomeUsuario: usuario,
      hashSenha: senhaHasheada.hashedPassword,
      sal: senhaHasheada.salt,
      nomeEstabelecimento: nomeEstabelecimento,
      token: token,
      ip: req.ip,
      email: email,
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
// Rota de Login
app.post("/", async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    const verificarEstabelecimento = await modeloLogar.findOne({
      nomeUsuario: usuario,
    });

    if (verificarEstabelecimento) {
      const verificarSenha = verifyPassword(
        senha,
        verificarEstabelecimento.hashSenha || null,
        verificarEstabelecimento.sal || null
      );

      const verificarToken = jwt.verify(
        verificarEstabelecimento.token,
        Secret,
        (err, decoded) => {
          if (err) {
            return false;
          } else {
            return true;
          }
        }
      );

      if (verificarSenha) {
        if (verificarToken === true) {
          res.status(200).json({
            message: "logado com sucesso",
            auth: true,
            token: verificarEstabelecimento.token,
          });
        } else {
          const tokenAtualizado = jwt.sign(
            {
              nomeEstabelecimento: verificarEstabelecimento.nomeEstabelecimento,
              nomeUsuario: verificarEstabelecimento.nomeUsuario,
            },
            Secret,
            { expiresIn: "6h" }
          );
          const atualizarToken = await modeloLogar.findOneAndUpdate(
            { token: verificarEstabelecimento.token },
            { $set: { token: tokenAtualizado } },
            { upsert: true, new: true }
          );
          if (atualizarToken) {
            res.status(200).json({
              message: "logado com sucesso",
              auth: true,
              token: tokenAtualizado,
            });
          } else {
            res.status(500).send("Não foi possivel atUalizar o token");
          }
        }
      } else {
        res.status(304).send("senha incoreta");
      }
    } else {
      res.status(404).send("Estabelecimento nao encontrado");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("deu erro interno ao fazer login");
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
  const numeroComandas = estabelecimento.comandas.length;
  const vendaTotal = estabelecimento.valorArecadado.find(
    (valor) => (valor.dia = new Date().setHours(0, 0, 0, 0))
  );

  var totalSemanal = 0;
  for (var i = 0; i <= 6; i++) {
    if (estabelecimento.valorArecadado[i]) {
      totalSemanal += estabelecimento.valorArecadado[i].valor;
    }
  }

  const ticketMedio =
    Math.trunc((totalSemanal / numeroComandas) * Math.pow(10, 2)) /
    Math.pow(10, 2);

  const comandas = [];
  const valorTotalPorDia = [];
  for (const totalComanda of estabelecimento.valorArecadado) {
    comandas.push(totalComanda.numeroComandas);
    valorTotalPorDia.push(totalComanda.valor);
  }
  while (
    (comandas.length < 7 && valorTotalPorDia.length < 7) ||
    comandas.length < 7 ||
    valorTotalPorDia.length < 7
  ) {
    comandas.unshift(0);
    valorTotalPorDia.unshift(0);
  }
  res.status(200).json({
    totalSemanal: totalSemanal,
    numeroComandas: numeroComandas,
    ticketMedio: ticketMedio || 0,
    comandasPorDia: comandas,
    valorTotalPorDia: valorTotalPorDia,
    imagemLogo: estabelecimento.imagemLogo,
  });
});
//
// Rota para upload de imagens
app.post("/upload/:token", verificarToken, (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Nenhum arquivo foi enviado." });
    }

    try {
      const updatedUser = await modeloLogar.findOneAndUpdate(
        { token: req.params.token },
        { $set: { imagemLogo: req.file.filename } }, // Usar $set para atualizar o campo de string
        { new: true, upsert: true }
      );

      if (!updatedUser) {
        // Se o usuário não for encontrado, remove o arquivo para não deixar órfãos
        fs.unlinkSync(req.file.path);
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado." });
      }

      //res.sendFile(path.join(__dirname, "./src/pagina/rotas1.html"));
      res.status(200).json({
        success: true,
        message: "imagem criada com sucesso",
        imagemLogo: req.file.filename,
      });
    } catch (dbError) {
      console.error("Erro ao salvar imagem no banco de dados:", dbError);
      fs.unlinkSync(req.file.path); // Remove o arquivo em caso de erro no DB
      res.status(500).json({
        success: false,
        message: "Erro interno ao salvar a referência da imagem.",
      });
    }
  });
});
app.get("/imagem/:nomeImagem", async (req, res) => {
  try {
    const nomeImagem = req.params.nomeImagem;
    res.sendFile(path.join(__dirname, `./src/uploads/${nomeImagem}`));
  } catch (err) {
    console.log(err);
  }
});
app.delete("/imagem/:token/:nomeImagem", verificarToken, async (req, res) => {
  const diretorioImagem = req.params.nomeImagem;
  const filePath = `./src/uploads/${diretorioImagem}`; // Substitua pelo caminho real do arquivo
  const deletarImegem = await modeloLogar.findOneAndUpdate(
    { token: req.params.token },
    {
      $set: { imagemLogo: "" },
    },
    { upsert: true, new: true }
  );
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Erro ao remover o arquivo: ${err}`);
      res.send({ message: "erro ao deletar imagem", deletado: false });
      return;
    }

    console.log(deletarImegem);
    console.log(`Arquivo ${filePath} removido com sucesso.`);
    res.send({ message: "sucesso ao deletar imagem", deletado: true });
  });
});

