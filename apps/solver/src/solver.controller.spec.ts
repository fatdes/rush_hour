import { Car, CarPosition, MovementDirection } from '@board/board';
import { Test } from '@nestjs/testing';
import { SolverController } from './solver.controller';

describe('SolverController', () => {
  let solverController: SolverController;

  const mockClientProxy = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SolverController,
        {
          provide: 'KAFKA_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    solverController = moduleRef.get<SolverController>(SolverController);
  });

  it(
    'solve',
    async () => {
      const cars: Car[] = [];

      cars.push(
        newCar(1, [
          { h: 0, v: 2 },
          { h: 1, v: 2 },
        ]),
      );
      cars.push(
        newCar(2, [
          { h: 0, v: 0 },
          { h: 1, v: 0 },
          { h: 2, v: 0 },
        ]),
      );
      cars.push(
        newCar(3, [
          { h: 5, v: 0 },
          { h: 5, v: 1 },
          { h: 5, v: 2 },
        ]),
      );
      cars.push(
        newCar(4, [
          { h: 2, v: 1 },
          { h: 2, v: 2 },
          { h: 2, v: 3 },
        ]),
      );
      cars.push(
        newCar(5, [
          { h: 0, v: 3 },
          { h: 0, v: 4 },
        ]),
      );
      cars.push(
        newCar(6, [
          { h: 4, v: 3 },
          { h: 5, v: 3 },
        ]),
      );
      cars.push(
        newCar(7, [
          { h: 4, v: 4 },
          { h: 4, v: 5 },
        ]),
      );
      cars.push(
        newCar(8, [
          { h: 0, v: 5 },
          { h: 1, v: 5 },
          { h: 2, v: 5 },
        ]),
      );

      const { solution } = await solverController.solve(cars);

      // order of the steps may differ depends on how we solve it
      expect(solution!.length).toBe(
        [
          { carId: 2, direction: MovementDirection.Right },
          { carId: 2, direction: MovementDirection.Right },
          { carId: 6, direction: MovementDirection.Left },
          { carId: 3, direction: MovementDirection.Down },
          { carId: 2, direction: MovementDirection.Right },
          { carId: 4, direction: MovementDirection.Up },
          { carId: 3, direction: MovementDirection.Down },
          { carId: 6, direction: MovementDirection.Left },
          { carId: 6, direction: MovementDirection.Left },
          { carId: 8, direction: MovementDirection.Right },
          { carId: 5, direction: MovementDirection.Down },
          { carId: 6, direction: MovementDirection.Left },
          { carId: 4, direction: MovementDirection.Down },
          { carId: 4, direction: MovementDirection.Down },
          { carId: 7, direction: MovementDirection.Up },
          { carId: 8, direction: MovementDirection.Right },
          { carId: 8, direction: MovementDirection.Right },
          { carId: 4, direction: MovementDirection.Down },
          { carId: 1, direction: MovementDirection.Right },
          { carId: 1, direction: MovementDirection.Right },
          { carId: 1, direction: MovementDirection.Right },
          { carId: 4, direction: MovementDirection.Up },
          { carId: 8, direction: MovementDirection.Left },
          { carId: 3, direction: MovementDirection.Down },
          { carId: 1, direction: MovementDirection.Right },
        ].length,
      );
    },
    60 * 1000,
  );

  const newCar = (carId: number, positions: CarPosition[]) => {
    const car = new Car(carId);
    for (let p of positions) {
      car.addPosition(p);
    }
    return car;
  };
});
