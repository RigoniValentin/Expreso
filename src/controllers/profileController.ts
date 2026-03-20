import { Request, Response } from "express";
import { UserService } from "@services/userService";
import { UserRepository } from "@repositories/userRepository";
import { IUserRepository, IUserService } from "types/UserTypes";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.currentUser || !req.currentUser._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await userService.findUserById(req.currentUser._id as string);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // No enviar la contraseña
    const userProfile = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar || "",
      bio: user.bio || "",
      nationality: user.nationality,
      locality: user.locality,
      age: user.age,
      createdAt: user.createdAt,
    };

    res.json(userProfile);
  } catch (error: any) {
    console.log("error :>> ", error);
    res.status(500).json({
      message: error.message || "Error getting profile",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.currentUser || !req.currentUser._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.currentUser._id as string;
    const { name, username, bio, nationality, locality, age } = req.body;

    // Validar que el username no esté en uso por otro usuario
    if (username) {
      const existingUser = await userService.findUsers({ username });
      if (
        existingUser.length > 0 &&
        existingUser[0]._id?.toString() !== userId
      ) {
        res.status(400).json({ message: "Username already taken" });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (locality !== undefined) updateData.locality = locality;
    if (age !== undefined) updateData.age = age;

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userProfile = {
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar || "",
      bio: updatedUser.bio || "",
      nationality: updatedUser.nationality,
      locality: updatedUser.locality,
      age: updatedUser.age,
    };

    res.json(userProfile);
  } catch (error: any) {
    console.log("error :>> ", error);
    res.status(500).json({
      message: error.message || "Error updating profile",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const updateAvatar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.currentUser || !req.currentUser._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.currentUser._id as string;
    const { avatar } = req.body;

    if (!avatar) {
      res.status(400).json({ message: "Avatar URL is required" });
      return;
    }

    const updatedUser = await userService.updateUser(userId, { avatar });

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ avatar: updatedUser.avatar });
  } catch (error: any) {
    console.log("error :>> ", error);
    res.status(500).json({
      message: error.message || "Error updating avatar",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.currentUser || !req.currentUser._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.currentUser._id as string;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ message: "Current and new password are required" });
      return;
    }

    if (newPassword.length < 6) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }

    // Actualizar la contraseña y guardar con .save() para que se dispare el pre-save hook
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.log("error :>> ", error);
    res.status(500).json({
      message: error.message || "Error changing password",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
