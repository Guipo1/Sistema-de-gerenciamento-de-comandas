import mongoose from "mongoose";
const produtoSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId },
    tipoProduto: { type: String },
    nomeProduto: { type: String, required: true },
    ingredientes: { type: String, required: true },
    valor: { type: Number, required: true },
    img: { type: String },
    restaurante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "modeloLogar",
      required: true,
    },
  },
  { versionKey: false }
);

const produto1 = mongoose.model("produto", produtoSchema);

export default produto1;
