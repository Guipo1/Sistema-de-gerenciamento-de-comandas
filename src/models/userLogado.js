import mongoose from "mongoose";

// Definimos o schema do produto aqui para ser embutido diretamente.
const produtoSubSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  nomeProduto: { type: String, required: true },
  ingredientes: { type: String },
  valor: { type: Number, required: true },
  tipoProduto: { type: String, required: true },
  quantidade: { type: Number },
});
const comandaSubSchema = new mongoose.Schema({
  _id: { type: mongoose.Types.ObjectId },
  mesa: { type: Number },
  pedidos: [
    {
      quantidade: { type: Number },
      nomePedido: { type: String },
    },
  ],
  valor: { type: Number },
});
const valrArecadadoSchema = new mongoose.Schema({
  valor: { type: Number },
  numeroComandas: { type: Number },
  dia: { type: Date, default: Date.now },
});
const logadoSchema = new mongoose.Schema(
  {
    nomeEstabelecimento: { type: String, required: true },
    nomeUsuario: { type: String, required: true },
    hashSenha: { type: String, required: true },
    sal: { type: String },
    imagemLogo: { type: String },
    token: { type: String },
    ip: { type: String },
    produtos: [produtoSubSchema], // Usamos o schema do subdocumento aqui
    comandas: [comandaSubSchema],
    valorArecadado: [valrArecadadoSchema],
  },
  { versionKey: false }
);

const modeloLogar = mongoose.model("logado", logadoSchema);

export default modeloLogar;
