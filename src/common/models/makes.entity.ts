import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { VehicleTypes } from "./vehicleTypes.entity";

import { Field, ObjectType } from "@nestjs/graphql";

@Entity()
@ObjectType()
export class Makes {

  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column({ type:"varchar", length:100 })
  @Field()
    makeName: string;

  @Column({ type:"int", unique:true })
  @Field()
    makeId:number;

  @ManyToMany(() => VehicleTypes, (vehicleTypes) => vehicleTypes.makes)
  @JoinTable()
  @Field(() => [ VehicleTypes ]) 
    vehicleTypes: VehicleTypes[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt: Date;
}