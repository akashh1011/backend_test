import fs from "fs"
import csv from "csv-parser"
import { ApiError } from "./ApiError.util.js"


const parseCSVtoJSON = (filePath)=>{
  return new Promise((resolve, reject)=>{
    const results = []


    //check if file exists

    if(!fs.existsSync(filePath)){
      return reject(new ApiError(400, "CSV file not found"))
    }

    fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", () => resolve(results))
    .on("error", (err) => reject(new ApiError(500, "Error parsing CSV: " + err.message)))
  })
}

export {parseCSVtoJSON}