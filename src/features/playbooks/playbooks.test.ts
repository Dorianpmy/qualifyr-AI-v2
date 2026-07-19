import {describe,expect,it} from "vitest";
import {renovationDemoSchema} from "./demo";
import {canPublishPlaybooks,canValidateQualification} from "./permissions";
import {calculateQualification} from "./qualification-engine";
import {parseEditorSchema,playbookSchema} from "./schemas";

const namurValues={project_type:"Rénovation salle de bain",description:"Refaire entièrement la salle de bain",country:"BE",city:"Namur",postal_code:"5000",surface:8,building_type:"Maison",period:"Octobre",availability:"Semaine",email:"namur@example.test"};
describe("deterministic playbook engine",()=>{
  it("validates the demonstration schema",()=>expect(playbookSchema.safeParse(renovationDemoSchema).success).toBe(true));
  it("parses a configurable editor schema and rejects duplicate keys",()=>{expect(parseEditorSchema("city|Ville|city|oui|Où ?","photos|Photos|1","Visite").success).toBe(true);expect(playbookSchema.safeParse({...renovationDemoSchema,fields:[renovationDemoSchema.fields[0],renovationDemoSchema.fields[0]]}).success).toBe(false);});
  it("marks Namur incomplete while the required photo is absent",()=>{const result=calculateQualification({schema:renovationDemoSchema,values:namurValues,evidence:{photos:[]},serviceAllowed:true,coverageMatched:true,contactAvailable:true});expect(result.recommendedStatus).toBe("incomplete");expect(result.missingInformation).toContainEqual({key:"photos",label:"Photos de l’existant",type:"proof"});});
  it("recommends human review after the photo is present",()=>{const result=calculateQualification({schema:renovationDemoSchema,values:namurValues,evidence:{photos:[{name:"existing.jpg"}]},serviceAllowed:true,coverageMatched:true,contactAvailable:true});expect(result.recommendedStatus).toBe("needs_review");expect(result.humanValidationRequired).toBe(true);expect(result.nextAction).toBe("Visite technique recommandée.");});
  it("explains field and proof completeness without opaque score",()=>{const result=calculateQualification({schema:renovationDemoSchema,values:namurValues,evidence:{photos:[]},serviceAllowed:true,coverageMatched:true,contactAvailable:true});expect(result.requiredFieldsCompleted).toBe(9);expect(result.requiredFieldsTotal).toBe(9);expect(result.proofsReceived).toBe(0);expect(result.proofsExpected).toBe(1);});
  it("fails deterministic service, coverage and contact rules",()=>{const result=calculateQualification({schema:renovationDemoSchema,values:{},evidence:{},serviceAllowed:false,coverageMatched:false,contactAvailable:false});expect(result.failedRules.map(rule=>rule.rule)).toEqual(["service_allowed","coverage_area","contact_available"]);expect(result.recommendedStatus).toBe("incomplete");});
  it("reserves publication and validation to owner/admin",()=>{expect(canPublishPlaybooks("owner")).toBe(true);expect(canPublishPlaybooks("admin")).toBe(true);expect(canPublishPlaybooks("member")).toBe(false);expect(canValidateQualification("member")).toBe(false);});
});
