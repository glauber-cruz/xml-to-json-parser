import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm";
import { Makes } from "./makes.entity";

import { Field, ObjectType } from "@nestjs/graphql";

@Entity()
@ObjectType()
export class VehicleTypes {

  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column({ type:"varchar", length:100 })
  @Field()
    typeName: string;

  @Column({ type:"int", unique:true })
  @Field()
    typeId:number;

  @ManyToMany(() => Makes, (makes) => makes.vehicleTypes)
    makes: Makes[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt: Date;
}