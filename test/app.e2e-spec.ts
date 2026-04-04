/**
 * Root smoke test for the demo HTML surface.
 *
 * This suite boots the real AppModule but swaps Prisma for a tiny mock so the
 * HTTP surface can be exercised without requiring a live database.
 */

import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const mockPrisma = {
  user: {
    count: jest.fn().mockResolvedValue(1),
  },
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    (app as NestExpressApplication).useStaticAssets(
      join(process.cwd(), 'public'),
    );
    await app.listen(0, '127.0.0.1');
  });

  it('/ (GET) serves the ribbon scheduler shell', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(response.text).toContain('FlyOS');
    expect(response.text).toContain('/scheduler.css');
    expect(response.text).toContain('/scheduler.js');
  });

  it('/scheduler (GET) serves the ribbon scheduler shell', async () => {
    const response = await request(app.getHttpServer())
      .get('/scheduler')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(response.text).toContain('FlyOS');
    expect(response.text).toContain('/scheduler.css');
  });

  it('/ (GET) includes v0 scheduler UI structure', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200);

    // Sidebar navigation
    expect(response.text).toContain('class="sidebar"');
    // Top bar with brand
    expect(response.text).toContain('class="top-bar"');
    expect(response.text).toContain('FlyOS');
    // Timeline header
    expect(response.text).toContain('id="timeline-header"');
    // Backend linkage map
    expect(response.text).toContain('id="backend-map"');
    // Resource rows container
    expect(response.text).toContain('id="resource-rows"');
    // Scroll surface
    expect(response.text).toContain('id="scroll-surface"');
    // Base/date controls
    expect(response.text).toContain('id="select-base"');
    expect(response.text).toContain('id="input-date"');
    expect(response.text).toContain('id="btn-load"');
    // FAB
    expect(response.text).toContain('id="fab"');
  });

  it('/scheduler.css (GET) serves the stylesheet', async () => {
    await request(app.getHttpServer())
      .get('/scheduler.css')
      .expect(200)
      .expect('Content-Type', /css/);
  });

  it('/scheduler.js (GET) serves the script', async () => {
    await request(app.getHttpServer())
      .get('/scheduler.js')
      .expect(200)
      .expect('Content-Type', /javascript/);
  });

  afterAll(async () => {
    await app.close();
  });
});
