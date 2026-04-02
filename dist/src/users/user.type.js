"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserType = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
let UserType = class UserType {
    id;
    email;
    role;
    organizationId;
    createdAt;
    updatedAt;
};
exports.UserType = UserType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'Unique identifier (UUID) for the user.' }),
    __metadata("design:type", String)
], UserType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Email address of the user.' }),
    __metadata("design:type", String)
], UserType.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.Role, { description: 'Role determining the user\'s access level.' }),
    __metadata("design:type", String)
], UserType.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'UUID of the organization this user belongs to.' }),
    __metadata("design:type", String)
], UserType.prototype, "organizationId", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp when the user was created.' }),
    __metadata("design:type", Date)
], UserType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp of the last update to the user record.' }),
    __metadata("design:type", Date)
], UserType.prototype, "updatedAt", void 0);
exports.UserType = UserType = __decorate([
    (0, graphql_1.ObjectType)('User', { description: 'A registered user in the FlyOS system.' })
], UserType);
//# sourceMappingURL=user.type.js.map