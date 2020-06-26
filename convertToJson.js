const yamlString = fs.readFileSync('./swagger_docker.yaml').toString('UTF8');
const swaggerConfig = yaml.parse(yamlString)
const jsonfile = require("jsonfile");

jsonfile.writeFileSync("swagger_docker.json", swaggerConfig, {
    spaces: 2
});