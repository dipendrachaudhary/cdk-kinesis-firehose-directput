// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as redshift from 'aws-cdk-lib/aws-redshift';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { SubnetType, Vpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

// export interface RedshiftStackProps extends StackProps {
// 	vpc: Vpc;
// 	ingressSecurityGroup: SecurityGroup;
// 	egressSecurityGroup: SecurityGroup;
// 	redshiftSecret: Secret;
// 	rdsSecret: Secret;
// }

export class RedshiftStack extends Stack {
    readonly cluster: redshift.CfnCluster;
    readonly role: Role;

    constructor(scope: App, id: string, props: StackProps) {
        super(scope, id, props);

       
       
        const role = new Role(this, 'Redshift-Federated-Query-Role', {
            assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
        });


        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'secretsmanager:GetResourcePolicy',
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
                'secretsmanager:ListSecretVersionIds'
            ],
            resources: [
                // props.redshiftSecret.secretArn, 
                // props.rdsSecret.secretArn
            ],
        }));

        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'secretsmanager:GetRandomPassword',
                'secretsmanager:ListSecrets'
            ],
            resources: ['*'],
        }));

        const vpc = new Vpc(this, 'TheVPC', {
            cidr: "10.0.0.0/16",
            maxAzs: 2,
            vpcName: 'reshift-vpc',

        });


        const selection = vpc.selectSubnets({
            subnetType: SubnetType.PRIVATE_WITH_NAT
        });


        this.cluster = new redshift.CfnCluster(this, 'redshift', {
            clusterType: 'multi-node',
            dbName: 'dev',
            masterUserPassword: 'Redshift123',
            masterUsername: 'redshift',
            nodeType: 'ra3.4xlarge',
            numberOfNodes: 2,
            iamRoles: [role.roleArn]


        });

    }
}
