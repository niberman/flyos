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
exports.BookingType = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
const user_type_1 = require("../users/user.type");
const aircraft_type_1 = require("../aircraft/aircraft.type");
const base_type_1 = require("../base/base.type");
const schedulable_resource_type_1 = require("./schedulable-resource.type");
const booking_participant_type_1 = require("./booking-participant.type");
(0, graphql_1.registerEnumType)(client_1.BookingStatus, {
    name: 'BookingStatus',
    description: 'Booking lifecycle: scheduled, dispatched, in progress, completed, or cancelled.',
});
let BookingType = class BookingType {
    id;
    startTime;
    endTime;
    status;
    dispatchedAt;
    completedAt;
    cancelledAt;
    createdAt;
    baseId;
    userId;
    schedulableResourceId;
    user;
    aircraft;
    schedulableResource;
    participants;
    base;
};
exports.BookingType = BookingType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'Unique identifier (UUID) for the booking.' }),
    __metadata("design:type", String)
], BookingType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Start time of the booked block.' }),
    __metadata("design:type", Date)
], BookingType.prototype, "startTime", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'End time of the booked block.' }),
    __metadata("design:type", Date)
], BookingType.prototype, "endTime", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.BookingStatus),
    __metadata("design:type", String)
], BookingType.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    __metadata("design:type", Object)
], BookingType.prototype, "dispatchedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    __metadata("design:type", Object)
], BookingType.prototype, "completedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    __metadata("design:type", Object)
], BookingType.prototype, "cancelledAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp when the booking was created.' }),
    __metadata("design:type", Date)
], BookingType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'UUID of the base where the block occurs.' }),
    __metadata("design:type", String)
], BookingType.prototype, "baseId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, {
        description: 'UUID of the organizing user (renter / booker).',
    }),
    __metadata("design:type", String)
], BookingType.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'Schedulable resource UUID.' }),
    __metadata("design:type", String)
], BookingType.prototype, "schedulableResourceId", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_type_1.UserType, {
        nullable: true,
        description: 'The organizing user (populated via relation).',
    }),
    __metadata("design:type", user_type_1.UserType)
], BookingType.prototype, "user", void 0);
__decorate([
    (0, graphql_1.Field)(() => aircraft_type_1.AircraftType, {
        nullable: true,
        description: 'The aircraft when this booking targets an aircraft resource.',
    }),
    __metadata("design:type", aircraft_type_1.AircraftType)
], BookingType.prototype, "aircraft", void 0);
__decorate([
    (0, graphql_1.Field)(() => schedulable_resource_type_1.SchedulableResourceType, { nullable: true }),
    __metadata("design:type", schedulable_resource_type_1.SchedulableResourceType)
], BookingType.prototype, "schedulableResource", void 0);
__decorate([
    (0, graphql_1.Field)(() => [booking_participant_type_1.BookingParticipantType], { nullable: true }),
    __metadata("design:type", Array)
], BookingType.prototype, "participants", void 0);
__decorate([
    (0, graphql_1.Field)(() => base_type_1.BaseType, {
        nullable: true,
        description: 'The base where this booking occurs (populated via relation).',
    }),
    __metadata("design:type", base_type_1.BaseType)
], BookingType.prototype, "base", void 0);
exports.BookingType = BookingType = __decorate([
    (0, graphql_1.ObjectType)('Booking', {
        description: 'A scheduled reservation for a schedulable resource at a base.',
    })
], BookingType);
//# sourceMappingURL=booking.type.js.map