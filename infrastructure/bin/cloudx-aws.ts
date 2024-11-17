#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";
import { ProductStack } from "../lib/product-stack";
import { ImportServiceStack } from "../lib/import-service-stack";

const app = new cdk.App();
new DeployWebAppStack(app, "DeployWebAppStack", {});
new ProductStack(app, "ProductStack", {});
new ImportServiceStack(app, "ImportServiceStack", {});
