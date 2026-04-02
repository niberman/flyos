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
exports.BookingParticipantType = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
const user_type_1 = require("../users/user.type");
(0, graphql_1.registerEnumType)(client_1.BookingParticipantRole, {
    name: 'BookingParticipantRole',
    description: 'Role of a user on a booking (renter or instructor).',
});
let BookingParticipantType = class BookingParticipantType {
    id;
    userId;
    role;
    user;
};
exports.BookingParticipantType = BookingParticipantType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], BookingParticipantType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], BookingParticipantType.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.BookingParticipantRole),
    __metadata("design:type", String)
], BookingParticipantType.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_type_1.UserType, { nullable: true }),
    __metadata("design:type", user_type_1.UserType)
], BookingParticipantType.prototype, "user", void 0);
exports.BookingParticipantType = BookingParticipantType = __decorate([
    (0, graphql_1.ObjectType)('BookingParticipant')
], BookingParticipantType);
//# sourceMappingURL=booking-participant.type.js.map