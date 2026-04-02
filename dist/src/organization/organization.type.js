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
exports.OrganizationType = void 0;
const graphql_1 = require("@nestjs/graphql");
let OrganizationType = class OrganizationType {
    id;
    name;
    slug;
    createdAt;
    updatedAt;
};
exports.OrganizationType = OrganizationType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'Unique identifier (UUID) for the organization.' }),
    __metadata("design:type", String)
], OrganizationType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Name of the organization.' }),
    __metadata("design:type", String)
], OrganizationType.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'URL-safe slug for subdomain or URL routing.' }),
    __metadata("design:type", String)
], OrganizationType.prototype, "slug", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp when the organization was created.' }),
    __metadata("design:type", Date)
], OrganizationType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp of the last update to the organization record.' }),
    __metadata("design:type", Date)
], OrganizationType.prototype, "updatedAt", void 0);
exports.OrganizationType = OrganizationType = __decorate([
    (0, graphql_1.ObjectType)('Organization', {
        description: 'A flight school or operator in the FlyOS system.',
    })
], OrganizationType);
//# sourceMappingURL=organization.type.js.map