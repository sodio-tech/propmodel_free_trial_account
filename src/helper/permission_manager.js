import { knex } from "propmodel_api_core";

class PermissionManager {
  constructor(loggedInUserUuid) {
    this.loggedInUserUuid = loggedInUserUuid;
  }

  // Fetch all available permissions
  allPermissions = async () => {
    const permissions = await knex("permissions").select("uuid", "name");

    return permissions;
  };

  loggedInUser = async () => {
    const user = await knex("users")
      .select("*")
      .where("uuid", this.loggedInUserUuid)
      .first();

    return user;
  };

  // Fetch permissions for this role, return map { permissionName: true/false }
  listPermissions = async () => {
    try {
      const loggedInUser = await this.loggedInUser();

      const allPermissions = await this.allPermissions();

      const rolePermissions = await knex("role_permissions")
        .join(
          "permissions",
          "role_permissions.permission_uuid",
          "permissions.uuid"
        )
        .where("role_permissions.role_uuid", loggedInUser.role_id)
        .select("permissions.uuid", "permissions.name");

      const rolePermissionSet = new Set(rolePermissions.map((p) => p.name));

      // Build map of all permissions with true/false
      const permissionMap = {};
      allPermissions.forEach((p) => {
        permissionMap[p.name] = rolePermissionSet.has(p.name);
      });

      return permissionMap;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw error;
    }
  };

  // Check if role has ANY of the given permissions
  haveAnyPermissions = async (permissionNames = []) => {
    const permissionMap = await this.listPermissions();
    return permissionNames.some((p) => permissionMap[p] === true);
  };

  // Check if role has ALL of the given permissions
  haveAllPermissions = async (permissionNames = []) => {
    const permissionMap = await this.listPermissions();

    return permissionNames.every((p) => permissionMap[p] === true);
  };

  // Single permission check
  hasPermission = async (permission) => {
    return await this.haveAllPermissions([permission]);
  };
}

export default PermissionManager;
