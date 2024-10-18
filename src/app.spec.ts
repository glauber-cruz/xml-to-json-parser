import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./app.module";

import { AppService } from "./app.service";
import { INestApplication } from "@nestjs/common";

describe("AppService Integration Test", () => {
  process.env.NODE_ENV = "test";
  let service: AppService;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<AppService>(AppService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getMakers", () => {
    it("should return a list of makers", async () => {
      const result = await service.getMakers();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      expect(result[0].makeId).toBeDefined();
      expect(result[0].makeName).toBeDefined();

      expect(result[0].vehicleTypes).toBeDefined();

      if (result[0].vehicleTypes) {
        expect(result[0].vehicleTypes[0].typeId).toBeDefined();
        expect(result[0].vehicleTypes[0].typeName).toBeDefined();
      }
    });
  });
});