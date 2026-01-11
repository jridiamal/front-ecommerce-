import { mongooseConnect } from "@/lib/mongoose";
import  { Order } from "@/models/Order";
import { UserRequest } from "@/models/UserRequest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { sendEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const userEmail = session.user.email;

  // ================= GET =================
  if (req.method === "GET") {
    try {
      const orders = await Order.find({ email: userEmail }).sort({ createdAt: -1 });
      return res.status(200).json(orders);
    } catch (err) {
      console.error("❌ GET orders:", err);
      return res.status(500).json({ error: "Erreur GET" });
    }
  }

  // ================= POST =================
  if (req.method === "POST") {
    try {
      const { name, phone, streetAddress, country, line_items, total } = req.body;

      if (!line_items || line_items.length === 0) {
        return res.status(400).json({ error: "Panier vide" });
      }

      console.log("📦 Nouvelle commande de:", userEmail);

      // 1️⃣ Create order
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

      console.log("✅ Order créée:", newOrder._id);

      // 2️⃣ Get approved employees
      const employees = await UserRequest.find({
        role: "employee",
        status: "approved",
      });

      console.log("👥 Employees trouvés:", employees.length);

      // 🧪 TEST MODE
      if (employees.length === 0) {
        console.log("⚠️ Aucun employee approved → test email admin");
        await sendEmail({
          to: "societefbm484@gmail.com",
          subject: "🧪 TEST - Nouvelle commande",
          html: `<p>Commande test ID: ${newOrder._id}</p>`,
        });
      }

      // 3️⃣ Send email to employees
      for (const emp of employees) {
        console.log("📧 Envoi email à:", emp.email);

        await sendEmail({
          to: emp.email,
          subject: "Nouvelle commande client",
          html: `
            <h2>📦 Nouvelle commande</h2>
            <p><strong>Client:</strong> ${name}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Total:</strong> ${total} DT</p>
            <p><strong>ID:</strong> ${newOrder._id}</p>
            <hr/>
            <p>Société FBM</p>
          `,
        });
      }

      return res.status(201).json({
        success: true,
        orderId: newOrder._id,
        employeesNotified: employees.length,
      });

    } catch (err) {
      console.error("❌ POST orders:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
