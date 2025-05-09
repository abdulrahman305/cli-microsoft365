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
import commands from '../../commands.js';
import command from './file-rename.js';

describe(commands.FILE_RENAME, () => {
  let log: any[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  const renameResponseJson = [
    {
      'ErrorCode': 0,
      'ErrorMessage': null,
      'FieldName': 'FileLeafRef',
      'FieldValue': 'test 2.docx',
      'HasException': false,
      'ItemId': 642
    }
  ];

  const renameValue = {
    value: renameResponseJson
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
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
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.post,
      cli.executeCommand
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.FILE_RENAME);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', sourceUrl: 'abc', targetFileName: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the webUrl option is a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', sourceUrl: 'abc', targetFileName: 'abc' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('forcefully renames file from a non-root site in the root folder of a document library when a file with the same name exists (or it doesn\'t?)', async () => {
    sinon.stub(cli, 'executeCommand').resolves();

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string) === 'https://contoso.sharepoint.com/sites/portal/_api/web/GetFileByServerRelativePath(DecodedUrl=\'%2Fsites%2Fportal%2FShared%20Documents%2Fabc.pdf\')/ListItemAllFields/ValidateUpdateListItem()') {
        return renameValue;
      }
      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string) === 'https://contoso.sharepoint.com/sites/portal/_api/web/GetFileByServerRelativePath(DecodedUrl=\'%2Fsites%2Fportal%2FShared%20Documents%2Fabc.pdf\')?$select=UniqueId') {
        return;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options:
      {
        webUrl: 'https://contoso.sharepoint.com/sites/portal',
        sourceUrl: '/Shared Documents/abc.pdf',
        force: true,
        targetFileName: 'def.pdf'
      }
    });
    assert(loggerLogSpy.calledWith(renameResponseJson));
  });

  it('renames file from a non-root site in the root folder of a document library when a file with the same name doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string) === 'https://contoso.sharepoint.com/sites/portal/_api/web/GetFileByServerRelativePath(DecodedUrl=\'%2Fsites%2Fportal%2FShared%20Documents%2Fabc.pdf\')/ListItemAllFields/ValidateUpdateListItem()') {
        return renameValue;
      }
      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string) === 'https://contoso.sharepoint.com/sites/portal/_api/web/GetFileByServerRelativePath(DecodedUrl=\'%2Fsites%2Fportal%2FShared%20Documents%2Fabc.pdf\')?$select=UniqueId') {
        return;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options:
      {
        webUrl: 'https://contoso.sharepoint.com/sites/portal',
        sourceUrl: 'Shared Documents/abc.pdf',
        targetFileName: 'def.pdf'
      }
    });
    assert(loggerLogSpy.calledWith(renameResponseJson));
  });

  it('continues if file cannot be recycled because it does not exist', async () => {
    const fileDeleteError = {
      error: {
        message: 'File does not exist'
      }
    };
    sinon.stub(cli, 'executeCommand').rejects(fileDeleteError);

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string) === 'https://contoso.sharepoint.com/sites/portal/_api/web/GetFileByServerRelativePath(DecodedUrl=\'%2Fsites%2Fportal%2FShared%20Documents%2Fabc.pdf\')/ListItemAllFields/ValidateUpdateListItem()') {
        return renameValue;
      }
      throw 'Invalid request';
    });

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string) === 'https://contoso.sharepoint.com/sites/portal/_api/web/GetFileByServerRelativePath(DecodedUrl=\'%2Fsites%2Fportal%2FShared%20Documents%2Fabc.pdf\')?$select=UniqueId') {
        return;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options:
      {
        webUrl: 'https://contoso.sharepoint.com/sites/portal',
        sourceUrl: 'Shared Documents/abc.pdf',
        force: true,
        targetFileName: 'def.pdf'
      }
    });
    assert(loggerLogSpy.calledWith(renameResponseJson));
  });

  it('throws error if file cannot be recycled', async () => {
    const fileDeleteError = {
      error: {
        message: 'Locked for use'
      },
      stderr: ''
    };

    sinon.stub(cli, 'executeCommand').rejects(fileDeleteError);

    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string) === `https://contoso.sharepoint.com/sites/portal/_api/web/GetFileByServerRelativePath(DecodedUrl='%2Fsites%2Fportal%2FShared%20Documents%2Fabc.pdf')?$select=UniqueId`) {
        return;
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options:
      {
        webUrl: 'https://contoso.sharepoint.com/sites/portal',
        sourceUrl: 'Shared Documents/abc.pdf',
        force: true,
        targetFileName: 'def.pdf'
      }
    }), new CommandError(fileDeleteError.error.message));
  });
});
