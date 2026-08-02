import * as azdev from "azure-devops-node-api";
import axios from "axios";

async function main(): Promise<void> {
  if (process.env.RUN_LIVE_INTEGRATION !== "1") {
    process.stdout.write(
      "Live integration tests skipped. Set RUN_LIVE_INTEGRATION=1 and the documented environment variables to run them.\n"
    );
    return;
  }

  const organizationUrl = required("ADO_ORGANIZATION_URL");
  const project = required("ADO_PROJECT");
  const token = required("ADO_ACCESS_TOKEN");
  const connection = new azdev.WebApi(
    organizationUrl,
    azdev.getBearerHandler(token)
  );
  const buildApi = await connection.getBuildApi();
  const definitions = await buildApi.getDefinitions(project);
  if (definitions.length === 0) {
    throw new Error("ADO smoke test found no build definitions.");
  }

  const webhook = process.env.TEAMS_WORKFLOW_WEBHOOK;
  if (webhook) {
    await axios.post(
      webhook,
      {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            contentUrl: null,
            content: {
              type: "AdaptiveCard",
              $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
              version: "1.2",
              body: [
                {
                  type: "TextBlock",
                  text: "Build Compare live integration smoke test",
                  wrap: true,
                },
              ],
            },
          },
        ],
      },
      { timeout: 30000 }
    );
  }

  process.stdout.write(
    `Live integration checks passed (${definitions.length} ADO definitions found).\n`
  );
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

void main();
