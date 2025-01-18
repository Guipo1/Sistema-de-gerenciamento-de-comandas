import mongoose from "mongoose";
const produtoSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId },
    nomeProduto: { type: String, required: true },
    ingredientes: { type: String, required: true },
    valor: { type: Number, required: true },
  },
  { versionKey: false }
);

const produto = mongoose.model("produto", produtoSchema);

export default produto;
