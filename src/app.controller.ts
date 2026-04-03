// ==========================================================================
// AppController — Serves the ribbon scheduler static UI
// ==========================================================================

import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  sendRibbonRoot(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'public', 'scheduler.html'));
  }

  /** Alias; same shell as GET / (registered on Express in main.ts as well). */
  @Get('scheduler')
  sendScheduler(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'public', 'scheduler.html'));
  }
}
