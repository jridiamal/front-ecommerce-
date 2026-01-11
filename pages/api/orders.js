import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import UserRequest from "@/models/UserRequest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { sendEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  await mongooseConnect();

  // 🔐 Auth
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    console.log("❌ NO SESSION");
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userEmail = session.user.email;
  console.log("✅ SESSION USER:", userEmail);

  // ================= POST =================
  if (req.method === "POST") {
    try {
      const { name, phone, streetAddress, country, line_items, total } = req.body;

      if (!line_items || line_items.length === 0) {
        return res.status(400).json({ error: "Panier vide" });
      }

      // 🧾 Create order
      const order = await Order.create({
        name,
        email: userEmail,
        phone,
        streetAddress,
        country,
        line_items,
        total,
        status: "En attente",
      });

      console.log("🟢 ORDER CREATED:", order._id);

      // 👨‍💼 Get approved employees
      const approvedEmployees = await UserRequest.find({ status: "approved" });

      console.log(
        "👨‍💼 APPROVED COUNT:",
        approvedEmployees.length
      );
      console.log(
        "📧 EMAILS:",
        approvedEmployees.map(e => e.email)
      );

      // 📩 Send email
      for (const emp of approvedEmployees) {
        console.log("➡️ SENDING EMAIL TO:", emp.email);

        await sendEmail({
          to: emp.email,
          subject: "Nouvelle commande client",
          html: `
            <h2>Nouvelle commande 📦</h2>
            <p><strong>Client:</strong> ${name}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Total:</strong> ${total} DT</p>
            <hr/>
            <p>Société FBM</p>
          `,
        });
      }

      console.log("✅ ALL EMAILS SENT");

      return res.status(201).json(order);
    } catch (error) {
      console.error("🔥 POST ERROR:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // ================= METHOD NOT ALLOWED =================
  return res.status(405).json({ error: "Method not allowed" });
}
