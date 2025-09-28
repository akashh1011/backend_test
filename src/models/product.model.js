import mongoose, {Schema} from "mongoose"

const productSchema = new Schema({
  name:{
    type:String,
    unique:true,
    required:true,
    trim:true
  },

  unit:{
    type:String,
    required:true,
    trim:true
  },

  category:{
    type:String,
    required:true,
    trim:true
  },

  brand:{
  type:String,
  trim:true
  },

  stock:{
    type:Number,
    default:0
  },

  status:{
    type:String,
    enum:["active","inactive"],
    default:"active",
    trim:true

  },

  image:{
    type:String,
    trim:true
  }
},{timestamps:true})



export const Product = mongoose.model("Product", productSchema)