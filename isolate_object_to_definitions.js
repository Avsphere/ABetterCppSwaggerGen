const yaml = require('yamljs');
const fs = require('fs')
const { compose, props, map, flatten } = require('ramda')
const yamlString = fs.readFileSync('./swagger_docker.yaml').toString('UTF8');
const swaggerConfig = yaml.parse(yamlString)
const jsonfile = require('jsonfile')

const withoutDuplicates = arr => Array.from(new Set(arr))
const getObjValue = obj => obj[Object.keys(obj)[0]]

const getObjectProperty = obj => prop => obj[prop];  
const extractPathObj = pathUri => getObjectProperty(swaggerConfig)('paths')[pathUri]


const extractDefinitionsForPath = pathObj => JSON.stringify(pathObj).match(/#\/definitions\/([A-Za-z]*)/g)

const definitionReferenceKeysFromPaths = compose(withoutDuplicates, flatten, map(extractDefinitionsForPath))

const definitionObjectsFromSwaggerConfig = config => {
    const paths = config.paths;
    const pathObjs = Object.keys(paths).map(extractPathObj)
    const rawDefinitionRefs = definitionReferenceKeysFromPaths(pathObjs);
    
    const parseDefinitionRef = refString => refString.split('/').pop();
    const definitionKeys = map(parseDefinitionRef, rawDefinitionRefs)

    const definitions = definitionKeys.reduce( (acc, definitionKey) => {
        acc[definitionKey] = swaggerConfig['definitions'][definitionKey]
        return acc
    }, {})

    return definitions;
}



const amalgamateDefinitions = () => {
    const definitionsForPaths = definitionObjectsFromSwaggerConfig(swaggerConfig)
    const allPaths = swaggerConfig.paths;
    const pathObjs = Object.keys(allPaths).map(extractPathObj)

    return {
        definitions : definitionsForPaths,
        paths: pathObjs,
        ...swaggerConfig
    }

}

const isolateObjectDefinition = objectName => {
    const amalgamatedDefinitions = amalgamateDefinitions();
    return amalgamatedDefinitions.definitions[objectName];
}



const isolatePortObjectDefinition = () => {
    const isolatedPortObject = isolateObjectDefinition("Port");
    const portDefinitionYaml = yaml.stringify(isolatedPortObject, 8)

    fs.writeFileSync('./portDefinitionYaml.yaml', portDefinitionYaml)
    jsonfile.writeFileSync("portDefinitionYaml.json", isolatedPortObject, {
        spaces: 2
    });
}



isolatePortObjectDefinition()
