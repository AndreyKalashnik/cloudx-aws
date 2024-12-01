#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";
import { ProductStack } from "../lib/product-stack";
import { ImportServiceStack } from "../lib/import-service-stack";
import { ProductSqsStack } from "../lib/product-sqs/product-sqs-stack";
import { ProductSnsStack } from "../lib/product-sns/product-sns-stack";
import { AuthorizerStack } from "../lib/authorizer-stack";

const app = new cdk.App();
new DeployWebAppStack(app, "DeployWebAppStack", {});
new ProductStack(app, "ProductStack", {});
new ImportServiceStack(app, "ImportServiceStack", {});
new ProductSqsStack(app, "ProductSqsStack", {});
new ProductSnsStack(app, "ProductSnsStack", {});
new AuthorizerStack(app, "AuthorizerStack");
