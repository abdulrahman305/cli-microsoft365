import assert from 'assert';
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
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';
import { SpoPropertyBagBaseCommand } from '../propertybag/propertybag-base.js';
import command from './web-reindex.js';

describe(commands.WEB_REINDEX, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;
  let loggerLogToStderrSpy: sinon.SinonSpy;

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
    loggerLogToStderrSpy = sinon.spy(logger, 'logToStderr');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.post,
      SpoPropertyBagBaseCommand.isNoScriptSite,
      SpoPropertyBagBaseCommand.setProperty
    ]);
    (command as any).reindexedLists = false;
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.WEB_REINDEX);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('requests reindexing site that is not a no-script site for the first time', async () => {
    let propertyName: string = '';
    let propertyValue: string = '';

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
        if (opts.data.indexOf(`<Query Id="1" ObjectPathId="5">`) > -1) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7331.1206",
            "ErrorInfo": null,
            "TraceCorrelationId": "38e4499e-10a2-5000-ce25-77d4ccc2bd96"
          }, 7, {
            "_ObjectType_": "SP.Web",
            "_ObjectIdentity_": "38e4499e-10a2-5000-ce25-77d4ccc2bd96|740c6a0b-85e2-48a0-a494-e0f1759d4a77:site:f3806c23-0c9f-42d3-bc7d-3895acc06d73:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d275",
            "ServerRelativeUrl": "\u002fsites\u002fteam-a"
          }]);
        }
      }

      return 'Invalid request';
    });
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/web/allproperties') > -1) {
        return {};
      }

      return 'Invalid request';
    });
    sinon.stub(SpoPropertyBagBaseCommand, 'isNoScriptSite').resolves(false);
    sinon.stub(SpoPropertyBagBaseCommand, 'setProperty').callsFake(async (_propertyName, _propertyValue) => {
      propertyName = _propertyName;
      propertyValue = _propertyValue;
      return JSON.stringify({});
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/team-a' } });
    assert(loggerLogSpy.notCalled, 'Something has been logged');
    assert.strictEqual(propertyName, 'vti_searchversion', 'Incorrect property stored in the property bag');
    assert.strictEqual(propertyValue, '1', 'Incorrect property value stored in the property bag');
  });

  it('requests reindexing site that is not a no-script site for the second time', async () => {
    let propertyName: string = '';
    let propertyValue: string = '';

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
        if (opts.data.indexOf(`<Query Id="1" ObjectPathId="5">`) > -1) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7331.1206",
            "ErrorInfo": null,
            "TraceCorrelationId": "38e4499e-10a2-5000-ce25-77d4ccc2bd96"
          }, 7, {
            "_ObjectType_": "SP.Web",
            "_ObjectIdentity_": "38e4499e-10a2-5000-ce25-77d4ccc2bd96|740c6a0b-85e2-48a0-a494-e0f1759d4a77:site:f3806c23-0c9f-42d3-bc7d-3895acc06d73:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d275",
            "ServerRelativeUrl": "\u002fsites\u002fteam-a"
          }]);
        }
      }

      return 'Invalid request';
    });
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/web/allproperties') > -1) {
        return {
          vti_x005f_searchversion: '1'
        };
      }

      return 'Invalid request';
    });
    sinon.stub(SpoPropertyBagBaseCommand, 'isNoScriptSite').resolves(false);
    sinon.stub(SpoPropertyBagBaseCommand, 'setProperty').callsFake(async (_propertyName, _propertyValue) => {
      propertyName = _propertyName;
      propertyValue = _propertyValue;
      return JSON.stringify({});
    });

    await command.action(logger, { options: { debug: true, url: 'https://contoso.sharepoint.com/sites/team-a' } });
    assert.strictEqual(propertyName, 'vti_searchversion', 'Incorrect property stored in the property bag');
    assert.strictEqual(propertyValue, '2', 'Incorrect property value stored in the property bag');
  });

  it('requests reindexing no-script site', async () => {
    const propertyName: string[] = [];
    const propertyValue: string[] = [];

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
        if (opts.data.indexOf(`<Query Id="1" ObjectPathId="5">`) > -1) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7331.1206",
            "ErrorInfo": null,
            "TraceCorrelationId": "38e4499e-10a2-5000-ce25-77d4ccc2bd96"
          }, 7, {
            "_ObjectType_": "SP.Web",
            "_ObjectIdentity_": "38e4499e-10a2-5000-ce25-77d4ccc2bd96|740c6a0b-85e2-48a0-a494-e0f1759d4a77:site:f3806c23-0c9f-42d3-bc7d-3895acc06d73:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d275",
            "ServerRelativeUrl": "\u002fsites\u002fteam-a"
          }]);
        }

        if (opts.data.indexOf(`<ObjectPath Id="10" ObjectPathId="9" />`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7331.1206", "ErrorInfo": null, "TraceCorrelationId": "93e5499e-00f1-5000-1f36-3ab12512a7e9"
            }, 18, {
              "IsNull": false
            }, 19, {
              "_ObjectIdentity_": "93e5499e-00f1-5000-1f36-3ab12512a7e9|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:f3806c23-0c9f-42d3-bc7d-3895acc06dc3:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d2c5:folder:df4291de-226f-4c39-bbcc-df21915f5fc1"
            }, 20, {
              "_ObjectType_": "SP.Folder", "_ObjectIdentity_": "93e5499e-00f1-5000-1f36-3ab12512a7e9|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:f3806c23-0c9f-42d3-bc7d-3895acc06dc3:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d2c5:folder:df4291de-226f-4c39-bbcc-df21915f5fc1", "Properties": {
                "_ObjectType_": "SP.PropertyValues", "vti_folderitemcount$  Int32": 0, "vti_level$  Int32": 1, "vti_parentid": "{1C5271C8-DB93-459E-9C18-68FC33EFD856}", "vti_winfileattribs": "00000012", "vti_candeleteversion": "true", "vti_foldersubfolderitemcount$  Int32": 0, "vti_timelastmodified": "\/Date(2017,10,7,11,29,31,0)\/", "vti_dirlateststamp": "\/Date(2018,1,12,22,34,31,0)\/", "vti_isscriptable": "false", "vti_isexecutable": "false", "vti_metainfoversion$  Int32": 1, "vti_isbrowsable": "true", "vti_timecreated": "\/Date(2017,10,7,11,29,31,0)\/", "vti_etag": "\"{DF4291DE-226F-4C39-BBCC-DF21915F5FC1},256\"", "vti_hassubdirs": "true", "vti_docstoreversion$  Int32": 256, "vti_rtag": "rt:DF4291DE-226F-4C39-BBCC-DF21915F5FC1@00000000256", "vti_docstoretype$  Int32": 1, "vti_replid": "rid:{DF4291DE-226F-4C39-BBCC-DF21915F5FC1}"
              }
            }
          ]);
        }
      }

      return 'Invalid request';
    });
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/web/lists') > -1) {
        return {
          value: [
            {
              NoCrawl: true,
              Title: 'Excluded from search'
            },
            {
              NoCrawl: false,
              Title: 'Included in search',
              RootFolder: {
                Properties: {},
                ServerRelativeUrl: '/sites/team-a/included-in-search'
              }
            },
            {
              NoCrawl: false,
              Title: 'Previously crawled',
              RootFolder: {
                Properties: {
                  vti_x005f_searchversion: 1
                },
                ServerRelativeUrl: '/sites/team-a/included-in-search'
              }
            }
          ]
        };
      }

      if ((opts.url as string).indexOf('/_api/web/allproperties') > -1) {
        return {};
      }

      return 'Invalid request';
    });
    sinon.stub(SpoPropertyBagBaseCommand, 'isNoScriptSite').resolves(true);
    sinon.stub(SpoPropertyBagBaseCommand, 'setProperty').callsFake(async (_propertyName, _propertyValue) => {
      propertyName.push(_propertyName);
      propertyValue.push(_propertyValue);
      return JSON.stringify({});
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/team-a' } });
    assert(loggerLogSpy.notCalled, 'Something has been logged');
    assert.strictEqual(propertyName[0], 'vti_searchversion');
    assert.strictEqual(propertyName[1], 'vti_searchversion');
    assert.strictEqual(propertyValue[0], '1');
    assert.strictEqual(propertyValue[1], '2');
  });

  it('requests reindexing no-script site (debug)', async () => {
    const propertyName: string[] = [];
    const propertyValue: string[] = [];

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
        if (opts.data.indexOf(`<Query Id="1" ObjectPathId="5">`) > -1) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7331.1206",
            "ErrorInfo": null,
            "TraceCorrelationId": "38e4499e-10a2-5000-ce25-77d4ccc2bd96"
          }, 7, {
            "_ObjectType_": "SP.Web",
            "_ObjectIdentity_": "38e4499e-10a2-5000-ce25-77d4ccc2bd96|740c6a0b-85e2-48a0-a494-e0f1759d4a77:site:f3806c23-0c9f-42d3-bc7d-3895acc06d73:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d275",
            "ServerRelativeUrl": "\u002fsites\u002fteam-a"
          }]);
        }

        if (opts.data.indexOf(`<ObjectPath Id="10" ObjectPathId="9" />`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7331.1206", "ErrorInfo": null, "TraceCorrelationId": "93e5499e-00f1-5000-1f36-3ab12512a7e9"
            }, 18, {
              "IsNull": false
            }, 19, {
              "_ObjectIdentity_": "93e5499e-00f1-5000-1f36-3ab12512a7e9|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:f3806c23-0c9f-42d3-bc7d-3895acc06dc3:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d2c5:folder:df4291de-226f-4c39-bbcc-df21915f5fc1"
            }, 20, {
              "_ObjectType_": "SP.Folder", "_ObjectIdentity_": "93e5499e-00f1-5000-1f36-3ab12512a7e9|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:f3806c23-0c9f-42d3-bc7d-3895acc06dc3:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d2c5:folder:df4291de-226f-4c39-bbcc-df21915f5fc1", "Properties": {
                "_ObjectType_": "SP.PropertyValues", "vti_folderitemcount$  Int32": 0, "vti_level$  Int32": 1, "vti_parentid": "{1C5271C8-DB93-459E-9C18-68FC33EFD856}", "vti_winfileattribs": "00000012", "vti_candeleteversion": "true", "vti_foldersubfolderitemcount$  Int32": 0, "vti_timelastmodified": "\/Date(2017,10,7,11,29,31,0)\/", "vti_dirlateststamp": "\/Date(2018,1,12,22,34,31,0)\/", "vti_isscriptable": "false", "vti_isexecutable": "false", "vti_metainfoversion$  Int32": 1, "vti_isbrowsable": "true", "vti_timecreated": "\/Date(2017,10,7,11,29,31,0)\/", "vti_etag": "\"{DF4291DE-226F-4C39-BBCC-DF21915F5FC1},256\"", "vti_hassubdirs": "true", "vti_docstoreversion$  Int32": 256, "vti_rtag": "rt:DF4291DE-226F-4C39-BBCC-DF21915F5FC1@00000000256", "vti_docstoretype$  Int32": 1, "vti_replid": "rid:{DF4291DE-226F-4C39-BBCC-DF21915F5FC1}"
              }
            }
          ]);
        }
      }

      return 'Invalid request';
    });
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/web/lists') > -1) {
        return {
          value: [
            {
              NoCrawl: true,
              Title: 'Excluded from search'
            },
            {
              NoCrawl: false,
              Title: 'Included in search',
              RootFolder: {
                Properties: {},
                ServerRelativeUrl: '/sites/team-a/included-in-search'
              }
            },
            {
              NoCrawl: false,
              Title: 'Previously crawled',
              RootFolder: {
                Properties: {
                  vti_x005f_searchversion: 1
                },
                ServerRelativeUrl: '/sites/team-a/included-in-search'
              }
            }
          ]
        };
      }

      if ((opts.url as string).indexOf('/_api/web/allproperties') > -1) {
        return {};
      }

      return 'Invalid request';
    });
    sinon.stub(SpoPropertyBagBaseCommand, 'isNoScriptSite').resolves(true);
    sinon.stub(SpoPropertyBagBaseCommand, 'setProperty').callsFake(async (_propertyName, _propertyValue) => {
      propertyName.push(_propertyName);
      propertyValue.push(_propertyValue);
      return JSON.stringify({});
    });

    await command.action(logger, { options: { debug: true, url: 'https://contoso.sharepoint.com/sites/team-a' } });
    assert(loggerLogToStderrSpy.called, 'Nothing has been logged');
    assert.strictEqual(propertyName[0], 'vti_searchversion');
    assert.strictEqual(propertyName[1], 'vti_searchversion');
    assert.strictEqual(propertyValue[0], '1');
    assert.strictEqual(propertyValue[1], '2');
  });

  it('correctly handles error while requiring reindexing a list', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
        if (opts.data.indexOf(`<Query Id="1" ObjectPathId="5">`) > -1) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.7331.1206",
            "ErrorInfo": null,
            "TraceCorrelationId": "38e4499e-10a2-5000-ce25-77d4ccc2bd96"
          }, 7, {
            "_ObjectType_": "SP.Web",
            "_ObjectIdentity_": "38e4499e-10a2-5000-ce25-77d4ccc2bd96|740c6a0b-85e2-48a0-a494-e0f1759d4a77:site:f3806c23-0c9f-42d3-bc7d-3895acc06d73:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d275",
            "ServerRelativeUrl": "\u002fsites\u002fteam-a"
          }]);
        }

        if (opts.data.indexOf(`<ObjectPath Id="10" ObjectPathId="9" />`) > -1) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7331.1206", "ErrorInfo": null, "TraceCorrelationId": "93e5499e-00f1-5000-1f36-3ab12512a7e9"
            }, 18, {
              "IsNull": false
            }, 19, {
              "_ObjectIdentity_": "93e5499e-00f1-5000-1f36-3ab12512a7e9|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:f3806c23-0c9f-42d3-bc7d-3895acc06dc3:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d2c5:folder:df4291de-226f-4c39-bbcc-df21915f5fc1"
            }, 20, {
              "_ObjectType_": "SP.Folder", "_ObjectIdentity_": "93e5499e-00f1-5000-1f36-3ab12512a7e9|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:f3806c23-0c9f-42d3-bc7d-3895acc06dc3:web:5a39e548-b3d7-4090-9cb9-0ce7cd85d2c5:folder:df4291de-226f-4c39-bbcc-df21915f5fc1", "Properties": {
                "_ObjectType_": "SP.PropertyValues", "vti_folderitemcount$  Int32": 0, "vti_level$  Int32": 1, "vti_parentid": "{1C5271C8-DB93-459E-9C18-68FC33EFD856}", "vti_winfileattribs": "00000012", "vti_candeleteversion": "true", "vti_foldersubfolderitemcount$  Int32": 0, "vti_timelastmodified": "\/Date(2017,10,7,11,29,31,0)\/", "vti_dirlateststamp": "\/Date(2018,1,12,22,34,31,0)\/", "vti_isscriptable": "false", "vti_isexecutable": "false", "vti_metainfoversion$  Int32": 1, "vti_isbrowsable": "true", "vti_timecreated": "\/Date(2017,10,7,11,29,31,0)\/", "vti_etag": "\"{DF4291DE-226F-4C39-BBCC-DF21915F5FC1},256\"", "vti_hassubdirs": "true", "vti_docstoreversion$  Int32": 256, "vti_rtag": "rt:DF4291DE-226F-4C39-BBCC-DF21915F5FC1@00000000256", "vti_docstoretype$  Int32": 1, "vti_replid": "rid:{DF4291DE-226F-4C39-BBCC-DF21915F5FC1}"
              }
            }
          ]);
        }
      }

      return 'Invalid request';
    });
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_api/web/lists') > -1) {
        return {
          value: [
            {
              NoCrawl: true,
              Title: 'Excluded from search'
            },
            {
              NoCrawl: false,
              Title: 'Included in search',
              RootFolder: {
                Properties: {},
                ServerRelativeUrl: '/sites/team-a/included-in-search'
              }
            },
            {
              NoCrawl: false,
              Title: 'Previously crawled',
              RootFolder: {
                Properties: {
                  vti_x005f_searchversion: 1
                },
                ServerRelativeUrl: '/sites/team-a/included-in-search'
              }
            }
          ]
        };
      }

      return 'Invalid request';
    });
    sinon.stub(SpoPropertyBagBaseCommand, 'isNoScriptSite').resolves(true);
    sinon.stub(SpoPropertyBagBaseCommand, 'setProperty').rejects(new Error('ClientSvc unknown error'));

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/team-a' } } as any), new CommandError('ClientSvc unknown error'));
  });

  it('fails validation if url is not a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { url: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if url is valid', async () => {
    const actual = await command.validate({ options: { url: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
