// ==========================================================================
// AppController — Unit Tests
// ==========================================================================

import { AppController } from './app.controller';
import { join } from 'path';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController();
  });

  describe('sendRibbonRoot', () => {
    it('sends the public/scheduler.html file', () => {
      const mockRes = {
        sendFile: jest.fn(),
      };

      controller.sendRibbonRoot(mockRes as any);

      expect(mockRes.sendFile).toHaveBeenCalledWith(
        join(process.cwd(), 'public', 'scheduler.html'),
      );
    });

    it('calls sendFile exactly once', () => {
      const mockRes = {
        sendFile: jest.fn(),
      };

      controller.sendRibbonRoot(mockRes as any);

      expect(mockRes.sendFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendScheduler', () => {
    it('sends the public/scheduler.html file', () => {
      const mockRes = { sendFile: jest.fn() };
      controller.sendScheduler(mockRes as any);
      expect(mockRes.sendFile).toHaveBeenCalledWith(
        join(process.cwd(), 'public', 'scheduler.html'),
      );
    });
  });
});
