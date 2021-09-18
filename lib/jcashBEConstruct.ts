import path from 'path';
import { Stack, Construct, Duration } from '@aws-cdk/core';
import {
  IResource,
  MockIntegration,
  LambdaIntegration,
  PassthroughBehavior,
  RestApi,
} from '@aws-cdk/aws-apigateway';
import { Runtime } from '@aws-cdk/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from '@aws-cdk/aws-lambda-nodejs';

interface FunctionProps {
  handler: string;
  entry: string;
  options?: NodejsFunctionProps;
}

export default class JCashBEConstruct extends Construct {
  constructor(parent: Stack, name: string) {
    super(parent, name);

    const testLambda = this.getFunctionConstruct({
      handler: 'handler',
      entry: 'handler',
    });

    const testLambdaIntegration = new LambdaIntegration(testLambda);

    const api = new RestApi(this, 'JCashAPI', {
      restApiName: 'JCash API',
      description: 'The JCash API Service',
    });

    const test = api.root.addResource('test');
    test.addMethod('GET', testLambdaIntegration);
    test.addMethod('POST', testLambdaIntegration);
    JCashBEConstruct.addCorsOptions(test);
  }

  getFunctionConstruct({
    handler,
    entry,
    options,
  }: FunctionProps): NodejsFunction {
    return new NodejsFunction(this, handler, {
      runtime: Runtime.NODEJS_14_X,
      functionName: `jcash-${handler}-${process.env.ENV}`,
      entry: path.resolve(__dirname, `../src/lambda/src/${entry}.ts`),
      handler,
      timeout: Duration.seconds(30),
      memorySize: 256,
      depsLockFilePath: path.resolve(__dirname, '../yarn.lock'),
      ...options,
    });
  }

  static addCorsOptions(apiResource: IResource) {
    apiResource.addMethod(
      'OPTIONS',
      new MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers':
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Credentials':
                "'false'",
              'method.response.header.Access-Control-Allow-Methods':
                "'OPTIONS,GET,PUT,POST,DELETE'",
            },
          },
        ],
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );
  }
}
