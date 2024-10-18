import { Module } from "@nestjs/common";
import { AppService } from "./app.service";

import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { Makes } from "./common/models/makes.entity";
import { VehicleTypes } from "./common/models/vehicleTypes.entity";

import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";

import { MakesResolver } from "./common/graphql/resolver/makes.resolver";
import { join } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:process.env.NODE_ENV === "test" ? ".env.test" : ".env", 
      isGlobal: true,
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile:join(process.cwd(), "src/schema.gql")
    }),
    
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [ Makes, VehicleTypes ],
      synchronize: true,
    }),

    TypeOrmModule.forFeature([ Makes, VehicleTypes ])

  ],
  controllers: [ ],
  providers: [ AppService, MakesResolver ],
})
export class AppModule {}
