// ==========================================================================
// AppController — Serves the disposable demo UI at GET /
// ==========================================================================

import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  sendDemoRoot(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'public', 'index.html'));
  }
}
