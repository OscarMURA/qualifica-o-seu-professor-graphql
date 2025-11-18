import { applyDecorators, UseGuards } from "@nestjs/common";
import { ValidRoles } from "src/auth/enums/valid-roles.enum";
import { RoleProtected } from "../role-protected/role-protected.decorator";
import { UserRoleGuard } from "src/auth/guards/user-role/user-role.guard";
import { GraphqlAuthGuard } from "src/auth/guards/graphql-auth/graphql-auth.guard";

export function Auth(...roles: ValidRoles[]){
    return applyDecorators(
        RoleProtected(...roles),
        UseGuards(GraphqlAuthGuard, UserRoleGuard)
    )
}