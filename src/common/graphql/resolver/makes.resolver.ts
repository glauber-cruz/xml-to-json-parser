import { Resolver, Query } from "@nestjs/graphql";
import { AppService } from "../../../app.service";

import { Makes } from "../../../common/models/makes.entity";

@Resolver()
export class MakesResolver {

  constructor(
    private readonly appService: AppService
  ) {}

  @Query(() => [ Makes ])
  async makes() {
    return await this.appService.getMakers();
  }

}