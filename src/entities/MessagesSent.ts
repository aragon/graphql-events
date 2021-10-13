import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class MessagesSent {
  @PrimaryColumn()
  public hash!: string;

  @Column()
  public source!: string

  @Column()
  public type!: string

  @Column()
  public messageId!: string
}
