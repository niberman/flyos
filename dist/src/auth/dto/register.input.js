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
exports.RegisterInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
(0, graphql_1.registerEnumType)(client_1.Role, {
    name: 'Role',
    description: 'User role determining access level within the system.',
});
let RegisterInput = class RegisterInput {
    email;
    password;
    role;
    organizationId;
    organizationName;
};
exports.RegisterInput = RegisterInput;
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Unique email address for the account.' }),
    (0, class_validator_1.IsEmail)({}, { message: 'A valid email address is required.' }),
    __metadata("design:type", String)
], RegisterInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Password (minimum 8 characters).' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long.' }),
    __metadata("design:type", String)
], RegisterInput.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.Role, {
        nullable: true,
        defaultValue: client_1.Role.STUDENT,
        description: 'Role assigned to the user. Defaults to STUDENT if not specified.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], RegisterInput.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, {
        nullable: true,
        description: 'UUID of an existing organization. If set, the user joins this org (no new org is created).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RegisterInput.prototype, "organizationId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, {
        nullable: true,
        description: 'Name for a new organization. Ignored if organizationId is provided. Creates org, default base, and assigns the user.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Organization name cannot be empty.' }),
    __metadata("design:type", String)
], RegisterInput.prototype, "organizationName", void 0);
exports.RegisterInput = RegisterInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Input for registering a new user account.' })
], RegisterInput);
//# sourceMappingURL=register.input.js.map