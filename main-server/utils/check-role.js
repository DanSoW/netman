import { isUndefinedOrNull } from "./objector.js";

/**
 * Check role of user
 * @param {*} usersRolesDB Instance of UsersRoles (Sequelize)
 * @param {*} roleDB Instance of Roles (Sequelize)
 * @param {*} users_id User id
 * @param {*} targetPriority Target priority for check
 * @returns 
 */
export async function checkRole(usersRolesDB, roleDB, users_id, targetPriority) {
    if(!usersRolesDB || isUndefinedOrNull(users_id) || isUndefinedOrNull(targetPriority)) {
        return false;
    }

    const roles = await usersRolesDB.findAll({
        where: {
            users_id: users_id
        }
    });

    if(!Array.isArray(roles) || roles.length == 0) {
        return false;
    }

    let flag = false;
    for(let i = 0; i < roles.length && !flag; i++) {
        const item = roles[i].dataValues;
        const role = await roleDB.findOne({
            where: {
                id: item.roles_id
            }
        });

        if(role && role.priority >= targetPriority) {
            flag = true;
        }
    }

    return flag;
}