import assert from 'assert';
import sinon from 'sinon';
import { telemetry } from '../../../../telemetry.js';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { powerPlatform } from '../../../../utils/powerPlatform.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './solution-remove.js';
import { accessToken } from '../../../../utils/accessToken.js';

describe(commands.SOLUTION_REMOVE, () => {
  let commandInfo: CommandInfo;
  //#region Mocked Responses
  const validEnvironment = '4be50206-9576-4237-8b17-38d8aadfaa36';
  const validId = '00000001-0000-0000-0001-00000000009b';
  const validName = 'Solution name';
  const envUrl = "https://contoso-dev.api.crm4.dynamics.com";
  const solutionResponse = {
    solutionid: validId,
    uniquename: validName,
    version: '1.0.0.0',
    installedon: '2021-10-01T21:54:14Z',
    solutionpackageversion: null,
    friendlyname: validName,
    versionnumber: 860052,
    publisherid: {
      friendlyname: 'CDS Default Publisher',
      publisherid: '00000001-0000-0000-0000-00000000005a'
    }
  };
  //#endregion

  let log: string[];
  let logger: Logger;
  let promptIssued: boolean = false;
  let loggerLogToStderrSpy: sinon.SinonSpy;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
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
    sinon.stub(cli, 'promptForConfirmation').callsFake(async () => {
      promptIssued = true;
      return false;
    });

    promptIssued = false;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.delete,
      powerPlatform.getDynamicsInstanceApiUrl,
      powerPlatform.getSolutionByName,
      cli.promptForConfirmation,
      cli.executeCommandWithOutput
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.SOLUTION_REMOVE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if id is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        environmentName: validEnvironment,
        id: 'Invalid GUID'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if required options specified (id)', async () => {
    const actual = await command.validate({ options: { environmentName: validEnvironment, id: validId } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if required options specified (name)', async () => {
    const actual = await command.validate({ options: { environmentName: validEnvironment, name: validName } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('prompts before removing the specified solution owned by the currently signed-in user when force option not passed', async () => {
    await command.action(logger, {
      options: {
        environmentName: validEnvironment,
        id: validId
      }
    });

    assert(promptIssued);
  });

  it('aborts removing the specified solution owned by the currently signed-in user when force option not passed and prompt not confirmed', async () => {
    const postSpy = sinon.spy(request, 'delete');

    await command.action(logger, {
      options: {
        environmentName: validEnvironment,
        id: validId
      }
    });
    assert(postSpy.notCalled);
  });

  it('removes the specified solution owned by the currently signed-in user when prompt confirmed', async () => {
    sinon.stub(powerPlatform, 'getDynamicsInstanceApiUrl').callsFake(async () => envUrl);
    sinon.stub(powerPlatform, 'getSolutionByName').resolves(solutionResponse);

    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if (opts.url === `https://contoso-dev.api.crm4.dynamics.com/api/data/v9.1/solutions(${validId})`) {
        return;
      }

      throw 'Invalid request';
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);
    await command.action(logger, {
      options: {
        debug: true,
        environmentName: validEnvironment,
        name: validName
      }
    });
    assert(loggerLogToStderrSpy.called);
  });

  it('removes the specified solution owned by the currently signed-in user without prompt for confirm', async () => {
    sinon.stub(powerPlatform, 'getDynamicsInstanceApiUrl').callsFake(async () => envUrl);

    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if (opts.url === `https://contoso-dev.api.crm4.dynamics.com/api/data/v9.1/solutions(${validId})`) {
        return;
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        environmentName: validEnvironment,
        id: validId,
        force: true
      }
    });
    assert(loggerLogToStderrSpy.called);
  });

  it('correctly handles API OData error', async () => {
    const errorMessage = 'Something went wrong';

    sinon.stub(powerPlatform, 'getDynamicsInstanceApiUrl').callsFake(async () => envUrl);

    sinon.stub(request, 'delete').callsFake(async () => { throw { error: { error: { message: errorMessage } } }; });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        environmentName: validEnvironment,
        id: validId,
        force: true
      }
    }), new CommandError(errorMessage));
  });
});
