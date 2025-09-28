import mongoose , {Schema} from "mongoose"
const importSchema = new Schema({
  fileName:{
    type:String
  },

  addedCount:{
    type:Number
  },

  skippedCount:{
    type:Number
  },

  skippedProducts:{
    type:[String]
  }

},{timestamps:true})

export const Import = mongoose.connect("Import", importSchema)