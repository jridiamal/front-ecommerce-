import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      email,
      phone,
      streetAddress,
      country,
      cartProducts,
      paymentMethod = "Paiement à la livraison"
    } = req.body;

    // Validation des données
    if (!name || name.length < 3) {
      return res.status(400).json({ error: "Nom invalide (minimum 3 caractères)" });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: "Email invalide" });
    }
    
    if (!phone || !/^(2|4|5|9)\d{7}$/.test(phone)) {
      return res.status(400).json({ error: "Numéro de téléphone invalide. Format: 8 chiffres commençant par 2,4,5 ou 9" });
    }
    
    if (!streetAddress || streetAddress.length < 5) {
      return res.status(400).json({ error: "Adresse invalide (minimum 5 caractères)" });
    }

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // Récupérer les produits depuis la base de données
    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    // Préparer les line_items
    const line_items = cartProducts
      .map(cartItem => {
        const product = productsFromDb.find(
          p => p._id.toString() === cartItem._id.toString()
        );
        
        if (!product) {
          console.warn(`Produit non trouvé: ${cartItem._id}`);
          return null;
        }

        let colorVariant = null;
        if (product?.properties?.colorVariants?.length > 0 && cartItem.colorId) {
          colorVariant = product.properties.colorVariants.find(
            v => v._id.toString() === cartItem.colorId.toString()
          );
        }

        const quantity = Number(cartItem.quantity) || 1;
        const price = Number(product.price) || 0;

        return {
          productId: product._id.toString(),
          productTitle: product.title,
          reference: product.reference || "N/A",
          color: cartItem.color || colorVariant?.color || "default",
          colorId: colorVariant ? colorVariant._id.toString() : null,
          quantity,
          price,
          image: colorVariant?.imageUrl || product.images?.[0] || "",
        };
      })
      .filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ error: "Aucun produit disponible pour cette commande" });
    }

    // Calculer le total
    const total = line_items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Créer la commande
    const order = await Order.create({
      name,
      email,
      phone,
      streetAddress,
      country: country || "Tunisie",
      line_items,
      total,
      paymentMethod,
      paid: false,
      status: "En attente",
    });

    console.log(`✅ Commande créée: ${order._id} pour ${name}`);

    // Réponse immédiate
    return res.status(200).json({ 
      success: true, 
      orderId: order._id,
      message: "Commande créée avec succès",
      order 
    });

  } catch (error) {
    console.error("❌ ERREUR CHECKOUT:", error);
    
    let errorMessage = "Erreur serveur lors de la création de la commande";
    
    if (error.name === 'ValidationError') {
      errorMessage = "Erreur de validation des données";
    } else if (error.code === 11000) {
      errorMessage = "Erreur de duplication de commande";
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      code: error.code
    });
  }
}