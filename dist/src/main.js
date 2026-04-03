"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const express_1 = __importDefault(require("express"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const publicDir = (0, path_1.join)(process.cwd(), 'public');
    const expressApp = (0, express_1.default)();
    const sendScheduler = (_req, res) => {
        res.sendFile((0, path_1.join)(publicDir, 'scheduler.html'));
    };
    expressApp.get('/', sendScheduler);
    expressApp.get('/scheduler', sendScheduler);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp));
    app.useStaticAssets(publicDir);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map