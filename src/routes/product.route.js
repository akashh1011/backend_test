import { Router } from "express"
import { exportProducts, getProductsList, importProducts, updateProduct, getProductInventoryHistory } from "../controllers/product.controller.js"
const router = Router()

// import route
router.route("/products/import").post(importProducts)

//export route
router.route("/products/export").get(exportProducts)


//get products in JSON 
router.route("/products").get(getProductsList)

// put update products
router.route("/products/:id").put(updateProduct)

//history

router.route("products/:id/history").get(getProductInventoryHistory)

export default router