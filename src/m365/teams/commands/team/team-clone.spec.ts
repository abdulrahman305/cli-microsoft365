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
import command from './team-clone.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.TEAM_CLONE, () => {
  let log: string[];
  let logger: Logger;
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
    (command as any).items = [];
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
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.TEAM_CLONE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the id is not a valid GUID.', async () => {
    const actual = await command.validate({
      options: {
        id: 'invalid',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation on invalid visibility', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members",
        visibility: 'abc'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation on valid \'private\' visibility', async () => {
    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members",
        visibility: 'private'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation on valid \'public\' visibility', async () => {
    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members",
        visibility: 'public'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when the input is correct with mandatory parameters', async () => {
    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when the input is correct with mandatory and optional parameters', async () => {
    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members",
        description: "Self help community for library",
        visibility: "public",
        classification: "public"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if visibility is set to private', async () => {
    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members",
        visibility: "abc"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if partsToClone is set to invalid value', async () => {
    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "abc"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if visibility is set to private', async () => {
    const actual = await command.validate({
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'My new cloned team',
        partsToClone: "apps,tabs,settings,channels,members",
        visibility: "private"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('creates a clone of a Microsoft Teams team with mandatory parameters', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/15d7a78e-fd77-4599-97a5-dbb6372846c5/clone`) {
        return {
          "location": "/teams('f9526e6a-1d0d-4421-8882-88a70975a00c')/operations('6cf64f96-08c3-4173-9919-eaf7684aae9a')"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: "Library Assist",
        partsToClone: "apps,tabs,settings,channels,members"
      }
    } as any);
  });

  it('creates a clone of a Microsoft Teams team with optional parameters (debug)', async () => {
    const sinonStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/15d7a78e-fd77-4599-97a5-dbb6372846c5/clone`) {
        return {
          "location": "/teams('f9526e6a-1d0d-4421-8882-88a70975a00c')/operations('6cf64f96-08c3-4173-9919-eaf7684aae9a')"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'Library Assist',
        partsToClone: 'apps,tabs,settings,channels,members',
        description: 'abc',
        visibility: 'public',
        classification: 'label'
      }
    } as any);
    assert.strictEqual(sinonStub.lastCall.args[0].url, 'https://graph.microsoft.com/v1.0/teams/15d7a78e-fd77-4599-97a5-dbb6372846c5/clone');
    assert.strictEqual(sinonStub.lastCall.args[0].data.displayName, 'Library Assist');
    assert.strictEqual(sinonStub.lastCall.args[0].data.partsToClone, 'apps,tabs,settings,channels,members');
    assert.strictEqual(sinonStub.lastCall.args[0].data.description, 'abc');
    assert.strictEqual(sinonStub.lastCall.args[0].data.visibility, 'public');
    assert.strictEqual(sinonStub.lastCall.args[0].data.classification, 'label');
    assert.notStrictEqual(sinonStub.lastCall.args[0].data.mailNickname.length, 0);
  });

  it('correctly handles random API error', async () => {
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
    sinon.stub(request, 'post').rejects(error);

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        id: '15d7a78e-fd77-4599-97a5-dbb6372846c5',
        name: 'Library Assist',
        partsToClone: 'apps,tabs,settings,channels,members',
        description: 'abc',
        visibility: 'public',
        classification: 'label'
      }
    } as any), new CommandError('An error has occurred'));
  });
});
