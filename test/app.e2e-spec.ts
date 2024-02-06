import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { faker } from '@faker-js/faker';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    const fakePerson = {
        email: faker.internet.email(),
        password: faker.internet.password(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/signUp (POST)', async () => {
        const response = await request(app.getHttpServer()).post('/auth/signUp').send(fakePerson).expect(201);
        expect(response.body).toEqual({ status: 200, message: 'User has been successfully created' });
    });

    it('/signIn (POST)', async () => {
        const response = await request(app.getHttpServer()).post('/auth/signIn').send(fakePerson).expect(201);
        expect(response.body.status).toEqual(200);
    });

    afterAll((done) => {
        done();
    });
});
