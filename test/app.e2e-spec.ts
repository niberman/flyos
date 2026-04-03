/**
 * Root smoke test for the demo HTML surface.
 *
 * This suite boots the real AppModule but swaps Prisma for a tiny mock so the
 * HTTP surface can be exercised without requiring a live database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

    app = moduleFixture.createNestApplication();
    // Bind explicitly to loopback so Supertest receives a real listening
    // server instead of trying to call `.listen()` on our behalf.
    await app.listen(0, '127.0.0.1');
  });

  it('/ (GET) serves the ribbon scheduler shell', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(response.text).toContain('FlyOS Scheduler');
    expect(response.text).toContain('/scheduler.css');
    expect(response.text).toContain('/graphql');
  });

  it('/scheduler (GET) serves the ribbon scheduler shell', async () => {
    const response = await request(app.getHttpServer())
      .get('/scheduler')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(response.text).toContain('FlyOS Scheduler');
    expect(response.text).toContain('/scheduler.css');
  });

  afterAll(async () => {
    await app.close();
  });
});
