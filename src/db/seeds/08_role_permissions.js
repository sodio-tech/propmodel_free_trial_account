import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("role_permissions").del();

  // Get all roles and permissions
  const roles = await knex("roles").select("uuid", "name");
  const permissions = await knex("permissions").select("uuid", "name");

  // Find specific roles by name
  const adminRole = roles.find((role) => role.name === "admin");
  const masterAdminRole = roles.find((role) => role.name === "master_admin");
  const subadminRole = roles.find((role) => role.name === "subadmin");
  const customerSupportRole = roles.find(
    (role) => role.name === "customer_support"
  );
  const userRole = roles.find((role) => role.name === "user");

  // Helper function to create role_permission entries
  const createRolePermission = (roleUuid, permissionUuid) => ({
    uuid: faker.string.uuid(),
    role_id: roleUuid, // Changed from role_uuid to role_id
    permission_id: permissionUuid, // Changed from permission_uuid to permission_id
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Array to hold all role_permissions entries
  const rolePermissions = [];

  // Assign permissions to roles based on their responsibilities
  if (adminRole && masterAdminRole && subadminRole && customerSupportRole) {
    // Master Admin gets all permissions
    permissions.forEach((permission) => {
      rolePermissions.push(
        createRolePermission(masterAdminRole.uuid, permission.uuid)
      );
    });

    // Admin gets most permissions except for some master admin specific ones
    permissions.forEach((permission) => {
      if (permission.name !== "manage_users") {
        rolePermissions.push(
          createRolePermission(adminRole.uuid, permission.uuid)
        );
      }
    });

    // Subadmin gets limited admin permissions
    const subadminPermissions = [
      "view_users",
      "view_payouts",
      "view_mt5_accounts",
      "view_statistics",
    ];
    permissions
      .filter((permission) => subadminPermissions.includes(permission.name))
      .forEach((permission) => {
        rolePermissions.push(
          createRolePermission(subadminRole.uuid, permission.uuid)
        );
      });

    // Customer support gets view-only permissions
    const supportPermissions = [
      "view_users",
      "view_payouts",
      "view_mt5_accounts",
    ];
    permissions
      .filter((permission) => supportPermissions.includes(permission.name))
      .forEach((permission) => {
        rolePermissions.push(
          createRolePermission(customerSupportRole.uuid, permission.uuid)
        );
      });
  }

  // Insert all role_permissions
  if (rolePermissions.length > 0) {
    await knex("role_permissions").insert(rolePermissions);
  }
};
