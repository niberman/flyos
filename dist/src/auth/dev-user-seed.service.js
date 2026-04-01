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
var DevUserSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevUserSeedService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const dev_auth_config_1 = require("./dev-auth.config");
let DevUserSeedService = DevUserSeedService_1 = class DevUserSeedService {
    config;
    prisma;
    logger = new common_1.Logger(DevUserSeedService_1.name);
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
    }
    async onModuleInit() {
        if (!(0, dev_auth_config_1.isDevAuthBypassEnabled)(this.config)) {
            return;
        }
        const count = await this.prisma.user.count();
        if (count > 0) {
            return;
        }
        const email = this.config.get('FLYOS_DEV_SEED_EMAIL')?.trim() ||
            'dev@flyos.local';
        const password = this.config.get('FLYOS_DEV_SEED_PASSWORD')?.trim() || 'flyosdev';
        const passwordHash = await bcrypt.hash(password, 10);
        try {
            await this.prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    role: client_1.Role.DISPATCHER,
                },
            });
            this.logger.log(`Seeded dev user ${email} (login password: env FLYOS_DEV_SEED_PASSWORD or default "flyosdev").`);
        }
        catch (err) {
            const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
            if (code === 'P2002') {
                return;
            }
            throw err;
        }
    }
};
exports.DevUserSeedService = DevUserSeedService;
exports.DevUserSeedService = DevUserSeedService = DevUserSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], DevUserSeedService);
//# sourceMappingURL=dev-user-seed.service.js.map