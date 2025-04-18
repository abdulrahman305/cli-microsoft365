import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { CommandError } from '../../../../Command.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { accessToken } from '../../../../utils/accessToken.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './sensitivitylabel-get.js';

describe(commands.SENSITIVITYLABEL_GET, () => {
  const sensitivityLabelId = '6f4fb2db-ecf4-4279-94ba-23d059bf157e';
  const userId = '59f80e08-24b1-41f8-8586-16765fd830d3';
  const userName = 'john.doe@contoso.com';
  const sensitivityLabelGetResponse = {
    "id": sensitivityLabelId,
    "name": "Unrestricted",
    "description": "",
    "color": "",
    "sensitivity": 0,
    "tooltip": "Information either intended for general distribution, or which would not have any impact on the organization if it were to be distributed.",
    "isActive": true,
    "isAppliable": true,
    "contentFormats": [
      "file",
      "email"
    ],
    "hasProtection": false
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
    auth.connection.active = true;
    auth.connection.accessTokens[(command as any).resource] = {
      accessToken: 'abc',
      expiresOn: new Date()
    };
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
    sinon.stub(accessToken, 'isAppOnlyAccessToken').returns(false);
  });

  afterEach(() => {
    sinonUtil.restore([
      accessToken.isAppOnlyAccessToken,
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.accessTokens = {};
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.SENSITIVITYLABEL_GET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if id is not a valid GUID', async () => {
    const actual = await command.validate({ options: { id: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if a correct id is entered', async () => {
    const actual = await command.validate({ options: { id: sensitivityLabelId } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if userId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { id: sensitivityLabelId, userId: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('validates for a correct input with a userId defined', async () => {
    const actual = await command.validate({ options: { id: sensitivityLabelId, userId: userId } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if userName is not a valid UPN', async () => {
    const actual = await command.validate({ options: { id: sensitivityLabelId, userName: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('validates for a correct input with a userName defined', async () => {
    const actual = await command.validate({ options: { id: sensitivityLabelId, userName: userName } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('retrieves sensitivity label that the current logged in user has access to', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === `https://graph.microsoft.com/beta/me/security/informationProtection/sensitivityLabels/${sensitivityLabelId}`) {
        return sensitivityLabelGetResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { id: sensitivityLabelId, verbose: true } });
    assert(loggerLogSpy.calledWith(sensitivityLabelGetResponse));
  });

  it('retrieves sensitivity label that the specific user has access to by its Id', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === `https://graph.microsoft.com/beta/users/${userId}/security/informationProtection/sensitivityLabels/${sensitivityLabelId}`) {
        return sensitivityLabelGetResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { id: sensitivityLabelId, userId: userId } });
    assert(loggerLogSpy.calledWith(sensitivityLabelGetResponse));
  });

  it('retrieves sensitivity label that the specific user has access to by its UPN', async () => {
    sinon.stub(request, 'get').callsFake(async opts => {
      if (opts.url === `https://graph.microsoft.com/beta/users/${userName}/security/informationProtection/sensitivityLabels/${sensitivityLabelId}`) {
        return sensitivityLabelGetResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { id: sensitivityLabelId, userName: userName } });
    assert(loggerLogSpy.calledWith(sensitivityLabelGetResponse));
  });

  it('throws an error when using application permissions and no option is specified', async () => {
    sinonUtil.restore(accessToken.isAppOnlyAccessToken);
    sinon.stub(accessToken, 'isAppOnlyAccessToken').returns(true);

    await assert.rejects(command.action(logger, {
      options: { id: sensitivityLabelId }
    }), new CommandError(`Specify at least 'userId' or 'userName' when using application permissions.`));
  });

  it('handles error when sensitivity label by id is not found', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/beta/me/security/informationProtection/sensitivityLabels/${sensitivityLabelId}`) {
        throw `Error: The resource could not be found.`;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { id: sensitivityLabelId } }), new CommandError(`Error: The resource could not be found.`));
  });
});