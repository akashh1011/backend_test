import mongoose,{Schema} from "mongoose";
const inventorySchema = new Schema({

  productId:{
    type:Schema.Types.ObjectId,
    ref:"Product",
    required:true
  },

  oldQuantity:{
    type:Number,
    required:true
  },

  newQuantity:{
    type:Number,
    required:true
  },

  changedDate:{
    type:Date,
    default:Date.now,
    required:true
  }

},{timestamps:true})

export const Inventory = mongoose.model("Inventory", inventorySchema)