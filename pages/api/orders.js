import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { sendEmail } from "@/lib/mailer";
import clientPromise from "@/lib/mongodb"; // Add this import

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  if(!session || !session.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  const userEmail = session.user.email;

  // ---------------- GET -----------------
  if (req.method === "GET") {
    try {
      const orders = await Order.find({ email: userEmail }).sort({ createdAt: -1 });
      return res.status(200).json(orders);
    } catch (err) {
      console.error("Erreur GET orders:", err);
      return res.status(500).json({ error: "Erreur GET" });
    }
  }

  // ---------------- POST -----------------
  if (req.method === "POST") {
    try {
      const { name, phone, streetAddress, country, line_items, total } = req.body;

      if (!line_items || line_items.length === 0) {
        return res.status(400).json({ error: "Le panier est vide" });
      }

      // إنشاء طلب جديد
      const newOrder = await Order.create({
        userId: session.user.id,
        name,
        email: userEmail,
        phone,
        streetAddress,
        country,
        line_items,
        total,
        status: "En attente",
      });

      // ✅ نبعث إيميل لكل الموظفين المعتمدين
      // Use the same MongoDB approach as your other API
      const client = await clientPromise;
      const db = client.db("company_db");
      const employeesCollection = db.collection("employees");
      
      const approvedEmployees = await employeesCollection
        .find({ status: "approved" })
        .toArray();
      
      console.log(`Found ${approvedEmployees.length} approved employees`);
      
      const employeeEmails = approvedEmployees.map(emp => emp.email);

      // إرسال الإيميلات بشكل متوازي
      const emailPromises = employeeEmails.map(email => 
        sendEmail({
          to: email,
          subject: "Nouvelle commande client",
          html: `
            <h2>Bonjour 👋</h2>
            <p>Un client a passé une nouvelle commande.</p>
            <p><strong>Client :</strong> ${name} (${userEmail})</p>
            <p><strong>Téléphone :</strong> ${phone}</p>
            <p><strong>Adresse :</strong> ${streetAddress}, ${country}</p>
            <p><strong>Total :</strong> ${total} DT</p>
            <p><strong>ID Commande :</strong> ${newOrder._id}</p>
            <p>Merci de vérifier et traiter la commande.</p>
            <hr/>
            <p>Société FBM</p>
          `,
        }).catch(error => {
          console.error(`Failed to send email to ${email}:`, error);
          return null;
        })
      );

      await Promise.all(emailPromises);
      console.log(`Sent ${employeeEmails.length} email notifications`);

      return res.status(201).json(newOrder);
    } catch (err) {
      console.error("Erreur POST orders:", err);
      return res.status(500).json({ error: "Erreur serveur lors du POST" });
    }
  }

  // ---------------- PUT -----------------
  if (req.method === "PUT") {
    try {
      const { id, status, line_items, total } = req.body;
      if (!id) return res.status(400).json({ error: "Missing order id" });

      const order = await Order.findOne({ _id: id, email: userEmail });
      if (!order) return res.status(404).json({ error: "Commande non trouvée" });

      if (status) order.status = status;
      if (line_items) order.line_items = line_items;
      if (total) order.total = total;

      await order.save();
      return res.status(200).json(order);
    } catch (err) {
      console.error("Erreur PUT orders:", err);
      return res.status(500).json({ error: "Erreur PUT" });
    }
  }

  // ---------------- DELETE -----------------
  if (req.method === "DELETE") {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ error: "Paramètres manquants" });

      const order = await Order.findOne({ _id: orderId, email: userEmail });
      if (!order) return res.status(404).json({ error: "Commande non trouvée" });

      order.status = "Annulée";
      await order.save();

      return res.status(200).json({ message: "Commande annulée avec succès" });
    } catch (err) {
      console.error("Erreur DELETE orders:", err);
      return res.status(500).json({ error: "Erreur DELETE" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}