import express from "express"
import productRouter from "../src/routes/product.route.js"
import { uploadCSV } from "./middlewares/multer.middleware.js"
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/api",uploadCSV.single("file"), productRouter)



export default app