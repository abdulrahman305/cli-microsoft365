import { PlannerPlan, PlannerPlanDetails } from '@microsoft/microsoft-graph-types';
import { Logger } from '../../../../cli/Logger.js';
import GlobalOptions from '../../../../GlobalOptions.js';
import request, { CliRequestOptions } from '../../../../request.js';
import { entraGroup } from '../../../../utils/entraGroup.js';
import { planner } from '../../../../utils/planner.js';
import { validation } from '../../../../utils/validation.js';
import GraphCommand from '../../../base/GraphCommand.js';
import commands from '../../commands.js';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  id?: string;
  title?: string;
  rosterId?: string;
  ownerGroupId?: string;
  ownerGroupName?: string;
}

class PlannerPlanGetCommand extends GraphCommand {
  public get name(): string {
    return commands.PLAN_GET;
  }

  public get description(): string {
    return 'Get a Microsoft Planner plan';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
    this.#initOptionSets();
    this.#initTypes();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        id: typeof args.options.id !== 'undefined',
        title: typeof args.options.title !== 'undefined',
        rosterId: typeof args.options.rosterId !== 'undefined',
        ownerGroupId: typeof args.options.ownerGroupId !== 'undefined',
        ownerGroupName: typeof args.options.ownerGroupName !== 'undefined'
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-i, --id [id]'
      },
      {
        option: '-t, --title [title]'
      },
      {
        option: '--rosterId [rosterId]'
      },
      {
        option: '--ownerGroupId [ownerGroupId]'
      },
      {
        option: '--ownerGroupName [ownerGroupName]'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (args.options.ownerGroupId && !validation.isValidGuid(args.options.ownerGroupId as string)) {
          return `${args.options.ownerGroupId} is not a valid GUID`;
        }

        return true;
      }
    );
  }

  #initOptionSets(): void {
    this.optionSets.push(
      {
        options: ['id', 'title', 'rosterId']
      },
      {
        options: ['ownerGroupId', 'ownerGroupName'],
        runsWhen: (args) => {
          return args.options.title !== undefined;
        }
      }
    );
  }

  #initTypes(): void {
    this.types.string.push('id', 'title', 'ownerGroupId', 'ownerGroupName', 'rosterId');
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      let plan: PlannerPlan;
      if (args.options.id) {
        plan = await planner.getPlanById(args.options.id);
      }
      else if (args.options.rosterId) {
        plan = await planner.getPlanByRosterId(args.options.rosterId);
      }
      else {
        const groupId = await this.getGroupId(args);
        plan = await planner.getPlanByTitle(args.options.title!, groupId);
      }

      const result = await this.getPlanDetails(plan);
      await logger.log(result);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }

  private async getPlanDetails(plan: PlannerPlan): Promise<PlannerPlan & PlannerPlanDetails> {
    const requestOptionsTaskDetails: CliRequestOptions = {
      url: `${this.resource}/v1.0/planner/plans/${plan.id}/details`,
      headers: {
        accept: 'application/json;odata.metadata=none',
        Prefer: 'return=representation'
      },
      responseType: 'json'
    };

    const planDetails = await request.get(requestOptionsTaskDetails);
    return { ...plan, ...planDetails as PlannerPlanDetails };
  }

  private async getGroupId(args: CommandArgs): Promise<string> {
    if (args.options.ownerGroupId) {
      return args.options.ownerGroupId;
    }

    return entraGroup.getGroupIdByDisplayName(args.options.ownerGroupName!);
  }
}

export default new PlannerPlanGetCommand();