import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
mongoose.connect(
  `mongodb+srv://${process.env.DB_USUARIO}:${process.env.DB_SENHA}@clusterdecomanda.r06zb.mongodb.net/?retryWrites=true&w=majority&appName=ClusterdeComanda`
);

let db = mongoose.connection;

export default db;
