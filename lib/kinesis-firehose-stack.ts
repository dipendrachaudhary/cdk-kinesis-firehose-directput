import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kinesisfirehose from '@aws-cdk/aws-kinesisfirehose-alpha'
import * as destinations from '@aws-cdk/aws-kinesisfirehose-destinations-alpha'
import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as redshift from 'aws-cdk-lib/aws-redshift';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { SubnetType, Vpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { aws_redshift } from 'aws-cdk-lib';

export class KinesisFirehoseStack extends Stack {
  readonly cluster: redshift.CfnCluster;
  readonly role: Role;
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // firehose
    const bucket = new s3.Bucket(this, 'kinesis-bucket')
  
    const s3Destination = new destinations.S3Bucket(bucket, {
    });

    const newFireHose = new kinesisfirehose.DeliveryStream(this, 'firehose',{
      destinations: [s3Destination],
    })

    //redshift
    const role = new Role(this, 'Redshift-Federated-Query-Role', {
      assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
  });


    // role.addToPolicy(new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: [
    //         'secretsmanager:GetResourcePolicy',
    //         'secretsmanager:GetSecretValue',
    //         'secretsmanager:DescribeSecret',
    //         'secretsmanager:ListSecretVersionIds'
    //     ],
    //     resources: [
    //         // props.redshiftSecret.secretArn, 
    //         // props.rdsSecret.secretArn
    //     ],
    // }));

    // role.addToPolicy(new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: [
    //         'secretsmanager:GetRandomPassword',
    //         'secretsmanager:ListSecrets'
    //     ],
    //     resources: ['*'],
    // }));

    const vpc = new Vpc(this, 'TheVPC', {
        cidr: "10.0.0.0/16",
        maxAzs: 2,
        vpcName: 'reshift-vpc',

    });


    const selection = vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_NAT
    });

    // const loggingPropertiesProperty: redshift.CfnCluster.LoggingPropertiesProperty = {
    //   bucketName: 'test0000007',
    //   //bucketName: bucket.bucketName,
    
    //   // the properties below are optional
    //   s3KeyPrefix: 's3KeyPrefix',
    // };

    this.cluster = new redshift.CfnCluster(this, 'redshift', {
        clusterType: 'multi-node',
        dbName: 'dev',
        masterUserPassword: 'Redshift123',
        masterUsername: 'redshift',
        nodeType: 'ra3.4xlarge',
        numberOfNodes: 2,
        iamRoles: [role.roleArn],
        //loggingProperties: loggingPropertiesProperty,
    });

    
  }
}
