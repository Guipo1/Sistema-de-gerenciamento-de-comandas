import mongoose from "mongoose";
const comandaSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId },
    mesa: { type: Number, required: true },
    pedido: [
      {
        nomePedido: { type: String, required: true },
        obs: { type: String },
        quantidade: { type: Number, required: true },
      },
    ],
    valor: { type: Number, required: true },
  },
  { versionKey: false }
);

const comanda = mongoose.model("comanda", comandaSchema);

export default comanda;
