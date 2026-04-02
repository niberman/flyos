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
exports.CreateAircraftInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
let CreateAircraftInput = class CreateAircraftInput {
    tailNumber;
    make;
    model;
    homeBaseId;
};
exports.CreateAircraftInput = CreateAircraftInput;
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'FAA tail number (e.g., N12345).' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAircraftInput.prototype, "tailNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Aircraft manufacturer.' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAircraftInput.prototype, "make", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Aircraft model designation.' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAircraftInput.prototype, "model", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { description: 'UUID of the default home base (must belong to your organization).' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAircraftInput.prototype, "homeBaseId", void 0);
exports.CreateAircraftInput = CreateAircraftInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Input for adding a new aircraft to the fleet.' })
], CreateAircraftInput);
//# sourceMappingURL=create-aircraft.input.js.map