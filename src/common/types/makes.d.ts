interface XmlToJsonBase {
  type:string;
  name:string
}

interface Elements<T = any> {
  type:string;
  name:string;
  elements:T[];
}

interface MakesRawJson extends XmlToJsonBase {
  attributes:object;
  elements:Elements<any>[];
};

interface MakesJson extends XmlToJsonBase {
  elements:MakeElement[];
}

interface MakeElement {
  type:string;
  name:string;
  elements:{
    text:string;
  }[];
}

interface MakesData {
  makeId:string;
  makeName:string;
  vehicleTypes?:VehicleTypeData[];
}

interface VehiclesRawJson {
  elements: {
    name:string;
    elements:{
      text:string;
    }[];
  }[]
}

interface VehicleTypeData {
  typeId:string;
  typeName:string;
}