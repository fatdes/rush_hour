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

  // transformed from raw to horizontal & vertical, stored as string '[[], [], ...]'
  @Column
  h: string;
  @Column
  v: string;

  // hash of h & v
  @Column
  hash: string;
}
