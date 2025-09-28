// src/controllers/product.controller.js

import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { parseCSVtoJSON } from "../utils/csvParser.util.js";
import { writeJSONtoCSV } from "../utils/csvWriter.util.js";
import { Product } from "../models/product.model.js";
import { Inventory } from "../models/inventory.model.js";
import fs from "fs/promises"; // Use promises version for async/await

// import file controller

const importProducts = asyncHandler(async (req, res) => {
  // 1. Check for file upload
  if (!req.file) {
    throw new ApiError(400, "CSV file is required for product import.");
  }

  const filePath = req.file.path;
  let productsToInsert = [];
  let duplicates = [];
  let addedCount = 0;

  try {
    // Parse the CSV file

    const csvData = await parseCSVtoJSON(filePath);

    if (csvData.length === 0) {
      throw new ApiError(400, "The uploaded CSV file is empty.");
    }

    //  Process Data and Check Duplicates
    const allProductNames = await Product.find({}, { name: 1, _id: 0 }).lean();
    const existingNames = new Set(
      allProductNames.map((p) => p.name.toLowerCase())
    );

    for (const row of csvData) {
      const productName = (row.name || "").toLowerCase().trim();

      const productData = {
        name: productName,
        unit: row.unit,
        category: row.category,
        brand: row.brand,
        stock: parseInt(row.stock) || 0,
        status: (row.status || "draft").toLowerCase(),
        image: row.image,
      };

      if (existingNames.has(productName)) {
        duplicates.push({
          ...productData,
          reason: "Duplicate product name found in database.",
        });
      } else {
        productsToInsert.push(productData);

        existingNames.add(productName);
      }
    }

    //  Bulk Insert New Products
    if (productsToInsert.length > 0) {
      const result = await Product.insertMany(productsToInsert);
      addedCount = result.length;
    }
  } catch (error) {
    throw error;
  } finally {
    // Cleanup the temporary file (MUST be done)
    await fs.unlink(filePath).catch((err) => {
      console.error("Failed to delete temp file:", err.message);
    });
  }

  //  Send Final Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        addedCount,
        skippedCount: duplicates.length,
        duplicates: duplicates,
      },
      `Successfully imported ${addedCount} products. Skipped ${duplicates.length} duplicates.`
    )
  );
});

// export file

const exportProducts = asyncHandler(async (req, res) => {
  const allProducts = await Product.find({}).lean();

  if (allProducts.length === 0) {
    throw new ApiError(404, "No products found to export.");
  }

  try {
    await writeJSONtoCSV(allProducts, res);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to generate or stream CSV file.");
  }
});

//get products list (JSON)

const getProductsList = asyncHandler(async (req, res) => {
  const products = await Product.find({});

  if (!products || products.length === 0) {
    throw new ApiError(404, "No products found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products list fetched successfully"));
});

//update products

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, unit, category, brand, stock, status, image } = req.body;

  if (!name && !unit && !category && !brand && !stock && !status && !image) {
    throw new ApiError(
      400,
      "At least one editable field is required to update the product."
    );
  }

  const productToUpdate = await Product.findById(id);
  if (!productToUpdate) {
    throw new ApiError(404, "Product not found.");
  }

  const updateFields = {};
  let newNameNormalized = null;
  let stockChanged = false;
  let oldStock = productToUpdate.stock;
  let newStock = oldStock;

  if (name !== undefined) {
    newNameNormalized = name.toLowerCase().trim();
    if (newNameNormalized === "") {
      throw new ApiError(400, "Product name cannot be empty.");
    }
    updateFields.name = newNameNormalized;
  }

  if (stock !== undefined) {
    const numericStock = parseInt(stock);
    if (isNaN(numericStock) || numericStock < 0) {
      throw new ApiError(400, "Stock must be a non-negative number.");
    }

    if (numericStock !== oldStock) {
      stockChanged = true;
      newStock = numericStock;
    }
    updateFields.stock = numericStock;
  }

  if (unit !== undefined) updateFields.unit = unit?.trim();
  if (category !== undefined) updateFields.category = category?.trim();
  if (brand !== undefined) updateFields.brand = brand?.trim();
  if (status !== undefined) updateFields.status = status?.toLowerCase();
  if (image !== undefined) updateFields.image = image;

  if (
    newNameNormalized &&
    newNameNormalized !== productToUpdate.name.toLowerCase()
  ) {
    const existingProduct = await Product.findOne({
      name: newNameNormalized,
      _id: { $ne: id },
    });
    if (existingProduct) {
      throw new ApiError(409, `Product name '${name}' already exists.`);
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-__v");

  if (!updatedProduct) {
    throw new ApiError(500, "Failed to update product in the database.");
  }

  if (stockChanged) {
    await Inventory.create({
      product: updatedProduct._id,
      oldQuantity: oldStock,
      newQuantity: newStock,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedProduct,
        "Product updated successfully" +
          (stockChanged ? " and inventory history logged." : ".")
      )
    );
});
// history of log

const getProductInventoryHistory = asyncHandler(async (req, res) => {
   
    const { id: productId } = req.params;

    //console.log(id)
    
    const history = await Inventory.find({ product: productId })
        .sort({ changeDate: -1 }) 
        .limit(100) 
        .select('-__v'); 

    
    if (!history || history.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200, 
                [], 
                "No inventory history found for this product."
            )
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200, 
            history, 
            "Inventory history fetched successfully"
        )
    );
});


export {
  importProducts,
  exportProducts,
  getProductsList,
  updateProduct,
  getProductInventoryHistory,
};
