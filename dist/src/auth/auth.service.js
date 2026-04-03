"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    slugifyOrganizationName(name) {
        return name.trim().toLowerCase().replace(/\s+/g, '-');
    }
    async ensureUniqueOrganizationSlug(baseSlug) {
        let slug = baseSlug;
        let n = 0;
        while (await this.prisma.organization.findUnique({ where: { slug } })) {
            n += 1;
            slug = `${baseSlug}-${n}`;
        }
        return slug;
    }
    async register(input) {
        const existing = await this.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists.');
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        let organizationId;
        let defaultBaseId;
        if (input.organizationId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: input.organizationId },
                include: {
                    bases: { take: 1, orderBy: { createdAt: 'asc' } },
                },
            });
            if (!org) {
                throw new common_1.BadRequestException('Organization not found');
            }
            const base = org.bases[0];
            if (!base) {
                throw new common_1.BadRequestException('Organization has no base. Add a base before inviting users.');
            }
            organizationId = org.id;
            defaultBaseId = base.id;
        }
        else if (input.organizationName?.trim()) {
            const name = input.organizationName.trim();
            const baseSlug = this.slugifyOrganizationName(name);
            const slug = await this.ensureUniqueOrganizationSlug(baseSlug);
            const created = await this.prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({
                    data: { name, slug },
                });
                const base = await tx.base.create({
                    data: {
                        organizationId: org.id,
                        name: 'Main Base',
                        icaoCode: 'XXXX',
                        timezone: 'UTC',
                    },
                });
                const user = await tx.user.create({
                    data: {
                        email: input.email,
                        passwordHash,
                        role: input.role ?? undefined,
                        organizationId: org.id,
                    },
                });
                await tx.userBase.create({
                    data: { userId: user.id, baseId: base.id },
                });
                return { user, organizationId: org.id };
            });
            const payload = {
                sub: created.user.id,
                role: created.user.role,
                organizationId: created.organizationId,
            };
            return {
                access_token: this.jwtService.sign(payload),
                organizationId: created.organizationId,
            };
        }
        else {
            throw new common_1.BadRequestException('Organization is required');
        }
        const user = await this.prisma.user.create({
            data: {
                email: input.email,
                passwordHash,
                role: input.role ?? undefined,
                organizationId,
            },
        });
        await this.prisma.userBase.create({
            data: { userId: user.id, baseId: defaultBaseId },
        });
        const payload = {
            sub: user.id,
            role: user.role,
            organizationId,
        };
        return {
            access_token: this.jwtService.sign(payload),
            organizationId,
        };
    }
    async login(input) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const payload = {
            sub: user.id,
            role: user.role,
            organizationId: user.organizationId,
        };
        return {
            access_token: this.jwtService.sign(payload),
            organizationId: user.organizationId,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map