import mongoose, {model, Schema, models} from "mongoose";

const CategorySchema = new Schema({
  name: {type: String, required: true},
  // Utiliser Schema.Types.ObjectId au lieu de mongoose.Types.ObjectId
  parent: {type: Schema.Types.ObjectId, ref: 'Category'},
  properties: [{type: Object}],
  image: {type: String}, 
});

// Toujours vérifier models.Category en premier
export const Category = models?.Category || model('Category', CategorySchema);