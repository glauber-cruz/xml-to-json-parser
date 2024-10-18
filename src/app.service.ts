import { convertXmlToJson } from "./common/libs/xmlConverter";
import { Injectable } from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";

import Bottleneck from "bottleneck";
import { Makes } from "./common/models/makes.entity";

import { Repository } from "typeorm";
import { VehicleTypes } from "./common/models/vehicleTypes.entity";

@Injectable()
export class AppService {

  private limiter: Bottleneck; 

  constructor(

    @InjectRepository(Makes)
    private readonly makeRepository: Repository<Makes>,

    @InjectRepository(VehicleTypes)
    private readonly vehicleTypesRepository: Repository<VehicleTypes>,

  ) {
    this.limiter = new Bottleneck({
      minTime: 100,
      maxConcurrent: 50,
    });
  }

  async getMakers() {
    const rawMakersJson = await this.getAllMakersInApi();
    const allMakesInDatabase = await this.getAllMakesInDatabase();

    const savedMakesIds = allMakesInDatabase.map((make) => make.makeId);
    const json = await this.saveMakersAndVehiclesInDatabase(rawMakersJson, savedMakesIds, allMakesInDatabase);

    return json;
  }


  private async getAllMakersInApi() {
    const url = "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML";
    const rawMakersJson = await this.getRawJson(url);
    return rawMakersJson;
  }


  private async getAllMakesInDatabase() {
    return await this.makeRepository.find({
      relations: [ "vehicleTypes" ]
    });
  }


  private async saveMakersAndVehiclesInDatabase(makesElements:MakesJson[], savedMakesIds:number[], allMakesInDatabase:Makes[]) {
    const makes:MakesData[] = [];
    const chunkSize = process.env.NODE_env === "test" ? 1 : 200;

    let makesToSaveInDatabase:MakesData[] = [];

    const status = { completed:0 };

    for (let i = 0; i < makesElements.length; i += chunkSize) {
      if(process.env.NODE_ENV === "test" && i === 1) return makes; // Return earlier in test
      const chunk = makesElements.slice(i, i + chunkSize);

      const currentChunk = Math.floor(i / chunkSize) + 1;
      makesToSaveInDatabase = [];

      const chunkPromises = chunk.map(async (makeInfo) => {
        const makeData: MakesData = await this.filterMakeData(makeInfo.elements);
        const makeId = parseInt(makeData.makeId);
        
        if(savedMakesIds.includes(makeId)) {
          const makeDataInDatabase = allMakesInDatabase.find((make) => make.makeId === makeId);
          
          const vehicleTypes = makeDataInDatabase?.vehicleTypes.map((makesVehicle) => ({
            typeId: `${makesVehicle.typeId}`,
            typeName: makesVehicle.typeName,
          })) || [];

          if(makeDataInDatabase) makes.push({
            makeId:`${makeId}`,
            makeName:makeDataInDatabase.makeName,
            vehicleTypes: vehicleTypes || []
          });
        }

        else {
          await this.limiter.schedule(() => this.addVehicleInfo(makeData));
          makesToSaveInDatabase.push(makeData);
          makes.push(makeData);
        }

        status.completed += 1;
        console.log(`
          Chunk: ${currentChunk}/${Math.floor(makesElements.length / chunkSize)} 
          Tasks completed: ${status.completed}/${makesElements.length}`
        );
      });

      await Promise.all(chunkPromises);
      await this.saveNewData(makesToSaveInDatabase);

      const progress = ((status.completed / makesElements.length) * 100).toFixed(2);
      
      console.log(`
        ==========================================
          Chunk #${currentChunk} 
          Completed - Progress ${progress}%! 
        ==========================================
        `);
    }

    return makes;
  }


  private async filterMakeData(elements:MakeElement[]) {
    const data:any = {};

    for(const element of elements) {
      const key = element.name.toLowerCase() === "make_id" ? "makeId" : "makeName";
      data[key] = element.elements[0].text;
    }

    return data;
  }


