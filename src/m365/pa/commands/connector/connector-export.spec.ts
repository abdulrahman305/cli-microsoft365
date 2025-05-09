import assert from 'assert';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import flowCommands from '../../../flow/commands.js';
import commands from '../../commands.js';
import command from './connector-export.js';
import { accessToken } from '../../../../utils/accessToken.js';

describe(commands.CONNECTOR_EXPORT, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogToStderrSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;
  let writeFileSyncStub: sinon.SinonStub;
  let mkdirSyncStub: sinon.SinonStub;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    mkdirSyncStub = sinon.stub(fs, 'mkdirSync').returns('');
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync').returns();
    sinon.stub(accessToken, 'assertDelegatedAccessToken').returns();
    auth.connection.active = true;
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogToStderrSpy = sinon.spy(logger, 'logToStderr');
  });

  afterEach(() => {
    mkdirSyncStub.reset();
    writeFileSyncStub.reset();
    sinonUtil.restore([
      request.get,
      fs.existsSync
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CONNECTOR_EXPORT);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines alias', () => {
    const alias = command.alias();
    assert.notStrictEqual(typeof alias, 'undefined');
  });

  it('defines correct alias', () => {
    const alias = command.alias();
    assert.strictEqual((alias && alias.indexOf(flowCommands.CONNECTOR_EXPORT) > -1), true);
  });

  it('exports the custom connectors', async () => {
    let retrievedConnectorInfo = false;
    let retrievedSwagger = false;
    let retrievedIcon = false;

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa?api-version=2016-11-01&$filter=environment%20eq%20%27Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b%27%20and%20IsCustomApi%20eq%20%27True%27`) > -1) {
        retrievedConnectorInfo = true;
        return { "name": "shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "id": "/providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "type": "Microsoft.PowerApps/apis", "properties": { "displayName": "Connector 1", "iconUri": "https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png", "iconBrandColor": "#007ee5", "contact": {}, "license": {}, "apiEnvironment": "Shared", "isCustomApi": true, "connectionParameters": {}, "swagger": { "swagger": "2.0", "info": { "title": "Connector 1", "description": "", "version": "1.0" }, "host": "europe-002.azure-apim.net", "basePath": "/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "schemes": ["https"], "consumes": [], "produces": [], "paths": {}, "definitions": {}, "parameters": {}, "responses": {}, "securityDefinitions": {}, "security": [], "tags": [] }, "wadlUrl": "https://pafeblobprodam.blob.core.windows.net:443/apiwadls-6ee8be5d-ee5e-4dfa-b66a-81ef7afbaa1d/shared:2Dconnector:2D201:2D5f20a1f2d8d6777a75:%7C25F161FAF2ED7B7D?sv=2018-03-28&sr=c&sig=PPMiVV%2F%2FmsQ9uE5GI%2B2QSYix1ZVpaXT07MJVVDYIH2Y%3D&se=2020-01-15T21%3A43%3A38Z&sp=rl", "runtimeUrls": ["https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa"], "primaryRuntimeUrl": "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "metadata": { "source": "powerapps-user-defined", "brandColor": "#007ee5", "contact": {}, "license": {}, "publisherUrl": null, "serviceUrl": null, "documentationUrl": null, "environmentName": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "xrmConnectorId": null, "almMode": "Environment", "createdBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}", "modifiedBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}", "allowSharing": false }, "capabilities": [], "description": "", "apiDefinitions": { "originalSwaggerUrl": "https://paeu2weu8.blob.core.windows.net/api-swagger-files/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa.json_original?sv=2018-03-28&sr=b&sig=I5b3U5OxbeVYEfjosIU43HJbLqRB7mvZnE1E%2B1Hfeoc%3D&se=2020-01-15T10%3A43%3A38Z&sp=r", "modifiedSwaggerUrl": "https://paeu2weu8.blob.core.windows.net/api-swagger-files/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa.json?sv=2018-03-28&sr=b&sig=KcB2aqBgcFF1VXnauF9%2B7KOXj8kPQIIayWLa0CtTQ8U%3D&se=2020-01-15T10%3A43%3A38Z&sp=r" }, "createdBy": { "id": "9b974388-773f-4966-b27f-2e91c5916b18", "displayName": "MOD Administrator", "email": "admin@contoso.OnMicrosoft.com", "type": "User", "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "userPrincipalName": "admin@contoso.onmicrosoft.com" }, "modifiedBy": { "id": "9b974388-773f-4966-b27f-2e91c5916b18", "displayName": "MOD Administrator", "email": "admin@contoso.OnMicrosoft.com", "type": "User", "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "userPrincipalName": "admin@contoso.onmicrosoft.com" }, "createdTime": "2019-12-18T18:51:32.3316756Z", "changedTime": "2019-12-18T18:51:32.3316756Z", "environment": { "id": "/providers/Microsoft.PowerApps/environments/Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "name": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b" }, "tier": "Standard", "publisher": "MOD Administrator", "almMode": "Environment" } };
      }
      else if (opts.url === 'https://paeu2weu8.blob.core.windows.net/api-swagger-files/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa.json_original?sv=2018-03-28&sr=b&sig=I5b3U5OxbeVYEfjosIU43HJbLqRB7mvZnE1E%2B1Hfeoc%3D&se=2020-01-15T10%3A43%3A38Z&sp=r') {
        if (opts.headers &&
          opts.headers['x-anonymous'] === 'true') {
          retrievedSwagger = true;
          return "{\r\n  \"swagger\": \"2.0\",\r\n  \"info\": {\r\n    \"title\": \"Connector 1\",\r\n    \"description\": \"\",\r\n    \"version\": \"1.0\"\r\n  },\r\n  \"host\": \"api.contoso.com\",\r\n  \"basePath\": \"/\",\r\n  \"schemes\": [\r\n    \"https\"\r\n  ],\r\n  \"consumes\": [],\r\n  \"produces\": [],\r\n  \"paths\": {},\r\n  \"definitions\": {},\r\n  \"parameters\": {},\r\n  \"responses\": {},\r\n  \"securityDefinitions\": {},\r\n  \"security\": [],\r\n  \"tags\": []\r\n}";
        }
        else {
          throw 'Invalid request';
        }
      }
      else if (opts.url === 'https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png') {
        if (opts.headers &&
          opts.headers['x-anonymous'] === 'true') {
          retrievedIcon = true;
          return '123';
        }
        else {
          throw 'Invalid request';
        }
      }

      throw 'Invalid request';
    });
    sinon.stub(fs, 'existsSync').returns(false);

    await command.action(logger, { options: { environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } });
    assert(retrievedConnectorInfo, 'Did not retrieve connector info');
    assert(retrievedSwagger, 'Did not retrieve swagger');
    assert(retrievedIcon, 'Did not retrieve icon');
    const outputFolder = path.resolve('shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa');
    assert(mkdirSyncStub.calledWith(outputFolder), 'Did not create folder in the right location');
    const settings = {
      apiDefinition: "apiDefinition.swagger.json",
      apiProperties: "apiProperties.json",
      connectorId: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa',
      environment: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b',
      icon: "icon.png",
      powerAppsApiVersion: "2016-11-01",
      powerAppsUrl: "https://api.powerapps.com"
    };
    assert(writeFileSyncStub.calledWithExactly(path.join(outputFolder, 'settings.json'), JSON.stringify(settings, null, 2), 'utf8'), 'Did not create correct settings.json file');
    const apiProperties = {
      properties: {
        "iconBrandColor": "#007ee5",
        "connectionParameters": {},
        "capabilities": []
      }
    };
    assert(writeFileSyncStub.calledWithExactly(path.join(outputFolder, 'apiProperties.json'), JSON.stringify(apiProperties, null, 2), 'utf8'), 'Did not create correct apiProperties.json file');
    const swagger = "{\r\n  \"swagger\": \"2.0\",\r\n  \"info\": {\r\n    \"title\": \"Connector 1\",\r\n    \"description\": \"\",\r\n    \"version\": \"1.0\"\r\n  },\r\n  \"host\": \"api.contoso.com\",\r\n  \"basePath\": \"/\",\r\n  \"schemes\": [\r\n    \"https\"\r\n  ],\r\n  \"consumes\": [],\r\n  \"produces\": [],\r\n  \"paths\": {},\r\n  \"definitions\": {},\r\n  \"parameters\": {},\r\n  \"responses\": {},\r\n  \"securityDefinitions\": {},\r\n  \"security\": [],\r\n  \"tags\": []\r\n}";
    assert(writeFileSyncStub.calledWithExactly(path.join(outputFolder, 'apiDefinition.swagger.json'), swagger, 'utf8'), 'Did not create correct apiDefinition.swagger.json file');
    assert(writeFileSyncStub.calledWith(path.join(outputFolder, 'icon.png')));
  });

  it('exports the custom connectors (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa?api-version=2016-11-01&$filter=environment%20eq%20%27Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b%27%20and%20IsCustomApi%20eq%20%27True%27`) > -1) {
        return { "name": "shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "id": "/providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "type": "Microsoft.PowerApps/apis", "properties": { "displayName": "Connector 1", "iconUri": "https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png", "iconBrandColor": "#007ee5", "contact": {}, "license": {}, "apiEnvironment": "Shared", "isCustomApi": true, "connectionParameters": {}, "swagger": { "swagger": "2.0", "info": { "title": "Connector 1", "description": "", "version": "1.0" }, "host": "europe-002.azure-apim.net", "basePath": "/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "schemes": ["https"], "consumes": [], "produces": [], "paths": {}, "definitions": {}, "parameters": {}, "responses": {}, "securityDefinitions": {}, "security": [], "tags": [] }, "wadlUrl": "https://pafeblobprodam.blob.core.windows.net:443/apiwadls-6ee8be5d-ee5e-4dfa-b66a-81ef7afbaa1d/shared:2Dconnector:2D201:2D5f20a1f2d8d6777a75:%7C25F161FAF2ED7B7D?sv=2018-03-28&sr=c&sig=PPMiVV%2F%2FmsQ9uE5GI%2B2QSYix1ZVpaXT07MJVVDYIH2Y%3D&se=2020-01-15T21%3A43%3A38Z&sp=rl", "runtimeUrls": ["https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa"], "primaryRuntimeUrl": "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa", "metadata": { "source": "powerapps-user-defined", "brandColor": "#007ee5", "contact": {}, "license": {}, "publisherUrl": null, "serviceUrl": null, "documentationUrl": null, "environmentName": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "xrmConnectorId": null, "almMode": "Environment", "createdBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}", "modifiedBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}", "allowSharing": false }, "capabilities": [], "description": "", "apiDefinitions": { "originalSwaggerUrl": "https://paeu2weu8.blob.core.windows.net/api-swagger-files/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa.json_original?sv=2018-03-28&sr=b&sig=I5b3U5OxbeVYEfjosIU43HJbLqRB7mvZnE1E%2B1Hfeoc%3D&se=2020-01-15T10%3A43%3A38Z&sp=r", "modifiedSwaggerUrl": "https://paeu2weu8.blob.core.windows.net/api-swagger-files/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa.json?sv=2018-03-28&sr=b&sig=KcB2aqBgcFF1VXnauF9%2B7KOXj8kPQIIayWLa0CtTQ8U%3D&se=2020-01-15T10%3A43%3A38Z&sp=r" }, "createdBy": { "id": "9b974388-773f-4966-b27f-2e91c5916b18", "displayName": "MOD Administrator", "email": "admin@contoso.OnMicrosoft.com", "type": "User", "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "userPrincipalName": "admin@contoso.onmicrosoft.com" }, "modifiedBy": { "id": "9b974388-773f-4966-b27f-2e91c5916b18", "displayName": "MOD Administrator", "email": "admin@contoso.OnMicrosoft.com", "type": "User", "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "userPrincipalName": "admin@contoso.onmicrosoft.com" }, "createdTime": "2019-12-18T18:51:32.3316756Z", "changedTime": "2019-12-18T18:51:32.3316756Z", "environment": { "id": "/providers/Microsoft.PowerApps/environments/Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b", "name": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b" }, "tier": "Standard", "publisher": "MOD Administrator", "almMode": "Environment" } };
      }
      else if (opts.url === 'https://paeu2weu8.blob.core.windows.net/api-swagger-files/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa.json_original?sv=2018-03-28&sr=b&sig=I5b3U5OxbeVYEfjosIU43HJbLqRB7mvZnE1E%2B1Hfeoc%3D&se=2020-01-15T10%3A43%3A38Z&sp=r') {
        if (opts.headers &&
          opts.headers['x-anonymous'] === 'true') {
          return "{\r\n  \"swagger\": \"2.0\",\r\n  \"info\": {\r\n    \"title\": \"Connector 1\",\r\n    \"description\": \"\",\r\n    \"version\": \"1.0\"\r\n  },\r\n  \"host\": \"api.contoso.com\",\r\n  \"basePath\": \"/\",\r\n  \"schemes\": [\r\n    \"https\"\r\n  ],\r\n  \"consumes\": [],\r\n  \"produces\": [],\r\n  \"paths\": {},\r\n  \"definitions\": {},\r\n  \"parameters\": {},\r\n  \"responses\": {},\r\n  \"securityDefinitions\": {},\r\n  \"security\": [],\r\n  \"tags\": []\r\n}";
        }
        else {
          throw 'Invalid request';
        }
      }
      else if (opts.url === 'https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png') {
        if (opts.headers &&
          opts.headers['x-anonymous'] === 'true') {
          return '123';
        }
        else {
          throw 'Invalid request';
        }
      }

      throw 'Invalid request';
    });
    sinon.stub(fs, 'existsSync').returns(false);

    await command.action(logger, { options: { debug: true, environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } });
    assert(loggerLogToStderrSpy.calledWithExactly('Downloaded swagger'));
  });

  it('correctly handles error when connector information misses properties', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa?api-version=2016-11-01&$filter=environment%20eq%20%27Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b%27%20and%20IsCustomApi%20eq%20%27True%27`) > -1) {
        return {
          "name": "shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "id": "/providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "type": "Microsoft.PowerApps/apis"
        };
      }

      throw 'Invalid request';
    });
    sinon.stub(fs, 'existsSync').returns(false);
    await assert.rejects(command.action(logger, { options: { environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } } as any),
      new CommandError('Properties not present in the api registration information.'));
  });

  it('skips downloading swagger if the connector information does not contain a swagger reference', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa?api-version=2016-11-01&$filter=environment%20eq%20%27Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b%27%20and%20IsCustomApi%20eq%20%27True%27`) > -1) {
        return {
          "name": "shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "id": "/providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "type": "Microsoft.PowerApps/apis",
          "properties": {
            "displayName": "Connector 1",
            "iconUri": "https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png",
            "iconBrandColor": "#007ee5",
            "contact": {},
            "license": {},
            "apiEnvironment": "Shared",
            "isCustomApi": true,
            "connectionParameters": {},
            "swagger": {
              "swagger": "2.0",
              "info": {
                "title": "Connector 1",
                "description": "",
                "version": "1.0"
              },
              "host": "europe-002.azure-apim.net",
              "basePath": "/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
              "schemes": [
                "https"
              ],
              "consumes": [],
              "produces": [],
              "paths": {},
              "definitions": {},
              "parameters": {},
              "responses": {},
              "securityDefinitions": {},
              "security": [],
              "tags": []
            },
            "wadlUrl": "https://pafeblobprodam.blob.core.windows.net:443/apiwadls-6ee8be5d-ee5e-4dfa-b66a-81ef7afbaa1d/shared:2Dconnector:2D201:2D5f20a1f2d8d6777a75:%7C25F161FAF2ED7B7D?sv=2018-03-28&sr=c&sig=PPMiVV%2F%2FmsQ9uE5GI%2B2QSYix1ZVpaXT07MJVVDYIH2Y%3D&se=2020-01-15T21%3A43%3A38Z&sp=rl",
            "runtimeUrls": [
              "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa"
            ],
            "primaryRuntimeUrl": "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
            "metadata": {
              "source": "powerapps-user-defined",
              "brandColor": "#007ee5",
              "contact": {},
              "license": {},
              "publisherUrl": null,
              "serviceUrl": null,
              "documentationUrl": null,
              "environmentName": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "xrmConnectorId": null,
              "almMode": "Environment",
              "createdBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "modifiedBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "allowSharing": false
            },
            "capabilities": [],
            "description": "",
            "createdBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "modifiedBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "createdTime": "2019-12-18T18:51:32.3316756Z",
            "changedTime": "2019-12-18T18:51:32.3316756Z",
            "environment": {
              "id": "/providers/Microsoft.PowerApps/environments/Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "name": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b"
            },
            "tier": "Standard",
            "publisher": "MOD Administrator",
            "almMode": "Environment"
          }
        };
      }
      else if (opts.url === 'https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png') {
        if (opts.headers &&
          opts.headers['x-anonymous'] === 'true') {
          return '123';
        }
        else {
          throw 'Invalid request';
        }
      }

      throw 'Invalid request';
    });
    sinon.stub(fs, 'existsSync').returns(false);
    await command.action(logger, { options: { environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } } as any);
  });

  it('skips downloading swagger if the connector information does not contain a swagger reference (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa?api-version=2016-11-01&$filter=environment%20eq%20%27Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b%27%20and%20IsCustomApi%20eq%20%27True%27`) > -1) {
        return {
          "name": "shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "id": "/providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "type": "Microsoft.PowerApps/apis",
          "properties": {
            "displayName": "Connector 1",
            "iconUri": "https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png",
            "iconBrandColor": "#007ee5",
            "contact": {},
            "license": {},
            "apiEnvironment": "Shared",
            "isCustomApi": true,
            "connectionParameters": {},
            "swagger": {
              "swagger": "2.0",
              "info": {
                "title": "Connector 1",
                "description": "",
                "version": "1.0"
              },
              "host": "europe-002.azure-apim.net",
              "basePath": "/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
              "schemes": [
                "https"
              ],
              "consumes": [],
              "produces": [],
              "paths": {},
              "definitions": {},
              "parameters": {},
              "responses": {},
              "securityDefinitions": {},
              "security": [],
              "tags": []
            },
            "wadlUrl": "https://pafeblobprodam.blob.core.windows.net:443/apiwadls-6ee8be5d-ee5e-4dfa-b66a-81ef7afbaa1d/shared:2Dconnector:2D201:2D5f20a1f2d8d6777a75:%7C25F161FAF2ED7B7D?sv=2018-03-28&sr=c&sig=PPMiVV%2F%2FmsQ9uE5GI%2B2QSYix1ZVpaXT07MJVVDYIH2Y%3D&se=2020-01-15T21%3A43%3A38Z&sp=rl",
            "runtimeUrls": [
              "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa"
            ],
            "primaryRuntimeUrl": "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
            "metadata": {
              "source": "powerapps-user-defined",
              "brandColor": "#007ee5",
              "contact": {},
              "license": {},
              "publisherUrl": null,
              "serviceUrl": null,
              "documentationUrl": null,
              "environmentName": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "xrmConnectorId": null,
              "almMode": "Environment",
              "createdBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "modifiedBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "allowSharing": false
            },
            "capabilities": [],
            "description": "",
            "createdBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "modifiedBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "createdTime": "2019-12-18T18:51:32.3316756Z",
            "changedTime": "2019-12-18T18:51:32.3316756Z",
            "environment": {
              "id": "/providers/Microsoft.PowerApps/environments/Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "name": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b"
            },
            "tier": "Standard",
            "publisher": "MOD Administrator",
            "almMode": "Environment"
          }
        };
      }
      else if (opts.url === 'https://az787822.vo.msecnd.net/defaulticons/api-dedicated.png') {
        if (opts.headers &&
          opts.headers['x-anonymous'] === 'true') {
          return '123';
        }
        else {
          throw 'Invalid request';
        }
      }

      throw 'Invalid request';
    });
    sinon.stub(fs, 'existsSync').returns(false);

    await command.action(logger, { options: { debug: true, environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } } as any);
    assert(loggerLogToStderrSpy.calledWith('originalSwaggerUrl not set. Skipping'));
  });

  it('skips downloading icon if the connector information does not contain icon URL', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa?api-version=2016-11-01&$filter=environment%20eq%20%27Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b%27%20and%20IsCustomApi%20eq%20%27True%27`) > -1) {
        return {
          "name": "shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "id": "/providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "type": "Microsoft.PowerApps/apis",
          "properties": {
            "displayName": "Connector 1",
            "iconBrandColor": "#007ee5",
            "contact": {},
            "license": {},
            "apiEnvironment": "Shared",
            "isCustomApi": true,
            "connectionParameters": {},
            "swagger": {
              "swagger": "2.0",
              "info": {
                "title": "Connector 1",
                "description": "",
                "version": "1.0"
              },
              "host": "europe-002.azure-apim.net",
              "basePath": "/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
              "schemes": [
                "https"
              ],
              "consumes": [],
              "produces": [],
              "paths": {},
              "definitions": {},
              "parameters": {},
              "responses": {},
              "securityDefinitions": {},
              "security": [],
              "tags": []
            },
            "wadlUrl": "https://pafeblobprodam.blob.core.windows.net:443/apiwadls-6ee8be5d-ee5e-4dfa-b66a-81ef7afbaa1d/shared:2Dconnector:2D201:2D5f20a1f2d8d6777a75:%7C25F161FAF2ED7B7D?sv=2018-03-28&sr=c&sig=PPMiVV%2F%2FmsQ9uE5GI%2B2QSYix1ZVpaXT07MJVVDYIH2Y%3D&se=2020-01-15T21%3A43%3A38Z&sp=rl",
            "runtimeUrls": [
              "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa"
            ],
            "primaryRuntimeUrl": "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
            "metadata": {
              "source": "powerapps-user-defined",
              "brandColor": "#007ee5",
              "contact": {},
              "license": {},
              "publisherUrl": null,
              "serviceUrl": null,
              "documentationUrl": null,
              "environmentName": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "xrmConnectorId": null,
              "almMode": "Environment",
              "createdBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "modifiedBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "allowSharing": false
            },
            "capabilities": [],
            "description": "",
            "createdBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "modifiedBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "createdTime": "2019-12-18T18:51:32.3316756Z",
            "changedTime": "2019-12-18T18:51:32.3316756Z",
            "environment": {
              "id": "/providers/Microsoft.PowerApps/environments/Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "name": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b"
            },
            "tier": "Standard",
            "publisher": "MOD Administrator",
            "almMode": "Environment"
          }
        };
      }

      throw 'Invalid request';
    });
    sinon.stub(fs, 'existsSync').returns(false);
    await command.action(logger, { options: { environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } } as any);
  });

  it('skips downloading icon if the connector information does not contain icon URL (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa?api-version=2016-11-01&$filter=environment%20eq%20%27Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b%27%20and%20IsCustomApi%20eq%20%27True%27`) > -1) {
        return {
          "name": "shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "id": "/providers/Microsoft.PowerApps/apis/shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
          "type": "Microsoft.PowerApps/apis",
          "properties": {
            "displayName": "Connector 1",
            "iconBrandColor": "#007ee5",
            "contact": {},
            "license": {},
            "apiEnvironment": "Shared",
            "isCustomApi": true,
            "connectionParameters": {},
            "swagger": {
              "swagger": "2.0",
              "info": {
                "title": "Connector 1",
                "description": "",
                "version": "1.0"
              },
              "host": "europe-002.azure-apim.net",
              "basePath": "/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
              "schemes": [
                "https"
              ],
              "consumes": [],
              "produces": [],
              "paths": {},
              "definitions": {},
              "parameters": {},
              "responses": {},
              "securityDefinitions": {},
              "security": [],
              "tags": []
            },
            "wadlUrl": "https://pafeblobprodam.blob.core.windows.net:443/apiwadls-6ee8be5d-ee5e-4dfa-b66a-81ef7afbaa1d/shared:2Dconnector:2D201:2D5f20a1f2d8d6777a75:%7C25F161FAF2ED7B7D?sv=2018-03-28&sr=c&sig=PPMiVV%2F%2FmsQ9uE5GI%2B2QSYix1ZVpaXT07MJVVDYIH2Y%3D&se=2020-01-15T21%3A43%3A38Z&sp=rl",
            "runtimeUrls": [
              "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa"
            ],
            "primaryRuntimeUrl": "https://europe-002.azure-apim.net/apim/connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa",
            "metadata": {
              "source": "powerapps-user-defined",
              "brandColor": "#007ee5",
              "contact": {},
              "license": {},
              "publisherUrl": null,
              "serviceUrl": null,
              "documentationUrl": null,
              "environmentName": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "xrmConnectorId": null,
              "almMode": "Environment",
              "createdBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "modifiedBy": "{\"id\":\"9b974388-773f-4966-b27f-2e91c5916b18\",\"displayName\":\"MOD Administrator\",\"email\":\"admin@contoso.OnMicrosoft.com\",\"type\":\"User\",\"tenantId\":\"5be1aa17-e6cd-4d3d-8355-01af3e607d4b\",\"userPrincipalName\":\"admin@contoso.onmicrosoft.com\"}",
              "allowSharing": false
            },
            "capabilities": [],
            "description": "",
            "createdBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "modifiedBy": {
              "id": "9b974388-773f-4966-b27f-2e91c5916b18",
              "displayName": "MOD Administrator",
              "email": "admin@contoso.OnMicrosoft.com",
              "type": "User",
              "tenantId": "5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "userPrincipalName": "admin@contoso.onmicrosoft.com"
            },
            "createdTime": "2019-12-18T18:51:32.3316756Z",
            "changedTime": "2019-12-18T18:51:32.3316756Z",
            "environment": {
              "id": "/providers/Microsoft.PowerApps/environments/Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b",
              "name": "Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b"
            },
            "tier": "Standard",
            "publisher": "MOD Administrator",
            "almMode": "Environment"
          }
        };
      }

      throw 'Invalid request';
    });
    sinon.stub(fs, 'existsSync').returns(false);

    await command.action(logger, { options: { debug: true, environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } } as any);
    assert(loggerLogToStderrSpy.calledWith('iconUri not set. Skipping'));
  });

  it('correctly handles environment not found', async () => {
    sinon.stub(request, 'get').rejects({
      "error": {
        "code": "EnvironmentAccessDenied",
        "message": "The environment 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b' could not be found in the tenant '0d645e38-ec52-4a4f-ac58-65f2ac4015f6'."
      }
    });

    await assert.rejects(command.action(logger, { options: { environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } } as any),
      new CommandError(`The environment 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b' could not be found in the tenant '0d645e38-ec52-4a4f-ac58-65f2ac4015f6'.`));
  });

  it('correctly handles connector not found', async () => {
    sinon.stub(request, 'get').rejects({
      "error": {
        "code": "ApiResourceNotFound",
        "message": "Could not find API 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfb'."
      }
    });

    await assert.rejects(command.action(logger, { options: { environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfb' } } as any),
      new CommandError(`Could not find API 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfb'.`));
  });

  it('correctly handles OData API error', async () => {
    sinon.stub(request, 'get').rejects({
      error: {
        'odata.error': {
          code: '-1, InvalidOperationException',
          message: {
            value: 'An error has occurred'
          }
        }
      }
    });

    await assert.rejects(command.action(logger, { options: { environmentName: 'Default-5be1aa17-e6cd-4d3d-8355-01af3e607d4b', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } } as any),
      new CommandError('An error has occurred'));
  });

  it('fails validation when the specified output folder does not exist', async () => {
    sinon.stub(fs, 'existsSync').callsFake(() => false);
    const actual = await command.validate({ options: { environmentName: 'Default-d87a7535-dd31-4437-bfe1-95340acd55c5', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa', outputFolder: '123' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when the specified connector folder already exists', async () => {
    sinon.stub(fs, 'existsSync').callsFake(() => true);
    const actual = await command.validate({ options: { environmentName: 'Default-d87a7535-dd31-4437-bfe1-95340acd55c5', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when all required options specified', async () => {
    const actual = await command.validate({ options: { environmentName: 'Default-d87a7535-dd31-4437-bfe1-95340acd55c5', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when the specified output folder exists', async () => {
    sinon.stub(fs, 'existsSync').callsFake((folder) => folder.toString().indexOf('connector') < 0);
    const actual = await command.validate({ options: { environmentName: 'Default-d87a7535-dd31-4437-bfe1-95340acd55c5', name: 'shared_connector-201-5f20a1f2d8d6777a75-5fa602f410652f4dfa', outputFolder: '123' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('supports specifying environment name', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--environment') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});
