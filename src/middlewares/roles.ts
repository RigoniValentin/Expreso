import { RolesRepository } from "@repositories/rolesRepository";
import { RolesService } from "@services/rolesService";
import { NextFunction, Request, Response } from "express";
import { IRolesRepository, IRolesService } from "types/RolesTypes";

const rolesRepository: IRolesRepository = new RolesRepository();
const rolesService: IRolesService = new RolesService(rolesRepository);

// Middleware para autorizar según roles
export const authorize = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log("=== AUTHORIZE MIDDLEWARE ===");
    console.log("Allowed roles:", allowedRoles);
    
    try {
      const user = req.currentUser;
      console.log("Current user from request:", user);
      
      if (!user) {
        console.log("No user found in request");
        res.status(401).json({ message: "No autorizado" });
        return;
      }

      let userRoleNames: string[] = [];

      // Los roles pueden venir poblados (objetos con name) o como ObjectIds
      if (user.roles && user.roles.length > 0) {
        const firstRole = user.roles[0];
        console.log("First role type:", typeof firstRole, firstRole);
        
        // Verificar si los roles ya están poblados (tienen propiedad 'name')
        if (typeof firstRole === 'object' && firstRole !== null && 'name' in firstRole) {
          // Roles ya poblados
          userRoleNames = user.roles.map((role: any) => role.name);
          console.log("Roles populated, names:", userRoleNames);
        } else {
          // Roles son ObjectIds, necesitamos buscarlos
          console.log("Roles are ObjectIds, fetching from DB...");
          const userRoles = await rolesService.findRoles({ _id: { $in: user.roles } });
          userRoleNames = userRoles.map(role => role.name);
          console.log("Roles fetched from DB:", userRoleNames);
        }
      } else {
        console.log("User has no roles");
      }

      console.log("Authorize - User roles:", userRoleNames, "Allowed:", allowedRoles);

      // Verificar si el usuario tiene alguno de los roles permitidos (case insensitive)
      const hasPermission = allowedRoles.some(allowedRole => 
        userRoleNames.some(userRole => 
          userRole.toLowerCase() === allowedRole.toLowerCase()
        )
      );

      if (!hasPermission) {
        res.status(403).json({ message: "Acceso denegado. No tienes permisos suficientes." });
        return;
      }

      next();
    } catch (error) {
      console.log("Error en authorize:", error);
      res.status(500).json({ message: "Error al verificar permisos" });
      return;
    }
  };
};

export const checkRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const roles: string[] = req.body && req.body?.roles ? req.body.roles : [];
  const role = Array.isArray(roles) && roles.length != 0 ? roles : ["user"];
  console.log("req.body", role);

  try {
    const findRoles = await rolesService.findRoles({ name: { $in: role } });

    if (findRoles.length === 0) {
      res.status(404).json({ message: "Role not found" });
      return; // Retorna sin devolver un Response
    }

    req.body.roles = findRoles.map((x) => x._id);

    console.log("req.body.roles :>>", req.body.roles);

    next();
  } catch (error) {
    console.log("error :>>", error);
    res.status(500).json(error);
    return;
  }
};