  private async getRawJson(url:string) {
    const xml = await axios.get(url, {
      headers:{ Accept: "application/xml" }
    });

    const rawJson = convertXmlToJson(xml.data).elements;
    let results:any;
    
    for(const element of rawJson) {
      if(element.name.toLowerCase() === "response") {
        results = this.removeCountAndStatusMessage(element);
        break;
      }
    }

    return results;
  }


  private removeCountAndStatusMessage(rawMakersJson:MakesRawJson):MakesJson[] {
    const makesFiltered = rawMakersJson.elements.filter((element) => element.name === "Results");
    const resultIndex = 0;

    const makes = makesFiltered[resultIndex];
    return makes.elements;
  }


  private async addVehicleInfo(makeData:MakesData) { 
    try {
      const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${makeData.makeId}?format=xml`;
      const vehiclesRawJson:VehiclesRawJson[] = await this.getRawJson(url);

      const prettyVehiclesJson = this.prettyfyVehicles(vehiclesRawJson);
      if(prettyVehiclesJson) makeData.vehicleTypes = prettyVehiclesJson;

      return makeData;
    }
    catch {
      return;
    }
  }


  private prettyfyVehicles(vehicleRawJson:VehiclesRawJson[]) {
    const vehicles:any[] = [];

    for(const vehicle of vehicleRawJson) {
      const data = this.getVehicleData(vehicle);
      vehicles.push(data);
    }

    return vehicles;
  }


  private getVehicleData(vehicle:any) {
    const data:any = {};

    for(const element of vehicle.elements) {
      const key = element.name === "VehicleTypeName" ? "typeName" : "typeId";
      data[key] = element.elements[0].text;
    }

    return data;
  }


  private async saveNewData(newData:MakesData[]) {
    if(newData.length === 0) return;

    let allVehicle = await this.vehicleTypesRepository.find({ select:[ "typeId" ] });
    await this.bulkSaveVehicle(newData, allVehicle);

    allVehicle = await this.vehicleTypesRepository.find();
    await this.bulkSaveMakesInDatabase(newData, allVehicle);
  }


  private async bulkSaveMakesInDatabase(
    newData: MakesData[], 
    allVehicle: VehicleTypes[]
  ) {

    const makesToSave = newData.map((data) => {
      const make = new Makes();
      make.makeId = parseInt(data.makeId);

      make.makeName = data.makeName;
      
      if(data.vehicleTypes) {
        const vehicleTypeIds = data.vehicleTypes.map((vehicleType) => parseInt(vehicleType.typeId));
        
        const vehicleTypes = allVehicle.filter((type) => {
          return vehicleTypeIds.includes(type.typeId);
        });
        if(vehicleTypes) make.vehicleTypes = vehicleTypes;
      }
      
      return make;
    });
  
    return await this.makeRepository.save(makesToSave);
  }


  private async bulkSaveVehicle(newData:MakesData[], allVehicle:VehicleTypes[]) {
    const vehicleTypesData = this.getUniqueVehiclesTypeData(newData);
    
    const ids = allVehicle.map((vehicle) => vehicle.typeId);
    const newVehiclesTypeData = vehicleTypesData.filter((vehicleType) => !ids.includes(vehicleType.typeId));
    
    if (newVehiclesTypeData.length > 0) await this.vehicleTypesRepository.save(newVehiclesTypeData);
  }


  private getUniqueVehiclesTypeData(newData:MakesData[]) {
    const vehiclesTypeData = [];
    const typeIdsSet = new Set<number>();

    for (const data of newData) {
      if (data.vehicleTypes) {
        for (const vehicle of data.vehicleTypes) {
          const typeId = typeof vehicle.typeId === "string" ? parseInt(vehicle.typeId) : vehicle.typeId;
      
          if (!typeIdsSet.has(typeId)) {
            typeIdsSet.add(typeId);
            vehiclesTypeData.push({
              typeId: typeId,
              typeName: vehicle.typeName,
            });
          }
        }
      }
    }

    return vehiclesTypeData;
  }
}