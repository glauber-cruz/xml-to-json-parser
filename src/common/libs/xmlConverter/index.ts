import * as converter from "xml-js";

export function convertXmlToJson(xml:string) {
  const options = { ignoreComment: true, alwaysChildren: true };
  const result = converter.xml2js(xml, options);
  return result;
}