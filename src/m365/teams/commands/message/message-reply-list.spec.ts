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
import command from './message-reply-list.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.MESSAGE_REPLY_LIST, () => {
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
      request.get,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.MESSAGE_REPLY_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['id', 'body']);
  });

  it('fails validation if teamId, channelId and messageId are not specified', async () => {
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

  it('fails validation if channelId and messageId are not specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        teamId: "02bd9fd6-8f93-4758-87c3-1fb73740a315"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the teamId is not a valid guid', async () => {
    const actual = await command.validate({
      options: {
        teamId: "5f5d7b71-1161-44",
        channelId: "19:d0bba23c2fc8413991125a43a54cc30e@thread.skype",
        messageId: "1501527481624"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('validates for a correct input', async () => {
    const actual = await command.validate({
      options: {
        teamId: "02bd9fd6-8f93-4758-87c3-1fb73740a315",
        channelId: "19:d0bba23c2fc8413991125a43a54cc30e@thread.skype",
        messageId: "1501527481624"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation for a incorrect channelId missing leading 19:.', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '552b7125655c46d5b5b86db02ee7bfdf@thread.skype',
        messageId: "1501527481624"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation for a incorrect channelId missing trailing @thread.skype.', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:552b7125655c46d5b5b86db02ee7bfdf@thread',
        messageId: "1501527481624"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('retrieves the replies to the specified message (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/02bd9fd6-8f93-4758-87c3-1fb73740a315/channels/19:d0bba23c2fc8413991125a43a54cc30e@thread.skype/messages/1501527481624/replies`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#teams('02bd9fd6-8f93-4758-87c3-1fb73740a315')/channels('19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype')/messages('1501527481624')/replies",
          "@odata.count": 2,
          value: [
            {
              "id": "1501527483334",
              "replyToId": "1501527481624",
              "etag": "1501527483334",
              "messageType": "message",
              "createdDateTime": "2017-07-31T18:58:03.334Z",
              "lastModifiedDateTime": null,
              "deletedDateTime": null,
              "subject": "",
              "summary": null,
              "importance": "normal",
              "locale": "en-us",
              "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527483334?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527483334&parentMessageId=1501527481624",
              "policyViolation": null,
              "from": {
                "application": null,
                "device": null,
                "conversation": null,
                "user": {
                  "id": "2ed03dfd-01d8-4005-a9ef-fa8ee546dc6c",
                  "displayName": "Lidia Holloway",
                  "userIdentityType": "aadUser"
                }
              },
              "body": {
                "contentType": "html",
                "content": "<div>Hey team, I'm Lidia! I've been here about six months so far and I really like it! We've got a great team and although there's always so much to do, I enjoy how well we work together.</div>"
              },
              "attachments": [],
              "mentions": [],
              "reactions": []
            },
            {
              "id": "1501527482612",
              "replyToId": "1501527481624",
              "etag": "1501527482612",
              "messageType": "message",
              "createdDateTime": "2017-07-31T18:58:02.612Z",
              "lastModifiedDateTime": null,
              "deletedDateTime": null,
              "subject": "",
              "summary": null,
              "importance": "normal",
              "locale": "en-us",
              "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527482612?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527482612&parentMessageId=1501527481624",
              "policyViolation": null,
              "from": {
                "application": null,
                "device": null,
                "conversation": null,
                "user": {
                  "id": "8b209ac8-08ff-4ef1-896d-3b9fde0bbf04",
                  "displayName": "Joni Sherman",
                  "userIdentityType": "aadUser"
                }
              },
              "body": {
                "contentType": "html",
                "content": "<div>Hi everyone, I'm Joni and I've been with our group for about 6 years. Feel free to ping me with any questions you may have!</div>"
              },
              "attachments": [],
              "mentions": [],
              "reactions": []
            }
          ]
        };
      }

      throw 'Invalid Request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        teamId: "02bd9fd6-8f93-4758-87c3-1fb73740a315",
        channelId: "19:d0bba23c2fc8413991125a43a54cc30e@thread.skype",
        messageId: "1501527481624"
      }
    });
    assert(loggerLogSpy.calledWith([{
      "id": "1501527483334",
      "replyToId": "1501527481624",
      "etag": "1501527483334",
      "messageType": "message",
      "createdDateTime": "2017-07-31T18:58:03.334Z",
      "lastModifiedDateTime": null,
      "deletedDateTime": null,
      "subject": "",
      "summary": null,
      "importance": "normal",
      "locale": "en-us",
      "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527483334?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527483334&parentMessageId=1501527481624",
      "policyViolation": null,
      "from": {
        "application": null,
        "device": null,
        "conversation": null,
        "user": {
          "id": "2ed03dfd-01d8-4005-a9ef-fa8ee546dc6c",
          "displayName": "Lidia Holloway",
          "userIdentityType": "aadUser"
        }
      },
      "body": "<div>Hey team, I'm Lidia! I've been here about six months so far and I really like it! We've got a great team and although there's always so much to do, I enjoy how well we work together.</div>",
      "attachments": [],
      "mentions": [],
      "reactions": []
    },
    {
      "id": "1501527482612",
      "replyToId": "1501527481624",
      "etag": "1501527482612",
      "messageType": "message",
      "createdDateTime": "2017-07-31T18:58:02.612Z",
      "lastModifiedDateTime": null,
      "deletedDateTime": null,
      "subject": "",
      "summary": null,
      "importance": "normal",
      "locale": "en-us",
      "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527482612?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527482612&parentMessageId=1501527481624",
      "policyViolation": null,
      "from": {
        "application": null,
        "device": null,
        "conversation": null,
        "user": {
          "id": "8b209ac8-08ff-4ef1-896d-3b9fde0bbf04",
          "displayName": "Joni Sherman",
          "userIdentityType": "aadUser"
        }
      },
      "body": "<div>Hi everyone, I'm Joni and I've been with our group for about 6 years. Feel free to ping me with any questions you may have!</div>",
      "attachments": [],
      "mentions": [],
      "reactions": []
    }]));
  });

  it('retrieves the replies to the specified message', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/02bd9fd6-8f93-4758-87c3-1fb73740a315/channels/19:d0bba23c2fc8413991125a43a54cc30e@thread.skype/messages/1501527481624/replies`) {
        return {
          value: [
            {
              "id": "1501527483334",
              "replyToId": "1501527481624",
              "etag": "1501527483334",
              "messageType": "message",
              "createdDateTime": "2017-07-31T18:58:03.334Z",
              "lastModifiedDateTime": null,
              "deletedDateTime": null,
              "subject": "",
              "summary": null,
              "importance": "normal",
              "locale": "en-us",
              "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527483334?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527483334&parentMessageId=1501527481624",
              "policyViolation": null,
              "from": {
                "application": null,
                "device": null,
                "conversation": null,
                "user": {
                  "id": "2ed03dfd-01d8-4005-a9ef-fa8ee546dc6c",
                  "displayName": "Lidia Holloway",
                  "userIdentityType": "aadUser"
                }
              },
              "body": {
                "contentType": "html",
                "content": "<div>Hey team, I'm Lidia! I've been here about six months so far and I really like it! We've got a great team and although there's always so much to do, I enjoy how well we work together.</div>"
              },
              "attachments": [],
              "mentions": [],
              "reactions": []
            },
            {
              "id": "1501527482612",
              "replyToId": "1501527481624",
              "etag": "1501527482612",
              "messageType": "message",
              "createdDateTime": "2017-07-31T18:58:02.612Z",
              "lastModifiedDateTime": null,
              "deletedDateTime": null,
              "subject": "",
              "summary": null,
              "importance": "normal",
              "locale": "en-us",
              "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527482612?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527482612&parentMessageId=1501527481624",
              "policyViolation": null,
              "from": {
                "application": null,
                "device": null,
                "conversation": null,
                "user": {
                  "id": "8b209ac8-08ff-4ef1-896d-3b9fde0bbf04",
                  "displayName": "Joni Sherman",
                  "userIdentityType": "aadUser"
                }
              },
              "body": {
                "contentType": "html",
                "content": "<div>Hi everyone, I'm Joni and I've been with our group for about 6 years. Feel free to ping me with any questions you may have!</div>"
              },
              "attachments": [],
              "mentions": [],
              "reactions": []
            }
          ]
        };
      }

      throw 'Invalid Request';
    });

    await command.action(logger, {
      options: {
        teamId: "02bd9fd6-8f93-4758-87c3-1fb73740a315",
        channelId: "19:d0bba23c2fc8413991125a43a54cc30e@thread.skype",
        messageId: "1501527481624"
      }
    });
    assert(loggerLogSpy.calledWith([{
      "id": "1501527483334",
      "replyToId": "1501527481624",
      "etag": "1501527483334",
      "messageType": "message",
      "createdDateTime": "2017-07-31T18:58:03.334Z",
      "lastModifiedDateTime": null,
      "deletedDateTime": null,
      "subject": "",
      "summary": null,
      "importance": "normal",
      "locale": "en-us",
      "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527483334?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527483334&parentMessageId=1501527481624",
      "policyViolation": null,
      "from": {
        "application": null,
        "device": null,
        "conversation": null,
        "user": {
          "id": "2ed03dfd-01d8-4005-a9ef-fa8ee546dc6c",
          "displayName": "Lidia Holloway",
          "userIdentityType": "aadUser"
        }
      },
      "body": "<div>Hey team, I'm Lidia! I've been here about six months so far and I really like it! We've got a great team and although there's always so much to do, I enjoy how well we work together.</div>",
      "attachments": [],
      "mentions": [],
      "reactions": []
    },
    {
      "id": "1501527482612",
      "replyToId": "1501527481624",
      "etag": "1501527482612",
      "messageType": "message",
      "createdDateTime": "2017-07-31T18:58:02.612Z",
      "lastModifiedDateTime": null,
      "deletedDateTime": null,
      "subject": "",
      "summary": null,
      "importance": "normal",
      "locale": "en-us",
      "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527482612?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527482612&parentMessageId=1501527481624",
      "policyViolation": null,
      "from": {
        "application": null,
        "device": null,
        "conversation": null,
        "user": {
          "id": "8b209ac8-08ff-4ef1-896d-3b9fde0bbf04",
          "displayName": "Joni Sherman",
          "userIdentityType": "aadUser"
        }
      },
      "body": "<div>Hi everyone, I'm Joni and I've been with our group for about 6 years. Feel free to ping me with any questions you may have!</div>",
      "attachments": [],
      "mentions": [],
      "reactions": []
    }]));
  });

  it('outputs all data in json output mode', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/teams/02bd9fd6-8f93-4758-87c3-1fb73740a315/channels/19:d0bba23c2fc8413991125a43a54cc30e@thread.skype/messages/1501527481624/replies`) {
        return {
          value: [
            {
              "id": "1501527483334",
              "replyToId": "1501527481624",
              "etag": "1501527483334",
              "messageType": "message",
              "createdDateTime": "2017-07-31T18:58:03.334Z",
              "lastModifiedDateTime": null,
              "deletedDateTime": null,
              "subject": "",
              "summary": null,
              "importance": "normal",
              "locale": "en-us",
              "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527483334?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527483334&parentMessageId=1501527481624",
              "policyViolation": null,
              "from": {
                "application": null,
                "device": null,
                "conversation": null,
                "user": {
                  "id": "2ed03dfd-01d8-4005-a9ef-fa8ee546dc6c",
                  "displayName": "Lidia Holloway",
                  "userIdentityType": "aadUser"
                }
              },
              "body": {
                "contentType": "html",
                "content": "<div>Hey team, I'm Lidia! I've been here about six months so far and I really like it! We've got a great team and although there's always so much to do, I enjoy how well we work together.</div>"
              },
              "attachments": [],
              "mentions": [],
              "reactions": []
            },
            {
              "id": "1501527482612",
              "replyToId": "1501527481624",
              "etag": "1501527482612",
              "messageType": "message",
              "createdDateTime": "2017-07-31T18:58:02.612Z",
              "lastModifiedDateTime": null,
              "deletedDateTime": null,
              "subject": "",
              "summary": null,
              "importance": "normal",
              "locale": "en-us",
              "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527482612?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527482612&parentMessageId=1501527481624",
              "policyViolation": null,
              "from": {
                "application": null,
                "device": null,
                "conversation": null,
                "user": {
                  "id": "8b209ac8-08ff-4ef1-896d-3b9fde0bbf04",
                  "displayName": "Joni Sherman",
                  "userIdentityType": "aadUser"
                }
              },
              "body": {
                "contentType": "html",
                "content": "<div>Hi everyone, I'm Joni and I've been with our group for about 6 years. Feel free to ping me with any questions you may have!</div>"
              },
              "attachments": [],
              "mentions": [],
              "reactions": []
            }
          ]
        };
      }

      throw 'Invalid Request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        teamId: "02bd9fd6-8f93-4758-87c3-1fb73740a315",
        channelId: "19:d0bba23c2fc8413991125a43a54cc30e@thread.skype",
        messageId: "1501527481624"
      }
    });
    assert(loggerLogSpy.calledWith([
      {
        "id": "1501527483334",
        "replyToId": "1501527481624",
        "etag": "1501527483334",
        "messageType": "message",
        "createdDateTime": "2017-07-31T18:58:03.334Z",
        "lastModifiedDateTime": null,
        "deletedDateTime": null,
        "subject": "",
        "summary": null,
        "importance": "normal",
        "locale": "en-us",
        "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527483334?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527483334&parentMessageId=1501527481624",
        "policyViolation": null,
        "from": {
          "application": null,
          "device": null,
          "conversation": null,
          "user": {
            "id": "2ed03dfd-01d8-4005-a9ef-fa8ee546dc6c",
            "displayName": "Lidia Holloway",
            "userIdentityType": "aadUser"
          }
        },
        "body": {
          "contentType": "html",
          "content": "<div>Hey team, I'm Lidia! I've been here about six months so far and I really like it! We've got a great team and although there's always so much to do, I enjoy how well we work together.</div>"
        },
        "attachments": [],
        "mentions": [],
        "reactions": []
      },
      {
        "id": "1501527482612",
        "replyToId": "1501527481624",
        "etag": "1501527482612",
        "messageType": "message",
        "createdDateTime": "2017-07-31T18:58:02.612Z",
        "lastModifiedDateTime": null,
        "deletedDateTime": null,
        "subject": "",
        "summary": null,
        "importance": "normal",
        "locale": "en-us",
        "webUrl": "https://teams.microsoft.com/l/message/19%3Ad0bba23c2fc8413991125a43a54cc30e%40thread.skype/1501527482612?groupId=02bd9fd6-8f93-4758-87c3-1fb73740a315&tenantId=dcd219dd-bc68-4b9b-bf0b-4a33a796be35&createdTime=1501527482612&parentMessageId=1501527481624",
        "policyViolation": null,
        "from": {
          "application": null,
          "device": null,
          "conversation": null,
          "user": {
            "id": "8b209ac8-08ff-4ef1-896d-3b9fde0bbf04",
            "displayName": "Joni Sherman",
            "userIdentityType": "aadUser"
          }
        },
        "body": {
          "contentType": "html",
          "content": "<div>Hi everyone, I'm Joni and I've been with our group for about 6 years. Feel free to ping me with any questions you may have!</div>"
        },
        "attachments": [],
        "mentions": [],
        "reactions": []
      }
    ]));
  });

  it('correctly handles error when retrieving replies', async () => {
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

    sinon.stub(request, 'get').rejects(error);

    await assert.rejects(command.action(logger, {
      options: {
        teamId: "02bd9fd6-8f93-4758-87c3-1fb73740a315",
        channelId: "19:d0bba23c2fc8413991125a43a54cc30e@thread.skype",
        messageId: "1501527481624"
      }
    } as any), new CommandError('An error has occurred'));
  });
});
