import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";

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

  @Column()
  public schema!: string

  @CreateDateColumn()
  public createdAt!: Date
}
