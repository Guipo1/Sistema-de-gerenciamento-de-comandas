import mongoose from "mongoose";
import produto1 from "./precomodel1.js";
import comanda from "./comandaModel.js";
const logadoSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId },
    nomeEstabelecimento: { type: String, required: true },
    nomeUsuario: { type: String, required: true },
    hashSenha: { type: String, required: true },
    sal: { type: String },
    imagemLogo: { type: String },
    token: { type: String },
    ip: { type: String },
    produtos: { type: mongoose.Schema.Types.Array, ref: "produtos" },
  },
  { versionKey: false }
);

const modeloLogar = mongoose.model("logado", logadoSchema);

export default modeloLogar;
