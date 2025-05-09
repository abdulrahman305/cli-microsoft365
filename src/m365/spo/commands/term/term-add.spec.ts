import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import config from '../../../../config.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';
import command from './term-add.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.TERM_ADD, () => {
  const webUrl = 'https://contoso.sharepoint.com';
  const id = '9e54299e-208a-4000-8546-cc4139091b26';
  const name = 'IT';
  const termGroupId = '9e54299e-208a-4000-8546-cc4139091b27';
  const termGroupName = 'People';
  const termSetId = '9e54299e-208a-4000-8546-cc4139091b28';
  const parentTermId = '9e54299e-208a-4000-8546-cc4139091b29';
  const termSetName = 'Department';
  const addTermResponse = [
    {
      "SchemaVersion": "15.0.0.0",
      "LibraryVersion": "16.0.8210.1205",
      "ErrorInfo": null,
      "TraceCorrelationId": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6"
    },
    4,
    {
      "IsNull": false
    },
    5,
    {
      "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:ss:"
    },
    7,
    {
      "IsNull": false
    },
    8,
    {
      "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw=="
    },
    10,
    {
      "IsNull": false
    },
    12,
    {
      "IsNull": false
    },
    13,
    {
      "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:gr:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+8="
    },
    15,
    {
      "IsNull": false
    },
    17,
    {
      "IsNull": false
    },
    18,
    {
      "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:se:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv"
    },
    20,
    {
      "IsNull": false
    },
    21,
    {
      "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g=="
    },
    22,
    {
      "_ObjectType_": "SP.Taxonomy.Term", "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==", "CreatedDate": "/Date(1540235503669)/", "Id": "/Guid(47fdacfe-ff64-4a05-b611-e84e767f04de)/", "LastModifiedDate": "/Date(1540235503669)/", "Name": "IT", "CustomProperties": {}, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": {}, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0
    }];

  const termAddResponse = {
    "CreatedDate": "2018-10-22T19:11:43.669Z",
    "Id": "47fdacfe-ff64-4a05-b611-e84e767f04de",
    "LastModifiedDate": "2018-10-22T19:11:43.669Z",
    "Name": "IT",
    "CustomProperties": {},
    "CustomSortOrder": null,
    "IsAvailableForTagging": true,
    "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com",
    "Description": "",
    "IsDeprecated": false,
    "IsKeyword": false,
    "IsPinned": false,
    "IsPinnedRoot": false,
    "IsReused": false,
    "IsRoot": true,
    "IsSourceTerm": true,
    "LocalCustomProperties": {},
    "MergedTermIds": [],
    "PathOfTerm": "IT",
    "TermsCount": 0
  };

  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
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
    loggerLogSpy = sinon.spy(logger, 'log');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.TERM_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('adds term to the specified sitecollection with the specified name to the term set and term group specified by name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: webUrl, name: name, termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith(termAddResponse));
  });

  it('adds term with the specified name to the term set and term group specified by name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith(termAddResponse));
  });

  it('adds term with the specified name and id to the term set and term group specified by id', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetById"><Parameters><Parameter Type="Guid">{5c928151-c140-4d48-aab9-54da901c7fef}</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetById"><Parameters><Parameter Type="Guid">{8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f}</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{47fdacfe-ff64-4a05-b611-e84e767f04de}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, id: '47fdacfe-ff64-4a05-b611-e84e767f04de', termSetId: '8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f', termGroupId: '5c928151-c140-4d48-aab9-54da901c7fef' } });
    assert(loggerLogSpy.calledWith(termAddResponse));
  });

  it('adds term with the specified name and id below the specified term', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetById"><Parameters><Parameter Type="Guid">{5c928151-c140-4d48-aab9-54da901c7fef}</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="6" Name="GetTerm"><Parameters><Parameter Type="Guid">{8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f}</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{47fdacfe-ff64-4a05-b611-e84e767f04de}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, id: '47fdacfe-ff64-4a05-b611-e84e767f04de', parentTermId: '8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f', termGroupId: '5c928151-c140-4d48-aab9-54da901c7fef' } });
    assert(loggerLogSpy.calledWith(termAddResponse));
  });

  it('adds term with description', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetDescription" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">IT term</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1221", "ErrorInfo": null, "TraceCorrelationId": "8b409b9e-b003-0000-37ae-1d4bfff0edf2"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, name: name, description: 'IT term', termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith({ "CreatedDate": "2018-10-22T19:11:43.669Z", "Id": "47fdacfe-ff64-4a05-b611-e84e767f04de", "LastModifiedDate": "2018-10-22T19:11:43.669Z", "Name": "IT", "CustomProperties": {}, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "IT term", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": {}, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0 }));
  });

  it('adds term with local and custom local properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1</Parameter><Parameter Type="String">Value1</Parameter></Parameters></Method><Method Name="SetLocalCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">LocalProp1</Parameter><Parameter Type="String">LocalValue1</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1221", "ErrorInfo": null, "TraceCorrelationId": "8b409b9e-b003-0000-37ae-1d4bfff0edf2"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, customProperties: '{"Prop1": "Value1"}', localCustomProperties: '{"LocalProp1": "LocalValue1"}', termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith({ "CreatedDate": "2018-10-22T19:11:43.669Z", "Id": "47fdacfe-ff64-4a05-b611-e84e767f04de", "LastModifiedDate": "2018-10-22T19:11:43.669Z", "Name": "IT", "CustomProperties": { "Prop1": "Value1" }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": { "LocalProp1": "LocalValue1" }, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0 }));
  });

  it('correctly handles error when retrieving the term store', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8112.1217", "ErrorInfo": {
                "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: name, termSetName: termSetName, termGroupName: termGroupName } } as any), new CommandError('An error has occurred'));
  });

  it('correctly handles error when the term group specified by id doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetById"><Parameters><Parameter Type="Guid">{5c928151-c140-4d48-aab9-54da901c7fef}</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetById"><Parameters><Parameter Type="Guid">{8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f}</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{47fdacfe-ff64-4a05-b611-e84e767f04de}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "Specified argument was out of the range of valid values.\r\nParameter name: index", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "System.ArgumentOutOfRangeException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        id: '47fdacfe-ff64-4a05-b611-e84e767f04de',
        termSetId: '8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f',
        termGroupId: '5c928151-c140-4d48-aab9-54da901c7fef'
      }
    } as any), new CommandError('Specified argument was out of the range of valid values.\r\nParameter name: index'));
  });

  it('correctly handles error when the term group specified by name doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "Specified argument was out of the range of valid values.\r\nParameter name: index", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "System.ArgumentOutOfRangeException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: name, termSetName: termSetName, termGroupName: termGroupName } } as any), new CommandError('Specified argument was out of the range of valid values.\r\nParameter name: index'));

  });

  it('correctly handles error when the term set specified by name doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "Specified argument was out of the range of valid values.\r\nParameter name: index", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "System.ArgumentOutOfRangeException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        termSetName: termSetName,
        termGroupName: termGroupName
      }
    } as any), new CommandError('Specified argument was out of the range of valid values.\r\nParameter name: index'));
  });

  it('correctly handles error when the term set specified by id doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetById"><Parameters><Parameter Type="Guid">{5c928151-c140-4d48-aab9-54da901c7fef}</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetById"><Parameters><Parameter Type="Guid">{8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f}</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{47fdacfe-ff64-4a05-b611-e84e767f04de}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8105.1217", "ErrorInfo": {
                "ErrorMessage": "Specified argument was out of the range of valid values.\r\nParameter name: index", "ErrorValue": null, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78", "ErrorCode": -2146233086, "ErrorTypeName": "System.ArgumentOutOfRangeException"
              }, "TraceCorrelationId": "3105909e-e037-0000-29c7-078ce31cbc78"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        id: '47fdacfe-ff64-4a05-b611-e84e767f04de',
        termSetId: '8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f',
        termGroupId: '5c928151-c140-4d48-aab9-54da901c7fef'
      }
    } as any), new CommandError('Specified argument was out of the range of valid values.\r\nParameter name: index'));
  });

  it('correctly handles error when the specified name already exists', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1221", "ErrorInfo": { "ErrorMessage": "There is already a term with the same default label and parent term.", "ErrorValue": null, "TraceCorrelationId": "5c419b9e-5074-0000-3292-b5fe42f75fd1", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.Taxonomy.TermStoreOperationException" }, "TraceCorrelationId": "5c419b9e-5074-0000-3292-b5fe42f75fd1" }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        termSetName: termSetName,
        termGroupName: termGroupName
      }
    } as any), new CommandError('There is already a term with the same default label and parent term.'));
  });

  it('correctly handles error when the specified id already exists', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetById"><Parameters><Parameter Type="Guid">{5c928151-c140-4d48-aab9-54da901c7fef}</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetById"><Parameters><Parameter Type="Guid">{8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f}</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{47fdacfe-ff64-4a05-b611-e84e767f04de}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1221", "ErrorInfo": { "ErrorMessage": "Failed to read from or write to database. Refresh and try again. If the problem persists, please contact the administrator.", "ErrorValue": null, "TraceCorrelationId": "8f419b9e-b042-0000-37ae-164c0c311c0a", "ErrorCode": -1, "ErrorTypeName": "Microsoft.SharePoint.Taxonomy.TermStoreOperationException" }, "TraceCorrelationId": "8f419b9e-b042-0000-37ae-164c0c311c0a" }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        id: '47fdacfe-ff64-4a05-b611-e84e767f04de',
        termSetId: '8ed8c9ea-7052-4c1d-a4d7-b9c10bffea6f',
        termGroupId: '5c928151-c140-4d48-aab9-54da901c7fef'
      }
    } as any), new CommandError('Failed to read from or write to database. Refresh and try again. If the problem persists, please contact the administrator.'));
  });

  it('correctly handles error when setting the description', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetDescription" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">IT term</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8112.1217", "ErrorInfo": {
                "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        description: 'IT term',
        termSetName: termSetName,
        termGroupName: termGroupName
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('correctly handles error when setting custom properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1</Parameter><Parameter Type="String">Value1</Parameter></Parameters></Method><Method Name="SetLocalCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">LocalProp1</Parameter><Parameter Type="String">LocalValue1</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8112.1217", "ErrorInfo": {
                "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        customProperties: '{"Prop1": "Value1"}',
        localCustomProperties: '{"LocalProp1": "LocalValue1"}',
        termSetName: termSetName,
        termGroupName: termGroupName
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('correctly handles error when setting local custom properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1</Parameter><Parameter Type="String">Value1</Parameter></Parameters></Method><Method Name="SetLocalCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">LocalProp1</Parameter><Parameter Type="String">LocalValue1</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8112.1217", "ErrorInfo": {
                "ErrorMessage": "An error has occurred", "ErrorValue": null, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "304b919e-c041-0000-29c7-027259fd7cb6"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        name: name,
        customProperties: '{"Prop1": "Value1"}',
        localCustomProperties: '{"LocalProp1": "LocalValue1"}',
        termSetName: termSetName,
        termGroupName: termGroupName
      }
    } as any), new CommandError('An error has occurred'));
  });

  it('correctly escapes XML in term group name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People&gt;</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, termSetName: termSetName, termGroupName: 'People>' } });
    assert(loggerLogSpy.calledWith(termAddResponse));
  });

  it('correctly escapes XML in term set name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department&gt;</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, termSetName: 'Department>', termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith(termAddResponse));
  });

  it('correctly escapes XML in term name', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT&gt;</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1205", "ErrorInfo": null, "TraceCorrelationId": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6" }, 4, { "IsNull": false }, 5, { "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:ss:" }, 7, { "IsNull": false }, 8, { "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" }, 10, { "IsNull": false }, 12, { "IsNull": false }, 13, { "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:gr:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+8=" }, 15, { "IsNull": false }, 17, { "IsNull": false }, 18, { "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:se:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv" }, 20, { "IsNull": false }, 21, { "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" }, 22, { "_ObjectType_": "SP.Taxonomy.Term", "_ObjectIdentity_": "d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==", "CreatedDate": "/Date(1540235503669)/", "Id": "/Guid(47fdacfe-ff64-4a05-b611-e84e767f04de)/", "LastModifiedDate": "/Date(1540235503669)/", "Name": "IT>", "CustomProperties": {}, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": {}, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0 }]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: 'IT>', termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith({ "CreatedDate": "2018-10-22T19:11:43.669Z", "Id": "47fdacfe-ff64-4a05-b611-e84e767f04de", "LastModifiedDate": "2018-10-22T19:11:43.669Z", "Name": "IT>", "CustomProperties": {}, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": {}, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0 }));
  });

  it('correctly escapes XML in term description', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetDescription" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">IT term&gt;</Parameter><Parameter Type="Int32">1033</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1221", "ErrorInfo": null, "TraceCorrelationId": "8b409b9e-b003-0000-37ae-1d4bfff0edf2"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, description: 'IT term>', termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith({ "CreatedDate": "2018-10-22T19:11:43.669Z", "Id": "47fdacfe-ff64-4a05-b611-e84e767f04de", "LastModifiedDate": "2018-10-22T19:11:43.669Z", "Name": "IT", "CustomProperties": {}, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "IT term>", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": {}, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0 }));
  });

  it('correctly escapes XML in term custom properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1&gt;</Parameter><Parameter Type="String">Value1&gt;</Parameter></Parameters></Method><Method Name="SetLocalCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">LocalProp1</Parameter><Parameter Type="String">LocalValue1</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1221", "ErrorInfo": null, "TraceCorrelationId": "8b409b9e-b003-0000-37ae-1d4bfff0edf2"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, customProperties: '{"Prop1>": "Value1>"}', localCustomProperties: '{"LocalProp1": "LocalValue1"}', termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith({ "CreatedDate": "2018-10-22T19:11:43.669Z", "Id": "47fdacfe-ff64-4a05-b611-e84e767f04de", "LastModifiedDate": "2018-10-22T19:11:43.669Z", "Name": "IT", "CustomProperties": { "Prop1>": "Value1>" }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": { "LocalProp1": "LocalValue1" }, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0 }));
  });

  it('correctly escapes XML in term local custom properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectIdentityQuery Id="5" ObjectPathId="3" /><ObjectPath Id="7" ObjectPathId="6" /><ObjectIdentityQuery Id="8" ObjectPathId="6" /><ObjectPath Id="10" ObjectPathId="9" /><ObjectPath Id="12" ObjectPathId="11" /><ObjectIdentityQuery Id="13" ObjectPathId="11" /><ObjectPath Id="15" ObjectPathId="14" /><ObjectPath Id="17" ObjectPathId="16" /><ObjectIdentityQuery Id="18" ObjectPathId="16" /><ObjectPath Id="20" ObjectPathId="19" /><ObjectIdentityQuery Id="21" ObjectPathId="19" /><Query Id="22" ObjectPathId="19"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticMethod Id="3" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" /><Method Id="6" ParentId="3" Name="GetDefaultSiteCollectionTermStore" /><Property Id="9" ParentId="6" Name="Groups" /><Method Id="11" ParentId="9" Name="GetByName"><Parameters><Parameter Type="String">People</Parameter></Parameters></Method><Property Id="14" ParentId="11" Name="TermSets" /><Method Id="16" ParentId="14" Name="GetByName"><Parameters><Parameter Type="String">Department</Parameter></Parameters></Method><Method Id="19" ParentId="16" Name="CreateTerm"><Parameters><Parameter Type="String">IT</Parameter><Parameter Type="Int32">1033</Parameter><Parameter Type="Guid">{`) > -1 && opts.data.indexOf(`}</Parameter></Parameters></Method></ObjectPaths></Request>`) > -1) {
          return JSON.stringify(addTermResponse);
        }

        if (opts.data.indexOf(`<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><Method Name="SetCustomProperty" Id="127" ObjectPathId="117"><Parameters><Parameter Type="String">Prop1</Parameter><Parameter Type="String">Value1</Parameter></Parameters></Method><Method Name="SetLocalCustomProperty" Id="128" ObjectPathId="117"><Parameters><Parameter Type="String">LocalProp1&gt;</Parameter><Parameter Type="String">LocalValue1&gt;</Parameter></Parameters></Method><Method Name="CommitAll" Id="131" ObjectPathId="109" /></Actions><ObjectPaths><Identity Id="117" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:te:MvRe/3xHkEqrmEXxmJ7Lx1GBklxAwUhNqrlU2pAcf+/qydiOUnAdTKTXucEL/+pv/qz9R2T/BUq2EehOdn8E3g==" /><Identity Id="109" Name="d7f59a9e-a0f5-0000-37ae-17ef5f03c2e6|fec14c62-7c3b-481b-851b-c80d7802b224:st:MvRe/3xHkEqrmEXxmJ7Lxw==" /></ObjectPaths></Request>`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8210.1221", "ErrorInfo": null, "TraceCorrelationId": "8b409b9e-b003-0000-37ae-1d4bfff0edf2"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { name: name, customProperties: '{"Prop1": "Value1"}', localCustomProperties: '{"LocalProp1>": "LocalValue1>"}', termSetName: termSetName, termGroupName: termGroupName } });
    assert(loggerLogSpy.calledWith({ "CreatedDate": "2018-10-22T19:11:43.669Z", "Id": "47fdacfe-ff64-4a05-b611-e84e767f04de", "LastModifiedDate": "2018-10-22T19:11:43.669Z", "Name": "IT", "CustomProperties": { "Prop1": "Value1" }, "CustomSortOrder": null, "IsAvailableForTagging": true, "Owner": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "Description": "", "IsDeprecated": false, "IsKeyword": false, "IsPinned": false, "IsPinnedRoot": false, "IsReused": false, "IsRoot": true, "IsSourceTerm": true, "LocalCustomProperties": { "LocalProp1>": "LocalValue1>" }, "MergedTermIds": [], "PathOfTerm": "IT", "TermsCount": 0 }));
  });

  it('fails validation if id is not a valid GUID', async () => {
    const actual = await command.validate({ options: { termGroupName: termGroupName, name: name, id: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if neither termGroupId nor termGroupName specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { name: name } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both termGroupId and termGroupName specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { name: name, termGroupName: termGroupName, termGroupId: termGroupId } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if termGroupId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { name: name, termGroupId: 'invalid', termSetName: termSetName } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if neither termSetId nor termSetName specified', async () => {
    const actual = await command.validate({ options: { name: name, termGroupId: termGroupId } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both termSetId and termSetName specified', async () => {
    const actual = await command.validate({ options: { name: name, termGroupId: termGroupId, termSetId: termSetId, termSetName: termSetName } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both parentTermId and termSetName specified', async () => {
    const actual = await command.validate({ options: { name: name, termGroupId: termGroupId, parentTermId: parentTermId, termSetName: termSetName } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both parentTermId and termSetId specified', async () => {
    const actual = await command.validate({ options: { name: name, termGroupId: termGroupId, parentTermId: parentTermId, termSetId: '9e54299e-208a-4000-8546-cc4139091b29' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both parentTermId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { name: name, termGroupId: termGroupId, parentTermId: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if termSetId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { name: name, termGroupId: termGroupId, termSetId: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if custom properties is not a valid JSON string', async () => {
    const actual = await command.validate({ options: { name: name, termGroupName: termGroupName, termSetName: termSetName, customProperties: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if local custom properties is not a valid JSON string', async () => {
    const actual = await command.validate({ options: { name: name, termGroupName: termGroupName, termSetName: termSetName, localCustomProperties: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when webUrl is not a valid url', async () => {
    const actual = await command.validate({ options: { webUrl: 'invalid', name: name, termGroupName: termGroupName, termSetName: termSetName } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when the webUrl is a valid url', async () => {
    const actual = await command.validate({ options: { webUrl: webUrl, name: name, termGroupName: termGroupName, termSetName: termSetName } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when id, termSetId and termGroupId specified', async () => {
    const actual = await command.validate({ options: { name: name, id: id, termGroupId: termGroupId, termSetId: termSetId } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when id, termSetName and termGroupName specified', async () => {
    const actual = await command.validate({ options: { name: name, id: id, termGroupName: termGroupName, termSetName: termSetName } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when id, parentTermId and termGroupName specified', async () => {
    const actual = await command.validate({ options: { name: name, id: id, termGroupName: termGroupName, parentTermId: parentTermId } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when custom properties is a valid JSON string', async () => {
    const actual = await command.validate({ options: { name: name, termGroupName: termGroupName, termSetName: termSetName, customProperties: '{}' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when local custom properties is a valid JSON string', async () => {
    const actual = await command.validate({ options: { name: name, termGroupName: termGroupName, termSetName: termSetName, localCustomProperties: '{}' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
