#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";
import { HelloLambdaStack } from "../lib/lambda/hello-lambda-stack";

const app = new cdk.App();
new DeployWebAppStack(app, "DeployWebAppStack", {});
new HelloLambdaStack(app, "HelloLambdaStack", {});
