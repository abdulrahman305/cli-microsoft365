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
import command from './tab-remove.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.TAB_REMOVE, () => {
  let log: string[];
  let logger: Logger;
  let promptIssued: boolean = false;
  let commandInfo: CommandInfo;

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
    sinon.stub(cli, 'promptForConfirmation').callsFake(() => {
      promptIssued = true;
      return Promise.resolve(false);
    });
    promptIssued = false;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.delete,
      cli.promptForConfirmation,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.TAB_REMOVE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('passes validation when valid channelId, teamId and id is specified', async () => {
    const actual = await command.validate({
      options: {
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if the teamId , channelId and id are not provided', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {

      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the channelId is not valid channelId', async () => {
    const actual = await command.validate({
      options: {
        teamId: 'd66b8110-fcad-49e8-8159-0d488ddb7656',
        channelId: 'invalid',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the teamId is not a valid guid', async () => {
    const actual = await command.validate({
      options: {
        teamId: 'invalid',
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });
  it('fails validation if the id is not a valid guid', async () => {
    const actual = await command.validate({
      options: {
        teamId: 'd66b8110-fcad-49e8-8159-0d488ddb7656',
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        id: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });


  it('prompts before removing the specified tab when force option not passed', async () => {
    await command.action(logger, {
      options: {
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    });

    assert(promptIssued);
  });

  it('prompts before removing the specified tab when force option not passed (debug)', async () => {
    await command.action(logger, {
      options: {
        debug: true,
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    });

    assert(promptIssued);
  });

  it('aborts removing the specified tab when force option not passed and prompt not confirmed', async () => {
    const postSpy = sinon.spy(request, 'delete');
    await command.action(logger, {
      options: {
        debug: true,
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    });
    assert(postSpy.notCalled);
  });

  it('aborts removing the specified tab when force option not passed and prompt not confirmed (debug)', async () => {
    const postSpy = sinon.spy(request, 'delete');
    await command.action(logger, {
      options: {
        debug: true,
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    });
    assert(postSpy.notCalled);
  });

  it('removes the specified tab by id when prompt confirmed (debug)', async () => {
    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`tabs/d66b8110-fcad-49e8-8159-0d488ddb7656`) > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        debug: true,
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656'
      }
    });
  });


  it('removes the specified tab without prompting when confirmed specified (debug)', async () => {
    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`tabs/d66b8110-fcad-49e8-8159-0d488ddb7656`) > -1) {
        return;
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        id: 'd66b8110-fcad-49e8-8159-0d488ddb7656',
        force: true
      }
    });
  });

  it('handles error correctly', async () => {
    const error = {
      "error": {
        "code": "UnknownError",
        "message": "An error has occurred",
        "innerError": {
          "date": "2022-02-14T13:27:37",
          "request-id": "77e0ed26-8b57-48d6-a502-aca6211d6e7c",
          "client-request-id": "77e0ed26-8b57-48d6-a502-aca6211d6e7c"
        }
      }
    };

    sinon.stub(request, 'delete').rejects(error);

    await assert.rejects(command.action(logger, {
      options: {
        channelId: '19:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        teamId: '00000000-0000-0000-0000-000000000000',
        tabId: 'd66b8110-fcad-49e8-8159-0d488ddb7656',
        force: true
      }
    } as any), new CommandError('An error has occurred'));
  });
});
