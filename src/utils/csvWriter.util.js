import { format } from "fast-csv"
import { ApiError } from "./ApiError.util.js"

const writeJSONtoCSV = (data, res) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(data) || data.length === 0) {
      return reject(new ApiError(400, "No data available to export"))
    }

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=products.csv")

    const csvStream = format({ headers: true })
      .transform((row) => ({
        name: row.name,
        unit: row.unit,
        category: row.category,
        brand: row.brand,
        stock: row.stock,
        status: row.status,
        image: row.image,
      }))
      .on("error", (err) =>
        reject(new ApiError(500, "Error writing CSV: " + err.message))
      )
      .on("end", () => resolve())

    csvStream.pipe(res)
    data.forEach((row) => csvStream.write(row))
    csvStream.end()
  })
}

export { writeJSONtoCSV }
