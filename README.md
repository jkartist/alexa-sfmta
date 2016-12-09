# alexa-sfmta

An Amazon Alexa skill that allows you to ask Alexa for SFMTA predictions.

**Example:**

You: *"Alexa, ask Muni when is the 22 coming?"*

Alexa: *"Inbound 22 arriving at Fillmore and Haight in 4, 24, and 45 minutes."*

# About
This skill is composed with TypeScript + Node.js and uses the 511.org API to obtain realtime SFMTA prediction data. The skill takes a configurable amount of SFMTA stops, stored in an environment variable, and returns predictions for all lines that service the stop(s) when queried by a user. The user can optionally request just a specific line, as seen in the above example. An Amazon developer account and 511.org developer token are required.

# Building and Deploying an Alexa Skill
This skill was developed for deployment as an Alexa Skill + AWS Lambda function. Taking that approach
is the shortest path to having this skill on your own Alexa device. If you haven't developed a skill before, check out the [Amazon Alexa Quickstart Guide](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/alexa-skill-tutorial) It teaches you how to set up an example project (alexa-skills-color-expert), but you can use it as a template and substitute in the code and interaction model from this project.

# Interaction Model
You need to first build the interaction model by retrieving the necessary data from the 511.org API in order to build local .ts and .txt files. The latency of some of the API methods, such as `stops`, can be quite high.
```
npm run build-model
```
You'll now find everything you need in the `interaction-model` subdirectory to set up your Alexa Skill through the Amazon Developer portal.

# AWS Lambda Function
Before setting up the Alexa Skill, you should create the Lambda function.
```
npm run build
```
You can now upload the function package, `alexa-sfmta-llambda.zip`, via the web-based Amazon Console for your Lambda function.

Alternatively, if you are have the AWS CLI installed and the appropriate environment variables set (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_LAMBDA_FUNCTION_NAME`) you can quickly deploy via the command:
```
npm run deploy
```
Now you need to set a few environment variables:
## ORG_511_API_KEY
This should be your 511.org developer token. Get one [here.](https://511.org/developers/list/tokens/create)
## STOP_IDS
This is a pipe delimited list of stops. Stop IDs can be found in the `stops.ts` file.
Example: `14953|14951`
## LINE_IDS
This is a pipe delimited list of lines that you are interested in. If you select lines that don't services the stops specified in `STOP_IDS`, you won't get any predictions.
Example: `7|7R`

# Alexa Skill
Once the Lambda function is set up, you can set up the Alexa Skill. When you get to the Interaction Model page:
1. Copy the schema from `/interaction-model/schema.txt`
2. Copy the Sample Utterances from `/interaction-model/utterances.txt`
3. Create a Custom Slot, named `LINEIDS`, and copy the values from `/interaction-model/line-ids.txt`

Once you have uploaded the Interaction Model, head to the Configuration page, select "AWS Lambda ARN" as the Service Endpoint Type, and paste your Lambda ARN into the text field. You should now be able to use the service to get realtime MUNI predictions.
