import { Test, TestingModule } from '@nestjs/testing';
import { SolverController } from './solver.controller';
import { SolverService } from './solver.service';

describe('SolverController', () => {
  let solverController: SolverController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SolverController],
      providers: [SolverService],
    }).compile();

    solverController = app.get<SolverController>(SolverController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(solverController.getHello()).toBe('Hello World!');
    });
  });
});
