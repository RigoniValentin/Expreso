import { HOST, PAYPAL_API, PAYPAL_API_CLIENT, PAYPAL_API_SECRET } from "app";
import { Request, Response } from "express";
import axios from "axios";
import { PaymentModel } from "../models/Payment";
import { PIBGroupModel } from "../models/PIBGroup";
import { EABModel } from "../models/EAB";
import mongoose from "mongoose";

// Helper: Obtener access token de PayPal
const getPayPalAccessToken = async (): Promise<string> => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  const { data } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
    auth: {
      username: PAYPAL_API_CLIENT!,
      password: PAYPAL_API_SECRET!,
    },
  });
  return data.access_token;
};

// Helper: Inscribir usuario en producto tras pago aprobado
const enrollUserInProduct = async (
  userId: mongoose.Types.ObjectId,
  productType: "pib" | "eab",
  productId: string,
  paymentPlan: "full" | "monthly",
  installmentNumber: number
) => {
  if (productType === "pib") {
    const group = await PIBGroupModel.findById(productId);
    if (!group) throw new Error("Grupo PIB no encontrado");

    const participantIndex = group.participants.findIndex(
      (p) => p.userId.toString() === userId.toString()
    );

    if (paymentPlan === "full") {
      if (participantIndex === -1) {
        group.participants.push({
          userId,
          enrolledAt: new Date(),
          paymentPlan: "full",
          paidInstallments: 1,
          accessActive: true,
          progress: { currentModule: 1, currentWeek: 1, completedVideos: [] },
        });
      } else {
        group.participants[participantIndex].accessActive = true;
        group.participants[participantIndex].paymentPlan = "full";
        group.participants[participantIndex].paidInstallments = 1;
      }
    } else {
      if (participantIndex === -1) {
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);
        group.participants.push({
          userId,
          enrolledAt: new Date(),
          paymentPlan: "monthly",
          paidInstallments: 1,
          nextPaymentDue: nextDue,
          accessActive: true,
          progress: { currentModule: 1, currentWeek: 1, completedVideos: [] },
        });
      } else {
        const participant = group.participants[participantIndex];
        participant.paidInstallments = installmentNumber;
        participant.accessActive = true;
        if (installmentNumber < 4) {
          const nextDue = new Date();
          nextDue.setMonth(nextDue.getMonth() + 1);
          participant.nextPaymentDue = nextDue;
        } else {
          participant.nextPaymentDue = undefined;
        }
      }
    }
    await group.save();
  } else if (productType === "eab") {
    const eab = await EABModel.findById(productId);
    if (!eab) throw new Error("Experiencia EAB no encontrada");

    const alreadyEnrolled = eab.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    if (!alreadyEnrolled) {
      eab.participants.push({
        userId,
        enrolledAt: new Date(),
        progress: { currentModule: 1, completedVideos: [] },
      });
      await eab.save();
    }
  }
};

//#region PayPal - Crear orden para productos PIB/EAB
export const createPayPalOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser?._id;
    if (!userId) {
      res.status(401).json({ message: "Usuario no autenticado" });
      return;
    }

    const { productType, productId, productName, amount, paymentPlan, installmentNumber } = req.body;

    if (!productType || !productId || !productName || !amount) {
      res.status(400).json({ message: "Faltan datos del producto" });
      return;
    }

    if (!["pib", "eab"].includes(productType)) {
      res.status(400).json({ message: "Tipo de producto inválido" });
      return;
    }

    // Verificar que el producto existe
    if (productType === "pib") {
      const group = await PIBGroupModel.findById(productId);
      if (!group) {
        res.status(404).json({ message: "Grupo PIB no encontrado" });
        return;
      }
    } else {
      const eab = await EABModel.findById(productId);
      if (!eab) {
        res.status(404).json({ message: "Experiencia EAB no encontrada" });
        return;
      }
    }

    const plan = paymentPlan || "full";
    const instNumber = parseInt(installmentNumber) || 1;

    // Codificar metadata en el state para la URL de retorno
    const stateData = Buffer.from(JSON.stringify({
      userId: userId.toString(),
      productType,
      productId,
      productName,
      amount,
      paymentPlan: plan,
      installmentNumber: instNumber,
      totalInstallments: plan === "full" ? 1 : 4,
    })).toString("base64url");

    const access_token = await getPayPalAccessToken();

    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: Number(amount).toFixed(2),
          },
          description: productName,
        },
      ],
      application_context: {
        brand_name: "Expreso Mi Arte Nehilak",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${HOST}/api/v1/paypal/capture-order?state=${stateData}`,
        cancel_url: `${HOST}/productos`,
      },
    };

    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, order, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    res.json({ approvalUrl: response.data.links.find((l: any) => l.rel === "approve")?.href });
  } catch (error) {
    console.error("Error al crear orden PayPal:", error);
    res.status(500).json({ message: "Error al crear la orden de PayPal" });
  }
};
//#endregion

//#region PayPal - Capturar orden aprobada
export const capturePayPalOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token, state } = req.query;

  try {
    if (!token || !state) {
      res.redirect(`${HOST}/productos?paypal=error`);
      return;
    }

    // Decodificar metadata del state
    let stateData: any;
    try {
      stateData = JSON.parse(Buffer.from(state as string, "base64url").toString());
    } catch {
      res.redirect(`${HOST}/productos?paypal=error`);
      return;
    }

    const { userId, productType, productId, productName, amount, paymentPlan, installmentNumber, totalInstallments } = stateData;

    // Capturar el pago en PayPal
    const access_token = await getPayPalAccessToken();
    const captureResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (captureResponse.data.status !== "COMPLETED") {
      res.redirect(`${HOST}/productos?paypal=error`);
      return;
    }

    const transactionId = captureResponse.data.id;

    // Crear registro de pago aprobado
    await PaymentModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      productType,
      productId: new mongoose.Types.ObjectId(productId),
      productName,
      amount: Number(amount),
      currency: "USD",
      paymentMethod: "paypal",
      paymentPlan,
      installmentNumber,
      totalInstallments,
      referenceNumber: transactionId,
      receiptUrl: "",
      status: "approved",
      reviewedAt: new Date(),
    });

    // Inscribir al usuario automáticamente
    await enrollUserInProduct(
      new mongoose.Types.ObjectId(userId),
      productType,
      productId,
      paymentPlan,
      installmentNumber
    );

    res.redirect(`${HOST}/pagoAprobado?method=paypal&product=${encodeURIComponent(productName)}`);
  } catch (error) {
    console.error("Error al capturar orden PayPal:", error);
    res.redirect(`${HOST}/productos?paypal=error`);
  }
};
//#endregion
