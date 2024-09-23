import {
  AutoIncrement,
  Column,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({
  // in case you want to obfuscate
  modelName: 'board',
  // personal preferences, don't use purals
  tableName: 'board',
})
export class Board extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: string;

  // Deprecated: these three columns will be removed once column "cars" is in place.
  @Column
  h: string;
  @Column
  v: string;

  @Column
  cars: string;
  @Column
  hash: string;
}
