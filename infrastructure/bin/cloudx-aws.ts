#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";
import { ProductStack } from "../lib/lambda/product-stack";
import { ProductSqsStack } from "../lib/product-sqs/product-sqs-stack";
import { ProductSnsStack } from "../lib/product-sns/product-sns-stack";

const app = new cdk.App();
new DeployWebAppStack(app, "DeployWebAppStack", {});
new ProductStack(app, "ProductStack", {});
new ProductSqsStack(app, "ProductSqsStack", {});
new ProductSnsStack(app, "ProductSnsStack", {});
