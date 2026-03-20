import { UserRepository } from "@repositories/userRepository";
import { UserService } from "@services/userService";
import { RolesRepository } from "@repositories/rolesRepository";
import { RolesService } from "@services/rolesService";
import { Request, Response } from "express";
import { IUserRepository, IUserService, User } from "types/UserTypes";
import { IRolesRepository, IRolesService } from "types/RolesTypes";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetPasswordEmail } from "@services/emailService";
import { objectIdToString } from "@utils/requestParams";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);
const rolesRepository: IRolesRepository = new RolesRepository();
const rolesService: IRolesService = new RolesService(rolesRepository);

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email }: User = req.body;
    const userExists = await userService.findUserByEmail(req.body.email);
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Buscar el rol "guest" en la base de datos
    const guestRoles = await rolesService.findRoles({ name: "guest" });
    const guestRole = guestRoles[0];

    if (!guestRole) {
      res.status(500).json({ message: "Guest role not found in database" });
      return;
    }

    const newUser = await userService.createUser({
      ...req.body,
      roles: [guestRole._id],
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    console.log("error :>> ", error);
    res.status(500).json({
      message: error.message || "Error creating user",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const jwtSecret = process.env.JWT_SECRET as string;
  try {
    const { email, password }: User = req.body;
    const user = await userService.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: "Invalid user or password..." });
      return;
    }
    const comparePass = await user.comparePassword(password);
    if (!comparePass) {
      res.status(400).json({ message: "Invalid user or password..." });
      return;
    }

    // Populate roles para obtener la información completa
    await user.populate("roles");

    // Debug: mostrar roles del usuario
    console.log("Login - User roles populated:", user.roles);

    // Extraer nombres de roles y permisos
    const roleNames = user.roles?.map((role: any) => role.name) || ["guest"];
    console.log("Login - Role names extracted:", roleNames);
    
    const permissions =
      user.roles?.flatMap((role: any) => role.permissions || []) || [];

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        roles: roleNames,
        permissions: permissions,
        nationality: user.nationality,
        locality: user.locality,
        age: user.age,
      },
      jwtSecret,
      { expiresIn: "3h" }
    );

    //const decodedPayload = jwt.decode(token);
    //console.log("Payload decodificado:", decodedPayload);
    console.log("MercadoPago Access Token:", process.env.MP_ACCESS_TOKEN);
    res.json(token);
  } catch (error) {
    console.log("error :>> ", error);
    res.status(500).json(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("refreshToken called, user:", req.currentUser);
    // Verificar que req.currentUser exista
    if (!req.currentUser || !req.currentUser._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const updatedUser = await userService.findUserById(
      objectIdToString(req.currentUser._id)
    );
    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Populate roles para obtener la información completa
    await updatedUser.populate("roles");

    // Extraer nombres de roles y permisos
    const roleNames = updatedUser.roles?.map((role: any) => role.name) || [
      "guest",
    ];
    const permissions =
      updatedUser.roles?.flatMap((role: any) => role.permissions || []) || [];

    const jwtSecret = process.env.JWT_SECRET as string;
    const newToken = jwt.sign(
      {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        roles: roleNames,
        permissions: permissions,
        nationality: updatedUser.nationality,
        locality: updatedUser.locality,
        age: updatedUser.age,
      },
      jwtSecret,
      { expiresIn: "2h" }
    );
    console.log("New token:", newToken);
    res.json({ token: newToken });
  } catch (error: any) {
    console.error("Error in refreshToken:", error);
    res.status(500).json({ message: error.message || error });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await userService.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    // Generar token y asignar fecha de expiración
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // Vigencia 1 hora
    await user.save();

    // URL de recuperación basada en la variable HOST del .env
    const resetUrl = `${process.env.HOST}/reset-password?token=${token}`;
    await sendResetPasswordEmail(user.email, resetUrl);
    res.json({
      message:
        "Se envió un email con las instrucciones para recuperar la contraseña",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ message: "Error al procesar la solicitud", error });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, password } = req.body;
    // Buscar usuario a través del token de recuperación
    const user = await userService.findUserByResetToken(token);
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      res.status(400).json({
        message: "El token de recuperación es inválido o ha expirado",
      });
      return;
    }
    // Actualizar la contraseña (se aplicará el hash en el pre-save)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: "La contraseña se actualizó correctamente" });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ message: "Error al resetear la contraseña", error });
  }
};
