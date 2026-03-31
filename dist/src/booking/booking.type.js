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
const user_type_1 = require("../users/user.type");
const aircraft_type_1 = require("../aircraft/aircraft.type");
let BookingType = class BookingType {
    id;
    startTime;
    endTime;
    createdAt;
    userId;
    aircraftId;
    user;
    aircraft;
};
exports.BookingType = BookingType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'Unique identifier (UUID) for the booking.' }),
    __metadata("design:type", String)
], BookingType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Start time of the booked flight block.' }),
    __metadata("design:type", Date)
], BookingType.prototype, "startTime", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'End time of the booked flight block.' }),
    __metadata("design:type", Date)
], BookingType.prototype, "endTime", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { description: 'Timestamp when the booking was created.' }),
    __metadata("design:type", Date)
], BookingType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'UUID of the user who made the booking.' }),
    __metadata("design:type", String)
], BookingType.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'UUID of the booked aircraft.' }),
    __metadata("design:type", String)
], BookingType.prototype, "aircraftId", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_type_1.UserType, {
        nullable: true,
        description: 'The user who owns this booking (populated via relation).',
    }),
    __metadata("design:type", user_type_1.UserType)
], BookingType.prototype, "user", void 0);
__decorate([
    (0, graphql_1.Field)(() => aircraft_type_1.AircraftType, {
        nullable: true,
        description: 'The aircraft reserved for this booking (populated via relation).',
    }),
    __metadata("design:type", aircraft_type_1.AircraftType)
], BookingType.prototype, "aircraft", void 0);
exports.BookingType = BookingType = __decorate([
    (0, graphql_1.ObjectType)('Booking', {
        description: 'A scheduled flight booking for a user and aircraft.',
    })
], BookingType);
//# sourceMappingURL=booking.type.js.map