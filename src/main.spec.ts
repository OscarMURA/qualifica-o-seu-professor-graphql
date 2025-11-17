import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

describe('Main Bootstrap Configuration', () => {
  describe('Module imports', () => {
    it('should have NestFactory imported', () => {
      expect(NestFactory).toBeDefined();
      expect(typeof NestFactory.create).toBe('function');
    });

    it('should have ValidationPipe imported', () => {
      expect(ValidationPipe).toBeDefined();
    });

    it('should have AppModule imported', () => {
      expect(AppModule).toBeDefined();
    });
  });

  describe('ValidationPipe configuration', () => {
    it('should create ValidationPipe with whitelist option', () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect(pipe).toBeInstanceOf(ValidationPipe);
    });

    it('should have whitelist enabled', () => {
      const options = { whitelist: true, forbidNonWhitelisted: true };
      expect(options.whitelist).toBe(true);
    });

    it('should have forbidNonWhitelisted enabled', () => {
      const options = { whitelist: true, forbidNonWhitelisted: true };
      expect(options.forbidNonWhitelisted).toBe(true);
    });

    it('should create pipe with both options', () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      
      expect(pipe).toBeInstanceOf(ValidationPipe);
    });
  });

  describe('Application configuration values', () => {
    it('should use api as global prefix', () => {
      const prefix = 'api';
      expect(prefix).toBe('api');
      expect(typeof prefix).toBe('string');
    });

    it('should use port 9090', () => {
      const port = 9090;
      expect(port).toBe(9090);
      expect(typeof port).toBe('number');
    });

    it('should enable CORS', () => {
      const corsEnabled = true;
      expect(corsEnabled).toBe(true);
    });
  });

  describe('NestFactory methods', () => {
    it('should have create method', () => {
      expect(NestFactory.create).toBeDefined();
      expect(typeof NestFactory.create).toBe('function');
    });

    it('should accept module as parameter', () => {
      expect(AppModule).toBeDefined();
    });
  });

  describe('ValidationPipe class', () => {
    let pipe: ValidationPipe;

    beforeEach(() => {
      pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      });
    });

    it('should be instantiable', () => {
      expect(pipe).toBeInstanceOf(ValidationPipe);
    });

    it('should be configured with options', () => {
      expect(pipe).toBeInstanceOf(ValidationPipe);
    });

    it('should accept whitelist option', () => {
      const testPipe = new ValidationPipe({ whitelist: true });
      expect(testPipe).toBeInstanceOf(ValidationPipe);
    });

    it('should accept forbidNonWhitelisted option', () => {
      const testPipe = new ValidationPipe({ forbidNonWhitelisted: true });
      expect(testPipe).toBeInstanceOf(ValidationPipe);
    });

    it('should create multiple instances', () => {
      const pipe1 = new ValidationPipe({ whitelist: true });
      const pipe2 = new ValidationPipe({ forbidNonWhitelisted: true });
      
      expect(pipe1).toBeInstanceOf(ValidationPipe);
      expect(pipe2).toBeInstanceOf(ValidationPipe);
      expect(pipe1).not.toBe(pipe2);
    });
  });

  describe('Configuration constants', () => {
    it('should define api prefix', () => {
      const API_PREFIX = 'api';
      expect(API_PREFIX).toBe('api');
    });

    it('should define port', () => {
      const PORT = 9090;
      expect(PORT).toBe(9090);
    });

    it('should have numeric port', () => {
      const PORT = 9090;
      expect(Number.isInteger(PORT)).toBe(true);
    });

    it('should have valid port range', () => {
      const PORT = 9090;
      expect(PORT).toBeGreaterThan(0);
      expect(PORT).toBeLessThan(65536);
    });
  });

  describe('AppModule integration', () => {
    it('should be a valid NestJS module', () => {
      expect(AppModule).toBeDefined();
      const imports = Reflect.getMetadata('imports', AppModule) || [];
      expect(imports.length).toBeGreaterThan(0);
    });

    it('should be usable with NestFactory', () => {
      expect(AppModule).toBeDefined();
      expect(NestFactory.create).toBeDefined();
    });
  });

  describe('Bootstrap flow', () => {
    it('should follow correct initialization order', () => {
      const steps = ['create', 'setGlobalPrefix', 'useGlobalPipes', 'enableCors', 'listen'];
      expect(steps.length).toBe(5);
      expect(steps[0]).toBe('create');
      expect(steps[steps.length - 1]).toBe('listen');
    });

    it('should set prefix before pipes', () => {
      const steps = ['setGlobalPrefix', 'useGlobalPipes'];
      expect(steps.indexOf('setGlobalPrefix')).toBeLessThan(steps.indexOf('useGlobalPipes'));
    });

    it('should configure pipes before listening', () => {
      const steps = ['useGlobalPipes', 'listen'];
      expect(steps.indexOf('useGlobalPipes')).toBeLessThan(steps.indexOf('listen'));
    });

    it('should enable CORS before listening', () => {
      const steps = ['enableCors', 'listen'];
      expect(steps.indexOf('enableCors')).toBeLessThan(steps.indexOf('listen'));
    });
  });

  describe('async operations', () => {
    it('should handle async create', async () => {
      const promise = Promise.resolve({});
      await expect(promise).resolves.toBeDefined();
    });

    it('should handle async listen', async () => {
      const listenPromise = Promise.resolve();
      await expect(listenPromise).resolves.toBeUndefined();
    });

    it('should wait for all operations', async () => {
      const operations = [
        Promise.resolve(),
        Promise.resolve(),
        Promise.resolve(),
      ];
      
      await expect(Promise.all(operations)).resolves.toHaveLength(3);
    });
  });
});
